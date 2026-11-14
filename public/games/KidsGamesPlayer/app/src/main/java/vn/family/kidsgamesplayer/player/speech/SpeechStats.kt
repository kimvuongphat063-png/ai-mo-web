package vn.family.kidsgamesplayer.player.speech

/** Process-lifetime speech counters shown in the parent diagnostics. Main thread only. */
class SpeechStats {
    /** Utterances the engine finished speaking. */
    var spoken = 0
    /** Utterances answered with timed silence because the player was not audible. */
    var silent = 0
    /** Utterances refused by the queue / rate limits. */
    var rejected = 0
    var truncated = 0
    var invalid = 0
    var engineErrors = 0
    var lastEngineError: String? = null
    var channels = 0
    var initMs = -1L

    var lastLatencyMs = -1L
        private set
    private var latencyTotal = 0L
    private var latencyCount = 0

    val averageLatencyMs: Long get() = if (latencyCount == 0) -1L else latencyTotal / latencyCount
    val latencySamples: Int get() = latencyCount

    fun recordLatency(ms: Long) {
        if (ms < 0) return
        lastLatencyMs = ms
        latencyTotal += ms
        latencyCount++
    }
}
