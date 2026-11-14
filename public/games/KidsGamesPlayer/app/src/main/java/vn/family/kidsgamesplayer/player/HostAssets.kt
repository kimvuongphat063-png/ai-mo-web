package vn.family.kidsgamesplayer.player

import android.content.Context

/**
 * Files the host itself serves inside every game origin, under the reserved virtual
 * directory `/__kgp__/` (a game file with the same path is shadowed). They come from the
 * APK's assets, never from a game folder.
 */
object HostAssets {
    const val PREFIX = "__kgp__/"
    const val SPEECH_PATH = PREFIX + "speech-v1.js"
    private const val SPEECH_ASSET = "host/speech-v1.js"

    @Volatile private var speechShim: ByteArray? = null

    /** The speech shim bytes (read once from the APK); null only if the asset is missing. */
    fun speechShim(context: Context): ByteArray? {
        speechShim?.let { return it }
        val bytes = runCatching { context.applicationContext.assets.open(SPEECH_ASSET).use { it.readBytes() } }.getOrNull()
        speechShim = bytes
        return bytes
    }
}
