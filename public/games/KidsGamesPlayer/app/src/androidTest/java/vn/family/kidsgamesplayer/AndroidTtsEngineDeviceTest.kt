package vn.family.kidsgamesplayer

import android.os.SystemClock
import android.util.Log
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.player.speech.AndroidTtsEngine
import vn.family.kidsgamesplayer.player.speech.SpeechEngine
import java.util.Collections

/**
 * The real platform engine on this device: it must settle (ready or unavailable, never
 * stuck), offer offline voices only, and answer an utterance with a terminal callback.
 * Measurements go to logcat tag KgpTtsProbe (init time, voices, speak → onStart latency).
 */
@RunWith(AndroidJUnit4::class)
class AndroidTtsEngineDeviceTest {
    @Test
    fun platformEngineSettlesAndSpeaksOffline() {
        val inst = InstrumentationRegistry.getInstrumentation()
        val events = Collections.synchronizedList(mutableListOf<String>())
        lateinit var engine: AndroidTtsEngine
        inst.runOnMainSync {
            engine = AndroidTtsEngine(inst.targetContext)
            engine.setListener(object : SpeechEngine.Listener {
                override fun onStateChanged() = Unit
                override fun onStart(utteranceId: String) { events += "start@" + SystemClock.elapsedRealtime() }
                override fun onDone(utteranceId: String) { events += "done@" + SystemClock.elapsedRealtime() }
                override fun onError(utteranceId: String, error: String) { events += "error:$error" }
                override fun onRange(utteranceId: String, start: Int, end: Int) { events += "range" }
            })
            engine.start()
        }
        val settled = waitUntil(30_000) { engine.state != SpeechEngine.State.INITIALIZING }
        Log.i(TAG, "state=${engine.state} engine=${engine.engineLabel} initMs=${engine.initMs} error=${engine.lastError}")
        Log.i(TAG, "voices(${engine.voices.size})=" + engine.voices.joinToString { "${it.voiceURI}[${it.lang}]${if (it.isDefault) "*" else ""}" })
        logPlatformVoices()
        assertTrue("engine settled", settled)
        try {
            if (engine.state != SpeechEngine.State.READY || engine.voices.isEmpty()) {
                Log.i(TAG, "no offline voice: speak not attempted")
                return
            }
            val voice = engine.voices.firstOrNull { it.isVietnamese } ?: engine.voices.first()
            // In the app the engine starts with the menu, seconds before a game speaks: give the
            // voice warm-up the same head start, then two sentences one after the other.
            val headStart = InstrumentationRegistry.getArguments().getString("headStartMs")?.toLongOrNull() ?: 3_000L
            Log.i(TAG, "head start $headStart ms")
            SystemClock.sleep(headStart)
            for (n in 1..2) {
                events.clear()
                var submitted = 0L
                var accepted = false
                inst.runOnMainSync {
                    submitted = SystemClock.elapsedRealtime()
                    accepted = engine.speak("probe-$n", if (voice.isVietnamese) "Xin chào bé, mình cùng chơi nhé" else "Hello", SpeechEngine.Params(voice.voiceURI, 0.9f, 1.05f, 1f))
                }
                Log.i(TAG, "speak #$n with ${voice.voiceURI} accepted=$accepted")
                if (!accepted) return
                val ended = waitUntil(20_000) { events.any { it.startsWith("done") || it.startsWith("error") } }
                val start = events.firstOrNull { it.startsWith("start@") }?.substringAfter('@')?.toLong()
                val done = events.firstOrNull { it.startsWith("done@") }?.substringAfter('@')?.toLong()
                Log.i(TAG, "#$n events=${events.map { it.substringBefore('@') }} speak->start=${start?.minus(submitted)} ms, start->done=${if (start != null && done != null) done - start else null} ms")
                assertTrue("terminal callback for the utterance: $events", ended)
            }
        } finally {
            inst.runOnMainSync { engine.shutdown() }
        }
    }

    /** Raw platform view of the voices (features decide what "offline" means for each engine). */
    private fun logPlatformVoices() {
        val inst = InstrumentationRegistry.getInstrumentation()
        val ready = java.util.concurrent.CountDownLatch(1)
        var tts: android.speech.tts.TextToSpeech? = null
        inst.runOnMainSync { tts = android.speech.tts.TextToSpeech(inst.targetContext) { ready.countDown() } }
        ready.await(20, java.util.concurrent.TimeUnit.SECONDS)
        runCatching {
            tts?.voices?.filter { it.locale.language == "vi" || it.name.startsWith("en-us") }?.sortedBy { it.name }?.forEach { v ->
                Log.i(TAG, "raw ${v.name} ${v.locale.toLanguageTag()} q=${v.quality} l=${v.latency} net=${v.isNetworkConnectionRequired} features=${v.features}")
            }
            Log.i(TAG, "raw defaultVoice=${tts?.defaultVoice?.name} defaultEngine=${tts?.defaultEngine}")
            for (tag in listOf("vi-VN", "en-US", "de-DE", "ja-JP")) {
                Log.i(TAG, "raw isLanguageAvailable($tag)=${tts?.isLanguageAvailable(java.util.Locale.forLanguageTag(tag))}")
            }
        }
        inst.runOnMainSync { tts?.shutdown() }
    }

    private fun waitUntil(timeoutMs: Long, cond: () -> Boolean): Boolean {
        val end = SystemClock.elapsedRealtime() + timeoutMs
        while (SystemClock.elapsedRealtime() < end) {
            if (cond()) return true
            SystemClock.sleep(100)
        }
        return cond()
    }

    companion object {
        private const val TAG = "KgpTtsProbe"
    }
}
