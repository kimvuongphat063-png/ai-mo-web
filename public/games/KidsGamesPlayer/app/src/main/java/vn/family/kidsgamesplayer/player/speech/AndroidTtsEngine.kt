package vn.family.kidsgamesplayer.player.speech

import android.content.Context
import android.media.AudioAttributes
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.speech.tts.Voice

/**
 * [SpeechEngine] on the platform `TextToSpeech` service (the same engine Chrome uses for
 * Web Speech). The app has no INTERNET permission and only ever selects voices that work
 * offline ([VoiceCatalog]); audio is played by the engine's own process with media usage.
 * Progress callbacks arrive on a binder thread and are re-posted to the main thread; those of
 * an older TextToSpeech instance (after re-initialization) are dropped.
 */
class AndroidTtsEngine(context: Context) : SpeechEngine {
    private val app = context.applicationContext
    private val main = Handler(Looper.getMainLooper())
    private var tts: TextToSpeech? = null
    private var generation = 0
    private var listener: SpeechEngine.Listener? = null
    private var platformVoices: Map<String, Voice> = emptyMap()
    private var boundEngine: String? = null
    private var currentVoice: String? = null
    private var initStartedAt = 0L
    private var lastInitAttempt = 0L
    private var failures = 0
    private var warmupPending = false

    override var state = SpeechEngine.State.UNAVAILABLE
        private set
    override var voices: List<VoiceInfo> = emptyList()
        private set
    override var engineLabel: String? = null
        private set
    override var lastError: String? = null
        private set
    override var initMs = -1L
        private set

    override fun setListener(listener: SpeechEngine.Listener?) {
        this.listener = listener
    }

    override fun start() {
        if (tts == null) init()
    }

    private fun init() {
        val gen = ++generation
        state = SpeechEngine.State.INITIALIZING
        initStartedAt = SystemClock.elapsedRealtime()
        lastInitAttempt = initStartedAt
        // The listener may run synchronously inside the constructor (no engine installed);
        // posting keeps `tts` assigned before onInit looks at it.
        tts = try {
            TextToSpeech(app) { status -> main.post { onInit(gen, status) } }
        } catch (e: RuntimeException) {
            lastError = "init: ${e.javaClass.simpleName}"
            state = SpeechEngine.State.UNAVAILABLE
            null
        }
        listener?.onStateChanged()
    }

