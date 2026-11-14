package vn.family.kidsgamesplayer.catalog

enum class ValidationLevel(val wire: String) {
    BASIC("basic"), VERIFIED("verified");

    companion object {
        fun fromWire(s: String?): ValidationLevel = entries.firstOrNull { it.wire == s } ?: BASIC
    }
}

enum class SourceState(val wire: String) {
    AVAILABLE("available"), MISSING("missing"), PERMISSION_LOST("permission_lost"),
    PROVIDER_ERROR("provider_error"), BUILTIN("builtin");

    companion object {
        fun fromWire(s: String?): SourceState = entries.firstOrNull { it.wire == s } ?: AVAILABLE
    }
}

/** One game known to the player (bible §7.2). Identity fields never change on update. */
data class GameRecord(
    val internalGameId: String,
    val logicalKey: String,
    val manifestId: String?,
    val sourceDirectoryUri: String?,
    val folderDisplayName: String,
    val title: String,
    val versionLabel: String?,
    val sortOrder: Int?,
    val storageOriginToken: String,
    val activeRevision: String?,
    val previousRevision: String?,
    val validationLevel: ValidationLevel,
    val sourceState: SourceState,
    val hidden: Boolean,
    val lastPlayedAt: Long?,
    val lastImportAt: Long?,
    val lastErrorCode: String?,
    val lastErrorDetail: String?,
    val playerApiVersion: Int?,
    val importedByteCount: Long,
    val backgroundColor: String?,
    val builtin: Boolean,
    val iconPath: String?,
    val manifestSha256: String?,
) {
    /** Visible in the child's menu: has a complete active revision and is not hidden. */
    val playable: Boolean get() = activeRevision != null
}

/** A source folder that could not be (re)imported; shown to parents only. */
data class SourceIssue(
    val folderName: String,
    val logicalKey: String?,
    val code: String,
    val detail: String,
    val at: Long,
    val attempts: Int,
    val nextRetryAt: Long,
    val signature: String?,
)

data class Catalog(
    val schemaVersion: Int = SCHEMA_VERSION,
    val selectedSourceUri: String? = null,
    val lastSuccessfulScan: Long? = null,
    val games: List<GameRecord> = emptyList(),
    val issues: List<SourceIssue> = emptyList(),
    val pendingOriginCleanups: List<String> = emptyList(),
    /** Raw JSON of records that failed to parse; preserved instead of silently dropped. */
    val quarantine: List<String> = emptyList(),
) {
    fun byId(id: String): GameRecord? = games.firstOrNull { it.internalGameId == id }
    fun byLogicalKey(key: String): GameRecord? = games.firstOrNull { it.logicalKey == key }

    fun replaceGame(record: GameRecord): Catalog =
        copy(games = games.map { if (it.internalGameId == record.internalGameId) record else it })

    companion object {
        const val SCHEMA_VERSION = 1
        val EMPTY = Catalog()
    }
}
