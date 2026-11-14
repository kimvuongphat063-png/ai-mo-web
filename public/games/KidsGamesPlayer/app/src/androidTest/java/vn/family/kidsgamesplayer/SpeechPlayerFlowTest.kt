package vn.family.kidsgamesplayer

import android.os.SystemClock
import android.view.View
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONTokener
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.player.PlayerController
import vn.family.kidsgamesplayer.player.speech.AndroidTtsEngine
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * The real player with the fake engine: the game's voice follows the app's audio rule
 * (sound button, restart dialog, leaving the game) — handover 3.3 / 5.2.
 */
@RunWith(AndroidJUnit4::class)
class SpeechPlayerFlowTest {
    private val inst = InstrumentationRegistry.getInstrumentation()
    private var activity: MainActivity? = null

    private fun <T> on(sc: ActivityScenario<MainActivity>, block: (MainActivity) -> T): T {
        if (activity == null) sc.onActivity { activity = it }
        var out: T? = null
        inst.runOnMainSync { out = block(activity!!) }
        @Suppress("UNCHECKED_CAST")
        return out as T
    }

    private fun waitUntil(timeoutMs: Long = 15_000, cond: () -> Boolean): Boolean {
        val end = SystemClock.elapsedRealtime() + timeoutMs
        while (SystemClock.elapsedRealtime() < end) {
            if (cond()) return true
            SystemClock.sleep(100)
        }
        return cond()
    }

    private fun eval(sc: ActivityScenario<MainActivity>, script: String): String? {
        val latch = CountDownLatch(1)
        val out = AtomicReference<String?>()
        on(sc) { act ->
            val wv = act.player?.currentWebViewForTest()
            if (wv == null) latch.countDown() else wv.evaluateJavascript(script) { out.set(it); latch.countDown() }
        }
        latch.await(5, TimeUnit.SECONDS)
        return out.get()
    }

    private fun log(sc: ActivityScenario<MainActivity>): List<String> {
        val raw = eval(sc, "JSON.stringify(window.__t || [])") ?: return emptyList()
        val arr = JSONArray(JSONTokener(raw).nextValue() as String)
        return (0 until arr.length()).map { arr.getString(it) }
    }

    /** Speaks like the games do, recording events in window.__t. */
    private fun say(sc: ActivityScenario<MainActivity>, text: String) {
        eval(
            sc,
            "(function(){window.__t=window.__t||[];var v=speechSynthesis.getVoices().filter(function(x){return /^vi/.test(x.lang);})[0];" +
                "var u=new SpeechSynthesisUtterance(${org.json.JSONObject.quote(text)});u.voice=v;u.lang=v.lang;u.rate=0.9;" +
                "u.onstart=function(){__t.push('start:'+u.text)};u.onend=function(){__t.push('end:'+u.text)};" +
                "u.onerror=function(e){__t.push(e.error+':'+u.text)};speechSynthesis.speak(u);})()",
        )
    }

    @Test
    fun voiceFollowsSoundButtonRestartDialogAndHome() {
        val engine = FakeSpeechEngine(durationMs = 5_000)
        val graph = inst.targetContext.graph
        inst.runOnMainSync {
            graph.settings.update { it.copy(soundEnabled = true, speechEnabled = true) }
            graph.speech.replaceEngineForTest { engine }
        }
        try {
            ActivityScenario.launch(MainActivity::class.java).use { sc ->
                assertTrue(waitUntil { on(sc) { it.screen } in setOf(MainActivity.Screen.SETUP, MainActivity.Screen.MENU) })
                on(sc) { if (it.screen == MainActivity.Screen.SETUP) it.findViewById<View>(R.id.setup_try).performClick() }
                assertTrue(waitUntil { on(sc) { it.screen } == MainActivity.Screen.MENU })
                assertTrue(waitUntil(20_000) { on(sc) { it.findViewById<RecyclerView>(R.id.grid).childCount } >= 1 })
                on(sc) { it.findViewById<RecyclerView>(R.id.grid).getChildAt(0).performClick() }
                assertTrue(waitUntil { on(sc) { it.player?.phase } == PlayerController.Phase.PLAYING })
                assertTrue("vi voice in the game page", waitUntil(10_000) {
                    eval(sc, "speechSynthesis.getVoices().some(function(v){return v.lang==='vi-VN';})") == "true"
                })

                // Audible: spoken by the engine.
                say(sc, "Một")
                assertTrue(waitUntil(5_000) { log(sc).contains("start:Một") })
                assertEquals(listOf("Một"), engine.spoken.map { it.text })

                // Sound button off: stops at once; the next sentence is silent but still ends.
                on(sc) { it.findViewById<View>(R.id.btn_sound).performClick() }
                assertTrue("interrupted: ${log(sc)}", waitUntil(5_000) { log(sc).contains("interrupted:Một") })
                assertTrue(engine.stops >= 1)
                say(sc, "Hai")
                assertTrue("silent end: ${log(sc)}", waitUntil(5_000) { log(sc).contains("end:Hai") })
                assertEquals(listOf("Một"), engine.spoken.map { it.text })

                // Sound on again, then the restart dialog: no voice while it is open.
                on(sc) { it.findViewById<View>(R.id.btn_sound).performClick() }
                on(sc) { it.findViewById<View>(R.id.btn_restart).performClick() }
                assertTrue(waitUntil { on(sc) { it.findViewById<View>(R.id.confirm_overlay).visibility } == View.VISIBLE })
                say(sc, "Ba")
                assertTrue(waitUntil(5_000) { log(sc).contains("end:Ba") })
                assertEquals(listOf("Một"), engine.spoken.map { it.text })
                on(sc) { it.findViewById<View>(R.id.confirm_no).performClick() }
                say(sc, "Bốn")
                assertTrue(waitUntil(5_000) { engine.spoken.map { it.text } == listOf("Một", "Bốn") })

                // Home: the sentence stops right away (before the save wait) and the channel is gone.
                val stopsBefore = engine.stops
                on(sc) { it.findViewById<View>(R.id.btn_home).performClick() }
                assertTrue(waitUntil(3_000) { engine.stops > stopsBefore })
                assertTrue(waitUntil { on(sc) { it.screen } == MainActivity.Screen.MENU })
                assertEquals(null, on(sc) { graph.speech.currentBrokerForTest() })
            }
        } finally {
            inst.runOnMainSync {
                graph.settings.update { it.copy(soundEnabled = true) }
                graph.speech.replaceEngineForTest { AndroidTtsEngine(it) }
            }
        }
    }
}
