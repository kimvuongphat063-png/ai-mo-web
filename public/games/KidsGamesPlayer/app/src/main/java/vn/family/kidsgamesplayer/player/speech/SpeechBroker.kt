package vn.family.kidsgamesplayer.player.speech

import vn.family.kidsgamesplayer.player.speech.SpeechProtocol.Command

/**
 * Speech state of one game page (one channel). Plain Kotlin, main thread only.
 *
 * Utterances are handled one at a time, in order. While [audible] is false (sound off,
 * background, parent gate, confirm dialog, not playing) the engine is never called: the page
 * gets "start" and, after an estimated duration, "end", so a game's sentence chain keeps its
 * pace. When audibility is lost mid-sentence the engine is stopped and the page gets
 * "error: interrupted". After [close] nothing reaches the engine or the page any more.
 */
class SpeechBroker(
    private val tag: String,
    private val engine: SpeechEngine,
    private val send: (String) -> Unit,
    private val audible: () -> Boolean,
    private val clock: () -> Long,
    private val schedule: (delayMs: Long, block: () -> Unit) -> Cancellable,
    private val stats: SpeechStats,
    private val log: (String) -> Unit,
) {
    fun interface Cancellable {
        fun cancel()
    }

    private class Item(val cmd: Command.Speak, val utteranceId: String)

    private enum class Mode { ENGINE, SILENT }

    private val queue = ArrayDeque<Item>()
    private val accepted = ArrayDeque<Long>()
    private var current: Item? = null
    private var mode: Mode? = null
    private var submittedAt = 0L
    private var startSent = false
    private var silentTimer: Cancellable? = null
    private var helloSeen = false
    private var logBudget = 12

    var closed = false
        private set

    /** Utterance ids this broker sends to the engine all start with this prefix. */
    val utterancePrefix: String get() = "$tag-"

    fun onMessage(raw: String?) {
        if (closed) return
        when (val c = SpeechProtocol.parse(raw)) {
            is Command.Hello -> {
                helloSeen = true
                send(SpeechProtocol.voices(engine.voices))
            }
            is Command.Cancel -> dropAll()
            is Command.Speak -> enqueue(c)
            is Command.Invalid -> {
                stats.invalid++
                note("ignored message: ${c.reason}")
            }
        }
    }

    fun onVoicesChanged() {
        if (!closed && helloSeen) send(SpeechProtocol.voices(engine.voices))
    }

    /** Called whenever the player's audio policy may have changed. */
    fun onPolicyChanged() {
        if (closed) return
        val item = current ?: return
        if (mode == Mode.ENGINE && !audible()) {
            engine.stop()
            current = null
            mode = null
            send(SpeechProtocol.error(item.cmd.id, "interrupted"))
            next()
        }
    }

    fun close() {
        if (closed) return
        closed = true
        val speaking = mode == Mode.ENGINE && current != null
        queue.clear()
        current = null
        mode = null
        silentTimer?.cancel()
        silentTimer = null
        if (speaking) engine.stop()
    }

    // ---- engine callbacks (already on the main thread) ----------------------------------

    fun onEngineStart(utteranceId: String) {
        val item = engineItem(utteranceId) ?: return
        if (startSent) return
        startSent = true
        stats.recordLatency(clock() - submittedAt)
        send(SpeechProtocol.start(item.cmd.id))
    }

    fun onEngineDone(utteranceId: String) {
        val item = engineItem(utteranceId) ?: return
        if (!startSent) send(SpeechProtocol.start(item.cmd.id))
        stats.spoken++
        finish(item)
    }

    fun onEngineError(utteranceId: String, error: String) {
        val item = engineItem(utteranceId) ?: return
        stats.engineErrors++
        stats.lastEngineError = error
        fail(item, error, "engine error $error")
    }

    fun onEngineRange(utteranceId: String, start: Int, end: Int) {
        val item = engineItem(utteranceId) ?: return
        if (!startSent || start < 0 || end < start) return
        send(SpeechProtocol.boundary(item.cmd.id, start, end - start))
    }

    private fun engineItem(utteranceId: String): Item? {
        if (closed || mode != Mode.ENGINE) return null
        return current?.takeIf { it.utteranceId == utteranceId }
    }

    // ---- queue ----------------------------------------------------------------------------

    private fun enqueue(c: Command.Speak) {
        val now = clock()
        while (accepted.isNotEmpty() && now - accepted.first() >= 1_000L) accepted.removeFirst()
        if (queue.size >= MAX_QUEUE || accepted.size >= MAX_SPEAKS_PER_SECOND) {
            stats.rejected++
            note(if (queue.size >= MAX_QUEUE) "queue full, utterance refused" else "more than $MAX_SPEAKS_PER_SECOND speak/s, utterance refused")
            send(SpeechProtocol.error(c.id, "not-allowed"))
            return
        }
        if (current?.cmd?.id == c.id || queue.any { it.cmd.id == c.id }) {
            stats.invalid++
            note("duplicate utterance id ignored")
            return
        }
        accepted.addLast(now)
        if (c.truncated) {
            stats.truncated++
            note("text cut to ${SpeechProtocol.MAX_TEXT_CHARS} characters")
        }
        queue.addLast(Item(c, utterancePrefix + c.id))
        next()
    }

    private fun next() {
        if (closed || current != null) return
        val item = queue.removeFirstOrNull() ?: return
        current = item
        val c = item.cmd
        if (c.text.isBlank()) {
            send(SpeechProtocol.start(c.id))
            finish(item)
            return
        }
        if (!audible()) {
            mode = Mode.SILENT
            stats.silent++
            send(SpeechProtocol.start(c.id))
            silentTimer = schedule(silentDurationMs(c.text)) {
                silentTimer = null
                if (!closed && current === item && mode == Mode.SILENT) finish(item)
            }
            return
        }
        if (engine.state != SpeechEngine.State.READY) {
            fail(item, "synthesis-unavailable", "text-to-speech engine not ready")
            return
        }
        val voice = VoiceCatalog.resolve(engine.voices, c.voiceURI, c.lang)
        if (voice == null) {
            fail(item, "language-unavailable", "no offline voice for '${c.lang}'")
            return
        }
        mode = Mode.ENGINE
        startSent = false
        submittedAt = clock()
        if (!engine.speak(item.utteranceId, c.text, SpeechEngine.Params(voice.voiceURI, c.rate, c.pitch, c.volume))) {
            stats.engineErrors++
            stats.lastEngineError = "speak refused"
            fail(item, "synthesis-failed", "engine refused the utterance")
        }
    }

    private fun finish(item: Item) {
        if (current !== item) return
        current = null
        mode = null
        send(SpeechProtocol.end(item.cmd.id))
        next()
    }

    private fun fail(item: Item, error: String, why: String) {
        if (current !== item) return
        current = null
        mode = null
        note(why)
        send(SpeechProtocol.error(item.cmd.id, error))
        next()
    }

    /** Pending (not started) plus current utterances; for tests and diagnostics. */
    val inFlight: Int get() = queue.size + (if (current != null) 1 else 0)

    /** The page cancelled: it already settled its utterances, so nothing is sent back. */
    private fun dropAll() {
        val speaking = mode == Mode.ENGINE && current != null
        queue.clear()
        current = null
        mode = null
        silentTimer?.cancel()
        silentTimer = null
        if (speaking) engine.stop()
    }

    private fun note(message: String) {
        if (logBudget-- > 0) log("$tag: $message")
    }

    companion object {
        const val MAX_QUEUE = 20
        const val MAX_SPEAKS_PER_SECOND = 10

        /** Duration of a silent (policy-blocked) utterance: about 60 ms per character + 300 ms, at most 8 s. */
        fun silentDurationMs(text: String): Long = minOf(8_000L, 300L + 60L * text.length)
    }
}
