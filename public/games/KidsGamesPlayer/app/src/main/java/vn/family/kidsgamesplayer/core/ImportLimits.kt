package vn.family.kidsgamesplayer.core

/**
 * Product policy limits for importing and serving games (bible §6.6).
 * These are project decisions, not Android limits; change them here only.
 */
data class ImportLimits(
    val maxGames: Int = 200,
    val maxFilesPerGame: Int = 2_000,
    val maxDirectoryDepth: Int = 12,
    val maxBytesPerGame: Long = 200L * MIB,
    val maxBytesPerFile: Long = 64L * MIB,
    val maxEntryHtmlBytes: Long = 4L * MIB,
    val maxManifestBytes: Long = 1L * MIB,
    val maxIconPixels: Int = 4096,
    val freeSpaceReserveBytes: Long = 100L * MIB,
    val maxDataUriChars: Int = (8L * MIB).toInt(),
    val maxTitleCodePoints: Int = 60,
) {
    companion object {
        const val MIB: Long = 1024L * 1024L
        val DEFAULT = ImportLimits()
    }
}
