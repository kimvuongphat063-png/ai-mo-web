package vn.family.kidsgamesplayer.player.speech

/**
 * Text-to-speech backend used by the speech channel (DECISIONS §22). The production
 * implementation is [AndroidTtsEngine]; tests use a fake. All methods and all [Listener]
 * callbacks run on the main thread.
 */
interface SpeechEngine {
    enum class State { INITIALIZING, READY, UNAVAILABLE }

    interface Listener {
        fun onStateChanged()
        fun onStart(utteranceId: String)
        fun onDone(utteranceId: String)
        fun onError(utteranceId: String, error: String)
        fun onRange(utteranceId: String, start: Int, end: Int)
    }

    data class Params(val voiceURI: String, val rate: Float, val pitch: Float, val volume: Float)

    val state: State

    /** Offline voices only, best first (see [VoiceCatalog]). */
    val voices: List<VoiceInfo>

    /** Human-readable engine name for parents/diagnostics, e.g. "Speech Services by Google". */
    val engineLabel: String?

    /** Last engine-level problem (init failure, rejected speak), for diagnostics. */
    val lastError: String?

    /** Time from [start] to a successful initialization, or -1. */
    val initMs: Long

    fun setListener(listener: Listener?)

    /** Starts initialization if needed; idempotent. */
    fun start()

    /** Queues [text] (QUEUE_ADD). Returns false if the engine refused it synchronously. */
    fun speak(utteranceId: String, text: String, params: Params): Boolean

    /** Stops the current utterance and drops everything queued in the engine. */
    fun stop()

    /** Re-reads the voice list (e.g. after the parent installed a voice); may re-initialize. */
    fun refresh()

    fun shutdown()
}

/** One offline voice as exposed to games through getVoices(). */
data class VoiceInfo(
    val voiceURI: String,
    val name: String,
    val lang: String,
    val isDefault: Boolean,
) {
    val isVietnamese: Boolean get() = VoiceCatalog.primary(lang) == "vi"
}

/** Engine-independent description of a platform voice, input of [VoiceCatalog.build]. */
data class RawVoice(
    val name: String,
    val languageTag: String,
    val quality: Int,
    val latency: Int,
    val networkRequired: Boolean,
    val notInstalled: Boolean,
    /**
     * For a per-language alias voice (Google: "vi-VN-language"): whether the engine reports
     * the language's data as installed (`isLanguageAvailable`); null when not checked.
     */
    val languageInstalled: Boolean? = null,
)
