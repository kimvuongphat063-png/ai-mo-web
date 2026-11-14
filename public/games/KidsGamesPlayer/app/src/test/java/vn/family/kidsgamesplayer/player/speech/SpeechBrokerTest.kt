package vn.family.kidsgamesplayer.player.speech

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

/** Queue, limits and audio policy of one page's speech (handover 4.6, 5.1). */
class SpeechBrokerTest {

    private class Engine : SpeechEngine {
        override var state = SpeechEngine.State.READY
        override var voices = VoiceCatalog.build(
            listOf(RawVoice("vi-vn-x-fake-local", "vi-VN", 400, 200, false, false), RawVoice("en-us-x-fake-local", "en-US", 400, 200, false, false)),
        )
        override val engineLabel = "fake"
        override val lastError: String? = null
        override val initMs = 0L
        val spoken = mutableListOf<Pair<String, String>>()
        val params = mutableListOf<SpeechEngine.Params>()
        var stops = 0
        var accept = true
        override fun setListener(listener: SpeechEngine.Listener?) = Unit
        override fun start() = Unit
        override fun speak(utteranceId: String, text: String, params: SpeechEngine.Params): Boolean {
            if (!accept) return false
            spoken += utteranceId to text
            this.params += params
            return true
        }
        override fun stop() { stops++ }
        override fun refresh() = Unit
        override fun shutdown() = Unit
    }

    private var now = 0L
    private val timers = mutableListOf<Pair<Long, () -> Unit>>()
    private val sent = mutableListOf<JSONObject>()
    private var audible = true
    private val engine = Engine()
    private val stats = SpeechStats()
    private val logs = mutableListOf<String>()
    private val broker = SpeechBroker(
        tag = "g1-p1",
        engine = engine,
        send = { sent += JSONObject(it) },
        audible = { audible },
        clock = { now },
        schedule = { delay, block ->
            val entry = (now + delay) to block
            timers += entry
            SpeechBroker.Cancellable { timers.remove(entry) }
        },
        stats = stats,
        log = { logs += it },
    )

    private fun advance(ms: Long) {
        now += ms
        while (true) {
            val due = timers.filter { it.first <= now }.minByOrNull { it.first } ?: break
            timers.remove(due)
            due.second()
        }
    }

    private fun speak(id: Int, text: String = "Câu $id", extra: String = "") =
        broker.onMessage("""{"op":"speak","id":$id,"text":"$text","lang":"vi-VN","voice":"vi-vn-x-fake-local","rate":0.9,"pitch":1.08,"volume":1$extra}""")

    private fun events() = sent.filter { it.has("id") }.map { it.getString("t") + ":" + it.getInt("id") + (if (it.has("error")) ":" + it.getString("error") else "") }

    @Test
    fun helloAnswersWithOfflineVoices() {
        broker.onMessage("""{"op":"hello","v":1}""")
        val v = sent.single()
        assertEquals("voices", v.getString("t"))
        assertEquals("vi-vn-x-fake-local", v.getJSONArray("voices").getJSONObject(0).getString("voiceURI"))
        // Voice changes are pushed only after hello.
        broker.onVoicesChanged()
        assertEquals(2, sent.size)
    }

    @Test
    fun audibleUtterancesGoToTheEngineOneAtATimeInOrder() {
        speak(1)
        speak(2)
        speak(3)
        assertEquals(listOf("g1-p1-1" to "Câu 1"), engine.spoken)
        assertEquals(SpeechEngine.Params("vi-vn-x-fake-local", 0.9f, 1.08f, 1f), engine.params.single())
        now += 120
        broker.onEngineStart("g1-p1-1")
        assertEquals(120L, stats.lastLatencyMs)
        broker.onEngineDone("g1-p1-1")
        assertEquals("g1-p1-2", engine.spoken.last().first)
        broker.onEngineStart("g1-p1-2")
        broker.onEngineRange("g1-p1-2", 4, 5)
        broker.onEngineDone("g1-p1-2")
        broker.onEngineDone("g1-p1-3") // no start: a start is sent first
        assertEquals(listOf("start:1", "end:1", "start:2", "boundary:2", "end:2", "start:3", "end:3"), events())
        assertEquals(3, stats.spoken)
        assertEquals(0, broker.inFlight)
    }

    @Test
    fun notAudibleMeansNoEngineButTimedStartAndEnd() {
        audible = false
        speak(1, "Một hai ba")
        speak(2, "Bốn")
        assertTrue(engine.spoken.isEmpty())
        assertEquals(listOf("start:1"), events())
        advance(SpeechBroker.silentDurationMs("Một hai ba") - 1)
        assertEquals(listOf("start:1"), events())
        advance(1)
        assertEquals(listOf("start:1", "end:1", "start:2"), events())
        advance(SpeechBroker.silentDurationMs("Bốn"))
        assertEquals(listOf("start:1", "end:1", "start:2", "end:2"), events())
        assertTrue(engine.spoken.isEmpty())
        assertEquals(2, stats.silent)
        assertEquals(8_000L, SpeechBroker.silentDurationMs("x".repeat(1000)))
        assertEquals(360L, SpeechBroker.silentDurationMs("x"))
    }

