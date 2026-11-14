package vn.family.kidsgamesplayer

import android.os.Handler
import android.os.Looper
import vn.family.kidsgamesplayer.player.speech.RawVoice
import vn.family.kidsgamesplayer.player.speech.SpeechEngine
import vn.family.kidsgamesplayer.player.speech.VoiceCatalog
import vn.family.kidsgamesplayer.player.speech.VoiceInfo
import java.util.concurrent.CopyOnWriteArrayList

/**
 * Test engine: offers a Vietnamese offline voice (plus English), records every utterance and
 * "speaks" each one for [durationMs] after [startDelayMs]. Main thread, like the real engine.
 */
class FakeSpeechEngine(
    private val rawVoices: List<RawVoice> = DEFAULT_VOICES,
    @Volatile var startDelayMs: Long = 40,
    @Volatile var durationMs: Long = 250,
) : SpeechEngine {
    data class Spoken(val utteranceId: String, val text: String, val params: SpeechEngine.Params)

    private val main = Handler(Looper.getMainLooper())
    private var listener: SpeechEngine.Listener? = null
    private val pending = mutableListOf<Runnable>()
    val spoken = CopyOnWriteArrayList<Spoken>()
    @Volatile var stops = 0
    @Volatile var finished = 0

    override var state = SpeechEngine.State.INITIALIZING
        private set
    override var voices: List<VoiceInfo> = emptyList()
        private set
    override val engineLabel = "Fake TTS"
    override val lastError: String? = null
    override val initMs = 0L

    override fun setListener(listener: SpeechEngine.Listener?) {
        this.listener = listener
    }

    override fun start() {
        if (state == SpeechEngine.State.READY) return
        voices = VoiceCatalog.build(rawVoices)
        state = SpeechEngine.State.READY
        main.post { listener?.onStateChanged() }
    }

    override fun speak(utteranceId: String, text: String, params: SpeechEngine.Params): Boolean {
        spoken += Spoken(utteranceId, text, params)
        val start = Runnable { listener?.onStart(utteranceId) }
        val done = Runnable {
            finished++
            listener?.onDone(utteranceId)
        }
        pending += start
        pending += done
        main.postDelayed(start, startDelayMs)
        main.postDelayed(done, startDelayMs + durationMs)
        return true
    }

    override fun stop() {
        stops++
        pending.forEach { main.removeCallbacks(it) }
        pending.clear()
    }

    override fun refresh() = Unit

    override fun shutdown() {
        stop()
        state = SpeechEngine.State.UNAVAILABLE
        voices = emptyList()
    }

    companion object {
        const val VI_VOICE = "vi-vn-x-fake-local"
        val DEFAULT_VOICES = listOf(
            RawVoice(VI_VOICE, "vi-VN", 400, 200, networkRequired = false, notInstalled = false),
            RawVoice("vi-vn-x-fake-network", "vi-VN", 500, 200, networkRequired = true, notInstalled = false),
            RawVoice("en-us-x-fake-local", "en-US", 400, 200, networkRequired = false, notInstalled = false),
        )
    }
}
