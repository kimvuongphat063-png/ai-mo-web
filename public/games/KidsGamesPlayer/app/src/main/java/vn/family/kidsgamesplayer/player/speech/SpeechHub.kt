package vn.family.kidsgamesplayer.player.speech

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.webkit.WebView
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import vn.family.kidsgamesplayer.BuildConfig
import vn.family.kidsgamesplayer.core.Diagnostics

/**
 * App-wide owner of the text-to-speech engine and of the single open speech channel (the
 * page currently playing). The engine is started early (menu) and shared; opening a channel
 * closes the previous one, so messages from an older page or session can never reach the
 * engine. Main thread only.
 */
class SpeechHub(
    context: Context,
    private val diagnostics: Diagnostics,
    private var engineFactory: (Context) -> SpeechEngine = { AndroidTtsEngine(it) },
) {
    data class Status(
        val state: SpeechEngine.State = SpeechEngine.State.UNAVAILABLE,
        val engineLabel: String? = null,
        val voices: List<VoiceInfo> = emptyList(),
        val lastError: String? = null,
    ) {
        val vietnameseVoice: VoiceInfo? get() = voices.firstOrNull { it.isVietnamese }
    }

    enum class TestResult { SPEAKING, SOUND_OFF, NO_VIETNAMESE_VOICE, NOT_READY, FAILED }

    private val app = context.applicationContext
    private val main = Handler(Looper.getMainLooper())
    private var engine: SpeechEngine? = null
    private var channel: SpeechChannel? = null
    private var testSerial = 0
    private var testActive = false
    private var lastState: SpeechEngine.State? = null
    val stats = SpeechStats()

    private val _status = MutableStateFlow(Status())
    val status: StateFlow<Status> = _status.asStateFlow()

    private val listener = object : SpeechEngine.Listener {
        override fun onStateChanged() {
            publish()
            channel?.broker?.onVoicesChanged()
        }

        override fun onStart(utteranceId: String) {
            route(utteranceId)?.onEngineStart(utteranceId)
        }

        override fun onDone(utteranceId: String) {
            if (utteranceId.startsWith(TEST_PREFIX)) testActive = false
            route(utteranceId)?.onEngineDone(utteranceId)
        }

        override fun onError(utteranceId: String, error: String) {
            if (utteranceId.startsWith(TEST_PREFIX)) {
                testActive = false
                stats.lastEngineError = error
            }
            route(utteranceId)?.onEngineError(utteranceId, error)
        }

        override fun onRange(utteranceId: String, start: Int, end: Int) {
            route(utteranceId)?.onEngineRange(utteranceId, start, end)
        }
    }

    private fun route(utteranceId: String): SpeechBroker? =
        channel?.broker?.takeIf { !it.closed && utteranceId.startsWith(it.utterancePrefix) }

    /** Starts the engine if needed (menu, parent area, game). */
    fun warmUp() {
        val e = engine ?: engineFactory(app).also {
            engine = it
            it.setListener(listener)
        }
        e.start()
        publish()
    }

    /** After returning from system settings: pick up newly installed voices or engines. */
    fun refresh() {
        engine?.refresh()
        publish()
    }

    fun shutdown() {
        closeChannel()
        engine?.let {
            it.setListener(null)
            it.shutdown()
        }
        engine = null
        publish()
    }

    /**
     * Opens the channel for the page loaded in [webView]. [tag] ("g<generation>-p<page>")
     * prefixes every utterance id; [audible] is the player's audio rule for this session.
     */
    fun openChannel(webView: WebView, origin: String, tag: String, audible: () -> Boolean): Boolean {
        closeChannel()
        warmUp()
        val e = engine ?: return false
        val ch = SpeechChannel.open(
            webView, origin,
            brokerFactory = { send ->
                SpeechBroker(tag, e, send, audible, SystemClock::elapsedRealtime, ::schedule, stats) { diagnostics.log("speech", it) }
            },
            onFailure = { diagnostics.log("speech", "$tag: channel not opened: $it") },
        ) ?: return false
        channel = ch
        stats.channels++
        return true
    }

    /** Stops speech of the current page at once and forgets its channel. */
    fun closeChannel() {
        channel?.close()
        channel = null
    }

    fun policyChanged() {
        channel?.broker?.onPolicyChanged()
    }

    /** Parent "Listen" button: one short sentence with the best Vietnamese voice. */
    fun testSpeak(text: String, soundEnabled: Boolean): TestResult {
        warmUp()
        val e = engine ?: return TestResult.NOT_READY
        if (!soundEnabled) return TestResult.SOUND_OFF
        if (e.state != SpeechEngine.State.READY) return TestResult.NOT_READY
        val voice = e.voices.firstOrNull { it.isVietnamese } ?: return TestResult.NO_VIETNAMESE_VOICE
        stopTest()
        testActive = true
        val ok = e.speak(TEST_PREFIX + (++testSerial), text, SpeechEngine.Params(voice.voiceURI, 0.9f, 1.05f, 1f))
        if (!ok) testActive = false
        return if (ok) TestResult.SPEAKING else TestResult.FAILED
    }

    fun stopTest() {
        if (!testActive) return
        testActive = false
        engine?.stop()
    }

    /** Replaces the engine (instrumentation tests on debug builds only). */
    fun replaceEngineForTest(factory: (Context) -> SpeechEngine) {
        check(BuildConfig.DEBUG) { "test hook" }
        shutdown()
        engineFactory = factory
        warmUp()
    }

    fun currentBrokerForTest(): SpeechBroker? = channel?.broker

    private fun schedule(delayMs: Long, block: () -> Unit): SpeechBroker.Cancellable {
        val r = Runnable(block)
        main.postDelayed(r, delayMs)
        return SpeechBroker.Cancellable { main.removeCallbacks(r) }
    }

    private fun publish() {
        val e = engine
        val s = if (e == null) Status() else Status(e.state, e.engineLabel, e.voices, e.lastError)
        if (e != null && e.state != lastState) {
            lastState = e.state
            if (e.state == SpeechEngine.State.READY) {
                stats.initMs = e.initMs
                diagnostics.log(
                    "speech",
                    "engine ${e.engineLabel ?: "?"} ready in ${e.initMs} ms: ${e.voices.size} offline voices, " +
                        "Vietnamese: ${e.voices.filter { it.isVietnamese }.joinToString { it.voiceURI }.ifEmpty { "none" }}",
                )
            } else if (e.state == SpeechEngine.State.UNAVAILABLE && e.lastError != null) {
                diagnostics.log("speech", "engine unavailable: ${e.lastError}")
            }
        }
        _status.value = s
    }

    companion object {
        private const val TEST_PREFIX = "parent-test-"
    }
}