    private fun onInit(gen: Int, status: Int) {
        if (gen != generation) return
        val t = tts ?: return
        if (status != TextToSpeech.SUCCESS) {
            lastError = "init status $status (no usable text-to-speech engine)"
            release()
            listener?.onStateChanged()
            return
        }
        try {
            t.setOnUtteranceProgressListener(Progress(gen))
            t.setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build(),
            )
            boundEngine = t.defaultEngine
            engineLabel = t.engines.firstOrNull { it.name == boundEngine }?.label ?: boundEngine
            loadVoices(t)
            preloadVietnamese(t)
            initMs = SystemClock.elapsedRealtime() - initStartedAt
            state = SpeechEngine.State.READY
        } catch (e: RuntimeException) {
            lastError = "setup: ${e.javaClass.simpleName}"
            release()
        }
        listener?.onStateChanged()
    }

    private fun loadVoices(t: TextToSpeech) {
        val platform = runCatching { t.voices?.toList() }.getOrNull().orEmpty()
        val concrete = platform.filter { !VoiceCatalog.isAlias(it.name) }
            .map { VoiceCatalog.normalize(it.locale.toLanguageTag()) }.toSet()
        val raw = platform.map { v ->
            val tag = v.locale.toLanguageTag()
            RawVoice(
                name = v.name,
                languageTag = tag,
                quality = v.quality,
                latency = v.latency,
                networkRequired = v.isNetworkConnectionRequired,
                notInstalled = v.features?.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED) == true,
                // Only asked for alias voices that are the engine's sole voice for their locale.
                languageInstalled = if (VoiceCatalog.isAlias(v.name) && VoiceCatalog.normalize(tag) !in concrete) {
                    runCatching { t.isLanguageAvailable(v.locale) >= TextToSpeech.LANG_AVAILABLE }.getOrDefault(false)
                } else {
                    null
                },
            )
        }
        val list = VoiceCatalog.build(raw, runCatching { t.defaultVoice?.name }.getOrNull())
        val names = list.map { it.voiceURI }.toSet()
        platformVoices = platform.filter { it.name in names }.associateBy { it.name }
        voices = list
    }

    /**
     * Selects the best Vietnamese voice and synthesizes one word of it into a cache file (no
     * audio output), so the engine has its model loaded before a game's first sentence.
     */
    private fun preloadVietnamese(t: TextToSpeech) {
        val vi = voices.firstOrNull { it.isVietnamese } ?: return
        if (currentVoice == vi.voiceURI) return
        val voice = platformVoices[vi.voiceURI] ?: return
        if (runCatching { t.setVoice(voice) }.getOrDefault(TextToSpeech.ERROR) != TextToSpeech.SUCCESS) return
        currentVoice = voice.name
        warmupPending = runCatching { t.synthesizeToFile("Xin chào", Bundle(), warmupFile(), WARMUP_ID) }
            .getOrDefault(TextToSpeech.ERROR) == TextToSpeech.SUCCESS
    }

    private fun warmupFile() = java.io.File(app.cacheDir, "tts-warmup.wav")

    override fun speak(utteranceId: String, text: String, params: SpeechEngine.Params): Boolean {
        val t = tts ?: return false
        if (state != SpeechEngine.State.READY) return false
        val voice = platformVoices[params.voiceURI] ?: return false
        return try {
            // A real sentence never waits behind the warm-up (QUEUE_ADD would put it after it).
            if (warmupPending) {
                warmupPending = false
                t.stop()
            }
            if (currentVoice != voice.name) {
                if (t.setVoice(voice) != TextToSpeech.SUCCESS) {
                    lastError = "setVoice ${voice.name} failed"
                    return speakFailed()
                }
                currentVoice = voice.name
            }
            t.setSpeechRate(params.rate)
            t.setPitch(params.pitch)
            val extras = Bundle().apply { putFloat(TextToSpeech.Engine.KEY_PARAM_VOLUME, params.volume) }
            if (t.speak(text, TextToSpeech.QUEUE_ADD, extras, utteranceId) == TextToSpeech.SUCCESS) {
                failures = 0
                true
            } else {
                lastError = "speak returned ERROR"
                speakFailed()
            }
        } catch (e: RuntimeException) {
            lastError = "speak: ${e.javaClass.simpleName}"
            speakFailed()
        }
    }

    /** Three refusals in a row usually mean the engine service died: bind a fresh instance. */
    private fun speakFailed(): Boolean {
        if (++failures >= 3) {
            failures = 0
            main.post { restart() }
        }
        return false
    }

    override fun stop() {
        warmupPending = false
        runCatching { tts?.stop() }
    }

    override fun refresh() {
        val t = tts
        if (t == null || state == SpeechEngine.State.UNAVAILABLE) {
            if (SystemClock.elapsedRealtime() - lastInitAttempt >= 5_000L) restart()
            return
        }
        if (state != SpeechEngine.State.READY) return
        val nowDefault = runCatching { t.defaultEngine }.getOrNull()
        if (nowDefault != null && nowDefault != boundEngine) {
            restart()
            return
        }
        val before = voices
        loadVoices(t)
        if (before != voices) {
            preloadVietnamese(t)
            listener?.onStateChanged()
        }
    }

    private fun restart() {
        release()
        init()
    }

    override fun shutdown() {
        release()
        listener?.onStateChanged()
    }

    private fun release() {
        generation++
        runCatching { tts?.shutdown() }
        tts = null
        currentVoice = null
        warmupPending = false
        platformVoices = emptyMap()
        voices = emptyList()
        state = SpeechEngine.State.UNAVAILABLE
    }

    private inner class Progress(private val gen: Int) : UtteranceProgressListener() {
        private fun post(id: String?, block: (SpeechEngine.Listener, String) -> Unit) {
            if (id == null) return
            if (id == WARMUP_ID) {
                // The warm-up file is only a side effect of loading the voice.
                main.post {
                    if (gen == generation) warmupPending = false
                    runCatching { warmupFile().delete() }
                }
                return
            }
            main.post {
                val l = listener
                if (gen == generation && l != null) block(l, id)
            }
        }

        override fun onStart(utteranceId: String?) = post(utteranceId) { l, id -> l.onStart(id) }

        override fun onDone(utteranceId: String?) = post(utteranceId) { l, id -> l.onDone(id) }

        @Deprecated("Deprecated in Java")
        override fun onError(utteranceId: String?) = post(utteranceId) { l, id -> l.onError(id, "synthesis-failed") }

        override fun onError(utteranceId: String?, errorCode: Int) = post(utteranceId) { l, id -> l.onError(id, webError(errorCode)) }

        // stop() was called by the app, which already settled the utterance.
        override fun onStop(utteranceId: String?, interrupted: Boolean) = Unit

        override fun onRangeStart(utteranceId: String?, start: Int, end: Int, frame: Int) =
            post(utteranceId) { l, id -> l.onRange(id, start, end) }
    }

    companion object {
        private const val WARMUP_ID = "kgp-warmup"

        fun webError(code: Int): String = when (code) {
            TextToSpeech.ERROR_SERVICE -> "synthesis-unavailable"
            TextToSpeech.ERROR_OUTPUT -> "audio-hardware"
            TextToSpeech.ERROR_NETWORK, TextToSpeech.ERROR_NETWORK_TIMEOUT -> "network"
            TextToSpeech.ERROR_INVALID_REQUEST -> "invalid-argument"
            TextToSpeech.ERROR_NOT_INSTALLED_YET -> "voice-unavailable"
            else -> "synthesis-failed"
        }
    }
}