    @Test
    fun losingAudibilityStopsTheEngineAndTheRestStaysSilent() {
        speak(1)
        speak(2)
        broker.onEngineStart("g1-p1-1")
        audible = false
        broker.onPolicyChanged()
        assertEquals(1, engine.stops)
        assertEquals(listOf("start:1", "error:1:interrupted", "start:2"), events())
        // A late callback from the stopped utterance changes nothing.
        broker.onEngineDone("g1-p1-1")
        assertEquals(1, engine.spoken.size)
        advance(10_000)
        assertEquals(listOf("start:1", "error:1:interrupted", "start:2", "end:2"), events())
        // Back to audible: the next utterance is spoken again.
        audible = true
        broker.onPolicyChanged()
        speak(3)
        assertEquals("g1-p1-3", engine.spoken.last().first)
    }

    @Test
    fun pageCancelStopsTheEngineWithoutEchoingEvents() {
        speak(1)
        speak(2)
        broker.onEngineStart("g1-p1-1")
        sent.clear()
        broker.onMessage("""{"op":"cancel"}""")
        assertEquals(1, engine.stops)
        assertEquals(0, broker.inFlight)
        broker.onEngineDone("g1-p1-1")
        assertTrue(sent.isEmpty())
        speak(3)
        assertEquals("g1-p1-3", engine.spoken.last().first)
        // Cancel while silent drops the timer.
        audible = false
        broker.onEngineDone("g1-p1-3")
        speak(4)
        broker.onMessage("""{"op":"cancel"}""")
        sent.clear()
        advance(10_000)
        assertTrue(sent.isEmpty())
    }

    @Test
    fun queueAndRateLimits() {
        repeat(10) { speak(it + 1) }
        speak(11)
        assertEquals("error:11:not-allowed", events().last())
        now += 1_000
        repeat(10) { speak(it + 12) }  // 1 speaking + 19 waiting
        now += 1_000
        speak(22)                        // 20 waiting
        speak(23)
        assertEquals("error:23:not-allowed", events().last())
        assertEquals(2, stats.rejected)
        assertEquals(21, broker.inFlight)
    }

    @Test
    fun failuresAreReportedPerUtterance() {
        speak(1, extra = ",\"unknownField\":\"ignored\"")
        speak(2)
        broker.onEngineError("g1-p1-1", "synthesis-failed")
        assertEquals(listOf("error:1:synthesis-failed"), events())
        assertEquals("g1-p1-2", engine.spoken.last().first)
        broker.onEngineDone("g1-p1-2")
        // No voice for the language.
        broker.onMessage("""{"op":"speak","id":3,"text":"こんにちは","lang":"ja-JP"}""")
        assertEquals("error:3:language-unavailable", events().last())
        // Engine refuses.
        engine.accept = false
        speak(4)
        assertEquals("error:4:synthesis-failed", events().last())
        // Engine not ready.
        engine.accept = true
        engine.state = SpeechEngine.State.INITIALIZING
        speak(5)
        assertEquals("error:5:synthesis-unavailable", events().last())
        // Empty text: start + end, no engine call.
        engine.state = SpeechEngine.State.READY
        val before = engine.spoken.size
        broker.onMessage("""{"op":"speak","id":6,"text":"   "}""")
        assertEquals(listOf("start:6", "end:6"), events().takeLast(2))
        assertEquals(before, engine.spoken.size)
    }

    @Test
    fun longTextIsCutAndBadMessagesAreIgnored() {
        broker.onMessage("""{"op":"speak","id":1,"text":"${"a".repeat(1500)}","lang":"vi-VN"}""")
        assertEquals(SpeechProtocol.MAX_TEXT_CHARS, engine.spoken.single().second.length)
        assertEquals(1, stats.truncated)
        broker.onMessage("{oops")
        broker.onMessage("""{"op":"launchMissiles"}""")
        speak(1) // duplicate id while still in flight
        assertEquals(3, stats.invalid)
        assertEquals(1, engine.spoken.size)
        assertTrue(logs.any { it.startsWith("g1-p1: ") })
    }

    @Test
    fun closedBrokerIgnoresEverything() {
        speak(1)
        broker.onEngineStart("g1-p1-1")
        broker.close()
        assertEquals(1, engine.stops)
        sent.clear()
        broker.onEngineDone("g1-p1-1")
        speak(2)
        broker.onMessage("""{"op":"hello","v":1}""")
        broker.onPolicyChanged()
        broker.onVoicesChanged()
        assertTrue(sent.isEmpty())
        assertEquals(1, engine.spoken.size)
    }
}
