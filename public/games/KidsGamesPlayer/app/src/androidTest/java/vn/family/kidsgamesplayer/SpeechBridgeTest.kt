package vn.family.kidsgamesplayer

import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.json.JSONObject
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.core.Diagnostics
import vn.family.kidsgamesplayer.player.GameSession
import vn.family.kidsgamesplayer.player.speech.RawVoice
import vn.family.kidsgamesplayer.player.speech.SpeechBroker
import vn.family.kidsgamesplayer.player.speech.SpeechHub

/**
 * Speech shim + WebMessagePort channel + broker in a real WebView (handover 5.2), with the
 * fake engine. Fixtures under test-fixtures/webview/speech* copy the games' speech pattern.
 */
@RunWith(AndroidJUnit4::class)
class SpeechBridgeTest {
    private lateinit var h: WebViewHarness
    private lateinit var hub: SpeechHub
    private var engine = FakeSpeechEngine()
    @Volatile private var audible = true
    private var page = 0

    @Before
    fun setUp() {
        h = WebViewHarness()
        h.instrumentation.runOnMainSync { hub = SpeechHub(h.appContext, Diagnostics(null)) { engine } }
    }

    @After
    fun tearDown() {
        h.instrumentation.runOnMainSync { hub.shutdown() }
        h.close()
    }

    /** Loads a fixture; like PlayerController, a new document closes the old channel and a loaded one gets a new channel. */
    private fun load(fixture: String, attach: Boolean = true): GameSession {
        val s = h.importFixture(fixture)
        h.events.onPageStartedHook = { hub.closeChannel() }
        h.events.onPageFinishedHook = if (attach) {
            { _ -> hub.openChannel(h.webView!!, s.origin, "g${s.generation}-p${++page}") { audible } }
        } else {
            null
        }
        h.load(s)
        return s
    }

    private fun results(): JSONObject = h.results()

    private fun log(): List<String> {
        val raw = h.eval("JSON.stringify(window.__results.log)") ?: return emptyList()
        val arr = org.json.JSONArray(org.json.JSONTokener(raw).nextValue() as String)
        return (0 until arr.length()).map { arr.getString(it) }
    }

    private fun waitVietnameseVoice() {
        assertTrue("vi voice visible to the page: ${results()}", h.waitUntil(10_000) {
            h.eval("window.__results.voiceName") == "\"${FakeSpeechEngine.VI_VOICE}\""
        })
    }

    private fun js(s: String) = JSONObject.quote(s)

    @Test
    fun shimIsTheFirstScriptInStandardsMode() {
        for (fixture in listOf("webview/speech", "webview/speech-nohead", "webview/speech-prolog")) {
            load(fixture)
            val r = results()
            assertTrue("$fixture: shim before page scripts: $r", r.getBoolean("shimFirst"))
            assertEquals(fixture, "/__kgp__/speech-v1.js", r.getString("firstScript"))
            assertEquals(fixture, "CSS1Compat", r.getString("compatMode"))
        }
        val prolog = results()
        assertEquals("Tiếng Việt", prolog.getString("title"))
        assertEquals(2, prolog.getInt("headScripts"))
        // The page's own CSP header still blocks inline eval; the shim needed none of it.
        assertTrue(h.events.messages.none { it.contains("speech-v1.js") })
    }

    @Test
    fun gamePatternSpeaksThroughTheEngineInOrder() {
        load("webview/speech")
        waitVietnameseVoice()
        // The network voice of the fake engine is never offered; names arrive intact.
        assertEquals(2, results().getInt("voiceCount"))
        assertEquals("\"Tiếng Việt (Việt Nam) · ${FakeSpeechEngine.VI_VOICE}\"",
            h.eval("speechSynthesis.getVoices().filter(function(v){return v.lang==='vi-VN';})[0].name"))
        h.eval("__speech.sayList(['Một con mèo', 'Hai con chó', 'Ba con gà'])")
        assertTrue("list finished: ${log()}", h.waitUntil(15_000) { h.eval("window.__results.listDone") == "true" })
        assertEquals(listOf("Một con mèo", "Hai con chó", "Ba con gà"), engine.spoken.map { it.text })
        engine.spoken.forEach {
            assertEquals(FakeSpeechEngine.VI_VOICE, it.params.voiceURI)
            assertEquals(0.9f, it.params.rate, 1e-4f)
            assertEquals(1.08f, it.params.pitch, 1e-4f)
            assertEquals(1f, it.params.volume, 1e-4f)
            assertTrue(it.utteranceId, it.utteranceId.matches(Regex("g\\d+-p\\d+-\\d+")))
        }
        assertEquals(
            listOf("start:Một con mèo", "end:Một con mèo", "start:Hai con chó", "end:Hai con chó", "start:Ba con gà", "end:Ba con gà"),
            log(),
        )
        assertEquals("false", h.eval("speechSynthesis.speaking || speechSynthesis.pending || speechSynthesis.paused"))
    }

    @Test
    fun cancelStopsTheEngineAndThePageGetsInterrupted() {
        engine.durationMs = 6_000
        load("webview/speech")
        waitVietnameseVoice()
        h.eval("__speech.say(${js("Một câu rất dài")})")
        assertTrue(h.waitUntil(5_000) { log().contains("start:Một câu rất dài") })
        assertEquals("true", h.eval("speechSynthesis.speaking"))
        h.eval("__speech.cancel()")
        assertTrue("interrupted: ${log()}", h.waitUntil(5_000) { log().contains("error:interrupted:Một câu rất dài") })
        assertTrue(h.waitUntil(3_000) { engine.stops >= 1 })
        assertEquals("false", h.eval("speechSynthesis.speaking"))
        // Busy -> cancel -> speak 90 ms later (the games' pattern) replaces the sentence.
        h.eval("__speech.say('Câu A')")
        assertTrue(h.waitUntil(5_000) { log().contains("start:Câu A") })
        h.eval("__speech.say('Câu B')")
        assertTrue("B spoken: ${log()}", h.waitUntil(8_000) { engine.spoken.any { it.text == "Câu B" } })
        assertTrue(log().contains("replaced:Câu A"))
    }

    @Test
    fun notAudibleMeansNoEngineButTheSentenceChainKeepsItsPace() {
        audible = false
        load("webview/speech")
        waitVietnameseVoice()
        h.eval("__speech.sayList(['Một', 'Hai', 'Ba'])")
        assertTrue("list finished: ${log()}", h.waitUntil(15_000) { h.eval("window.__results.listDone") == "true" })
        assertTrue("engine got nothing: ${engine.spoken}", engine.spoken.isEmpty())
        assertEquals(listOf("start:Một", "end:Một", "start:Hai", "end:Hai", "start:Ba", "end:Ba"), log())
        // Each silent sentence lasts ~300 ms + 60 ms/char (+140 ms gap in the game), so the chain is not instant.
        val expected = listOf("Một", "Hai", "Ba").sumOf { SpeechBroker.silentDurationMs(it) }
        val ms = h.eval("window.__results.listMs")!!.toLong()
        assertTrue("chain took $ms ms, silent estimate $expected ms", ms >= expected)

        // Audible again, then the policy turns off mid-sentence: the engine stops at once.
        audible = true
        engine.durationMs = 6_000
        h.eval("__speech.say('Đang đọc thì tắt tiếng')")
        assertTrue(h.waitUntil(5_000) { log().contains("start:Đang đọc thì tắt tiếng") })
        audible = false
        h.instrumentation.runOnMainSync { hub.policyChanged() }
        assertTrue("interrupted: ${log()}", h.waitUntil(5_000) { log().contains("error:interrupted:Đang đọc thì tắt tiếng") })
        assertEquals(1, engine.stops)
    }

    @Test
    fun longTextIsCutTo1000Characters() {
        load("webview/speech")
        waitVietnameseVoice()
        h.eval("__speech.say(new Array(1501).join('a'))")
        assertTrue(h.waitUntil(5_000) { engine.spoken.isNotEmpty() })
        assertEquals(1000, engine.spoken.single().text.length)
        assertTrue(h.waitUntil(5_000) { log().any { it.startsWith("end:") } })
    }

    @Test
    fun messagesOfAnOlderPageAreIgnored() {
        load("webview/speech")
        waitVietnameseVoice()
        var old: SpeechBroker? = null
        h.instrumentation.runOnMainSync { old = hub.currentBrokerForTest() }
        assertNotNull(old)
        // Same WebView, new document: the old channel closes, the new page gets its own.
        h.events.pageFinished.clear()
        h.eval("__speech.reload()")
        assertTrue(h.waitUntil(15_000) { h.events.pageFinished.isNotEmpty() })
        waitVietnameseVoice()
        var current: SpeechBroker? = null
        h.instrumentation.runOnMainSync { current = hub.currentBrokerForTest() }
        assertTrue(old!!.closed)
        assertTrue(current !== old && current?.closed == false)
        h.instrumentation.runOnMainSync {
            old!!.onMessage("""{"op":"speak","id":99,"text":"từ trang cũ","lang":"vi-VN"}""")
        }
        SystemClock.sleep(500)
        assertTrue(engine.spoken.none { it.text == "từ trang cũ" })
        h.eval("__speech.say('trang mới')")
        assertTrue(h.waitUntil(5_000) { engine.spoken.any { it.text == "trang mới" } })
    }

    @Test
    fun withoutTheAppTheGameStaysSilentAndTimed() {
        load("webview/speech", attach = false)
        SystemClock.sleep(3_000)
        val r = results()
        assertEquals(0, r.getInt("voiceCount"))
        assertTrue(r.isNull("voiceName"))
        h.eval("__speech.say('không ai đọc')")
        assertTrue("timed out cleanly: ${log()}", h.waitUntil(10_000) { log().any { it.endsWith(":không ai đọc") && !it.startsWith("start") } })
        assertFalse(log().contains("start:không ai đọc"))
        assertTrue(engine.spoken.isEmpty())
    }

    @Test
    fun withoutAVietnameseVoiceTheGameStaysSilent() {
        engine = FakeSpeechEngine(rawVoices = listOf(RawVoice("en-us-x-fake-local", "en-US", 400, 200, networkRequired = false, notInstalled = false)))
        load("webview/speech")
        assertTrue(h.waitUntil(10_000) { h.eval("window.__results.voiceCount") == "1" })
        assertNull(results().opt("voiceName").takeIf { it != JSONObject.NULL })
    }
}
