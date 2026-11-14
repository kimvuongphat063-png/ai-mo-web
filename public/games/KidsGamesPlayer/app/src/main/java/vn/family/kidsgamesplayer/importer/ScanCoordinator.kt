package vn.family.kidsgamesplayer.importer

import java.io.IOException
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import vn.family.kidsgamesplayer.catalog.Catalog
import vn.family.kidsgamesplayer.catalog.CatalogRepository
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.catalog.SourceIssue
import vn.family.kidsgamesplayer.catalog.SourceState
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.core.Diagnostics
import vn.family.kidsgamesplayer.core.ErrorCodes
import vn.family.kidsgamesplayer.core.Ids
import vn.family.kidsgamesplayer.core.ImportLimits
import vn.family.kidsgamesplayer.core.ManifestParser
import vn.family.kidsgamesplayer.source.SourceAccessException
import vn.family.kidsgamesplayer.source.SourceRoot

enum class ScanKind { SHALLOW, FULL, DEEP }

data class ScanStatus(
    val running: Boolean = false,
    val lastKind: ScanKind? = null,
    val lastFinishedAt: Long? = null,
    val lastSummary: String? = null,
)

data class ScanReport(var imported: Int = 0, var unchanged: Int = 0, var failed: Int = 0, var skipped: Int = 0) {
    override fun toString() = "imported=$imported unchanged=$unchanged failed=$failed deferred=$skipped"
}

/**
 * Discovers candidates and runs at most one import at a time (bible §6.2–6.5). Requests
 * are coalesced: while a scan runs, further requests collapse into one follow-up scan of
 * the strongest requested kind. Catalog commits go through [CatalogRepository].
 */
class ScanCoordinator(
    private val scope: CoroutineScope,
    private val io: CoroutineDispatcher,
    private val repo: CatalogRepository,
    private val importer: GameImporter,
    private val revisions: RevisionStore,
    private val builtinRoot: SourceRoot?,
    private val sourceRootFactory: (String) -> SourceRoot,
    private val hasGrant: (String) -> Boolean,
    private val diagnostics: Diagnostics,
    private val limits: ImportLimits = ImportLimits.DEFAULT,
    private val clock: () -> Long = System::currentTimeMillis,
) {
    private val scanMutex = Mutex()
    private val lock = Any()
    private var pending: ScanKind? = null
    private var worker: Job? = null

    private val _status = MutableStateFlow(ScanStatus())
    val status: StateFlow<ScanStatus> = _status.asStateFlow()

    val isRunning: Boolean get() = _status.value.running

    fun request(kind: ScanKind) {
        synchronized(lock) {
            val p = pending
            pending = if (p == null || kind.ordinal > p.ordinal) kind else p
            if (worker?.isActive == true) return
            worker = scope.launch {
                while (true) {
                    val next = synchronized(lock) { pending.also { pending = null } } ?: break
                    runCatching { runNow(next) }.onFailure { diagnostics.log("scan", "scan failed: ${it.javaClass.simpleName}: ${it.message}") }
                }
            }
        }
    }

    /** Runs one scan synchronously (serialized with any other scan). Used by tests and the worker. */
    suspend fun runNow(kind: ScanKind): ScanReport = scanMutex.withLock {
        _status.value = _status.value.copy(running = true)
        val report = ScanReport()
        try {
            withContext(io) {
                builtinRoot?.let { scanRoot(it, kind, report) }
                val selected = repo.current.selectedSourceUri
                var sourceOk = selected == null
                if (selected != null) {
                    if (!hasGrant(selected)) {
                        markExternalSources(SourceState.PERMISSION_LOST)
                        diagnostics.log("scan", "source grant missing")
                    } else {
                        sourceOk = scanRoot(sourceRootFactory(selected), kind, report)
                    }
                }
                collectGarbage()
                if (sourceOk) repo.update { it.copy(lastSuccessfulScan = clock()) to Unit }
            }
        } finally {
            _status.value = ScanStatus(false, kind, clock(), report.toString())
        }
        if (report.imported > 0 || report.failed > 0) diagnostics.log("scan", "$kind $report")
        report
    }

    /** Returns false when the root could not be listed. */
    private suspend fun scanRoot(root: SourceRoot, kind: ScanKind, report: ScanReport): Boolean {
        val builtin = root.isBuiltin
        val folders = try {
            root.listGameFolders()
        } catch (e: SourceAccessException) {
            if (!builtin) markExternalSources(if (e.code == ErrorCodes.PERMISSION_LOST) SourceState.PERMISSION_LOST else SourceState.PROVIDER_ERROR)
            diagnostics.log("scan", "list failed: ${e.code}")
            return false
        } catch (e: IOException) {
            if (!builtin) markExternalSources(SourceState.PROVIDER_ERROR)
            diagnostics.log("scan", "list failed: ${e.message}")
            return false
        } catch (e: SecurityException) {
            if (!builtin) markExternalSources(SourceState.PERMISSION_LOST)
            return false
        }

        val issueKey = { folder: String -> if (builtin) "builtin:$folder" else folder }
        val prepared = folders.map { importer.prepare(it, allowBuiltinNamespace = builtin) }
        val presentFolders = folders.map { issueKey(java.text.Normalizer.normalize(it.name, java.text.Normalizer.Form.NFC)) }.toSet()
        val seenKeys = HashSet<String>()

        val failedFolders = HashSet<String>()
        for (p in prepared.filterIsInstance<GameImporter.Prepared.Failed>()) {
            failedFolders += p.folderName
            recordFailure(issueKey(p.folderName), null, p.code, p.detail, p.retryable, null)
            // A known game whose game.json broke keeps its snapshot; the parent sees why.
            repo.current.games.firstOrNull { it.builtin == builtin && it.folderDisplayName == p.folderName }?.let {
                commitRecord(it.copy(lastErrorCode = p.code, lastErrorDetail = p.detail.take(200)))
            }
            report.failed++
        }
        var candidates = prepared.filterIsInstance<GameImporter.Prepared.Ok>().map { it.candidate }
        if (builtin) {
            candidates = candidates.filter { c ->
                val ok = c.manifest.id?.startsWith(ManifestParser.BUILTIN_PREFIX) == true
                if (!ok) diagnostics.log("scan", "builtin without builtin id: ${c.folderName}")
                ok
            }
        }
        val groups = candidates.groupBy { it.logicalKey }
        for ((key, group) in groups) {
            seenKeys += key
            if (group.size > 1) {
                val names = group.joinToString { it.folderName }
                group.forEach { recordFailure(issueKey(it.folderName), key, ErrorCodes.DUPLICATE_ID, names, false, it.manifestSha256) }
                repo.current.byLogicalKey(key)?.let { rec ->
                    commitRecord(rec.copy(lastErrorCode = ErrorCodes.DUPLICATE_ID, lastErrorDetail = names.take(200)))
                }
                report.failed += group.size
                continue
            }
            val candidate = group.single()
            processCandidate(candidate, issueKey(candidate.folderName), builtin, kind, report)
        }

        // Folders that disappeared: keep snapshots and saves, only flag the source state.
        val vanished = repo.current.games.filter {
            it.builtin == builtin && it.logicalKey !in seenKeys && it.folderDisplayName !in failedFolders &&
                it.sourceState != SourceState.MISSING
        }
        for (rec in vanished) commitRecord(rec.copy(sourceState = SourceState.MISSING))
        repo.update { cat ->
            val keep = cat.issues.filter { issue ->
                val mine = issue.folderName.startsWith("builtin:") == builtin
                !mine || issue.folderName in presentFolders
            }
            if (keep.size == cat.issues.size) cat to Unit else cat.copy(issues = keep) to Unit
        }
        return true
    }

    private suspend fun processCandidate(
        candidate: GameImporter.Candidate,
        issueKey: String,
        builtin: Boolean,
        kind: ScanKind,
        report: ScanReport,
    ) {
        val now = clock()
        val existing = repo.current.byLogicalKey(candidate.logicalKey)
        val issue = repo.current.issues.firstOrNull { it.folderName == issueKey }
        val activeOk = existing?.activeRevision?.let { revisions.isComplete(existing.internalGameId, it) } == true
        val needImport = when {
            existing == null -> true
            !activeOk -> true
            candidate.manifestSha256 != existing.manifestSha256 -> true
            candidate.validationLevel == ValidationLevel.BASIC && kind != ScanKind.SHALLOW -> true
            else -> false
        }
        if (!needImport) {
            touchAvailable(existing!!, candidate, builtin)
            clearIssue(issueKey)
            report.unchanged++
            return
        }
        if (existing == null && repo.current.games.size >= limits.maxGames) {
            recordFailure(issueKey, candidate.logicalKey, ErrorCodes.QUOTA_GAMES, "${limits.maxGames}", false, candidate.manifestSha256)
            report.failed++
            return
        }
        if (issue != null && kind != ScanKind.DEEP && issue.nextRetryAt > now && issue.signature == candidate.manifestSha256) {
            report.skipped++
            return
        }
        val gameId = existing?.internalGameId ?: Ids.newInternalGameId()
        val attempts = issue?.attempts ?: 0
        when (val outcome = importer.import(candidate, gameId, existing?.activeRevision, allowMissingReferences = attempts >= 3)) {
            is GameImporter.Outcome.Imported -> {
                commitImported(candidate, gameId, outcome, builtin)
                clearIssue(issueKey)
                report.imported++
                if (outcome.warnings.isNotEmpty()) diagnostics.log("import", "${candidate.folderName}: " + outcome.warnings.joinToString("; ").take(300))
            }
            is GameImporter.Outcome.Unchanged -> {
                touchAvailable(existing!!, candidate, builtin)
                clearIssue(issueKey)
                report.unchanged++
            }
            is GameImporter.Outcome.Failed -> {
                recordFailure(issueKey, candidate.logicalKey, outcome.code, outcome.detail, outcome.retryable, candidate.manifestSha256)
                existing?.let { commitRecord(it.copy(lastErrorCode = outcome.code, lastErrorDetail = outcome.detail.take(200))) }
                diagnostics.log("import", "${candidate.folderName}: ${outcome.code} ${outcome.detail}")
                report.failed++
            }
        }
    }

    private suspend fun commitImported(
        candidate: GameImporter.Candidate,
        allocatedId: String,
        outcome: GameImporter.Outcome.Imported,
        builtin: Boolean,
    ) {
        val meta = outcome.meta
        val record = repo.update { cat ->
            val existing = cat.byLogicalKey(candidate.logicalKey)
            var gameId = allocatedId
            if (existing != null && existing.internalGameId != allocatedId) {
                // Another writer created the identity first: keep a single id per logicalKey.
                revisions.moveRevision(allocatedId, existing.internalGameId, meta.revisionHash)
                gameId = existing.internalGameId
            }
            val base = existing ?: GameRecord(
                internalGameId = gameId,
                logicalKey = candidate.logicalKey,
                manifestId = candidate.manifest.id,
                sourceDirectoryUri = null,
                folderDisplayName = candidate.folderName,
                title = candidate.folderName,
                versionLabel = null,
                sortOrder = null,
                storageOriginToken = Ids.newOriginToken(),
                activeRevision = null,
                previousRevision = null,
                validationLevel = candidate.validationLevel,
                sourceState = SourceState.AVAILABLE,
                hidden = false,
                lastPlayedAt = null,
                lastImportAt = null,
                lastErrorCode = null,
                lastErrorDetail = null,
                playerApiVersion = null,
                importedByteCount = 0,
                backgroundColor = null,
                builtin = builtin,
                iconPath = null,
                manifestSha256 = null,
            )
            val previous = when {
                base.activeRevision != null && base.activeRevision != meta.revisionHash -> base.activeRevision
                else -> base.previousRevision?.takeIf { it != meta.revisionHash }
            }
            val updated = base.copy(
                manifestId = candidate.manifest.id,
                sourceDirectoryUri = candidate.folder.location,
                folderDisplayName = candidate.folderName,
                title = candidate.manifest.title ?: candidate.folderName,
                versionLabel = candidate.manifest.version,
                sortOrder = candidate.manifest.sortOrder,
                activeRevision = meta.revisionHash,
                previousRevision = previous,
                validationLevel = meta.validationLevel,
                sourceState = if (builtin) SourceState.BUILTIN else SourceState.AVAILABLE,
                lastImportAt = clock(),
                lastErrorCode = null,
                lastErrorDetail = null,
                playerApiVersion = meta.playerApiVersion,
                importedByteCount = meta.byteCount,
                backgroundColor = candidate.manifest.backgroundColor,
                builtin = builtin,
                iconPath = meta.iconPath,
                manifestSha256 = candidate.manifestSha256,
            )
            val games = if (existing == null) cat.games + updated else cat.games.map { if (it.internalGameId == updated.internalGameId) updated else it }
            cat.copy(games = games) to updated
        }
        runCatching { revisions.writeIdentity(record) }
    }

    private suspend fun touchAvailable(existing: GameRecord, candidate: GameImporter.Candidate, builtin: Boolean) {
        val state = if (builtin) SourceState.BUILTIN else SourceState.AVAILABLE
        val updated = existing.copy(
            sourceState = state,
            sourceDirectoryUri = candidate.folder.location,
            folderDisplayName = candidate.folderName,
            lastErrorCode = null,
            lastErrorDetail = null,
        )
        if (updated != existing) commitRecord(updated)
    }

    private suspend fun commitRecord(record: GameRecord) {
        repo.update { cat ->
            val cur = cat.byId(record.internalGameId) ?: return@update cat to Unit
            if (cur == record) cat to Unit else cat.replaceGame(record) to Unit
        }
    }

    private suspend fun markExternalSources(state: SourceState) {
        repo.update { cat ->
            val games = cat.games.map { if (!it.builtin && it.sourceState != state) it.copy(sourceState = state) else it }
            if (games == cat.games) cat to Unit else cat.copy(games = games) to Unit
        }
    }

    private suspend fun recordFailure(folderKey: String, logicalKey: String?, code: String, detail: String, retryable: Boolean, signature: String?) {
        val now = clock()
        repo.update { cat ->
            val old = cat.issues.firstOrNull { it.folderName == folderKey }
            val attempts = (old?.attempts ?: 0) + 1
            val next = if (retryable) now + backoffMs(attempts) else Long.MAX_VALUE
            val issue = SourceIssue(folderKey, logicalKey, code, detail.take(300), now, attempts, next, signature)
            if (old == issue) return@update cat to Unit
            cat.copy(issues = cat.issues.filterNot { it.folderName == folderKey } + issue) to Unit
        }
    }

    private suspend fun clearIssue(folderKey: String) {
        repo.update { cat ->
            if (cat.issues.none { it.folderName == folderKey }) cat to Unit
            else cat.copy(issues = cat.issues.filterNot { it.folderName == folderKey }) to Unit
        }
    }

    private fun collectGarbage() {
        val games = repo.current.games
        games.forEach { revisions.gc(it.internalGameId, setOfNotNull(it.activeRevision, it.previousRevision)) }
        revisions.gcOrphans(games.map { it.internalGameId }.toSet())
    }

    /**
     * Startup integrity pass (bible §6.3): drops leftover staging and repairs active
     * pointers whose revision directory is missing or incomplete.
     */
    suspend fun verifyOnStart() = withContext(io) {
        revisions.cleanStaging()
        for (rec in repo.current.games) {
            val active = rec.activeRevision ?: continue
            if (revisions.isComplete(rec.internalGameId, active)) continue
            val prev = rec.previousRevision?.takeIf { revisions.isComplete(rec.internalGameId, it) }
            val meta = prev?.let { revisions.readMeta(rec.internalGameId, it) }
            val fixed = if (prev != null && meta != null) {
                rec.copy(activeRevision = prev, previousRevision = null, iconPath = meta.iconPath,
                    validationLevel = meta.validationLevel, manifestSha256 = meta.manifestSha256,
                    lastErrorCode = ErrorCodes.REVISION_MISSING, lastErrorDetail = "fell back to previous revision")
            } else {
                rec.copy(activeRevision = null, lastErrorCode = ErrorCodes.REVISION_MISSING, manifestSha256 = null)
            }
            commitRecord(fixed)
            diagnostics.log("recovery", "${rec.title}: active revision missing")
        }
    }

    /** Rebuilds a catalog from identity files + complete revisions when catalog.json is unreadable. */
    fun rebuildFromDisk(): Catalog {
        val games = revisions.readIdentities().mapNotNull { o ->
            runCatching {
                val id = o.getString("internalGameId")
                val token = o.getString("storageOriginToken").takeIf { Ids.TOKEN_REGEX.matches(it) } ?: return@runCatching null
                val newest = revisions.listRevisions(id).maxByOrNull { it.createdAt } ?: return@runCatching null
                val builtin = o.optBoolean("builtin", false)
                GameRecord(
                    internalGameId = id, logicalKey = o.getString("logicalKey"),
                    manifestId = if (o.has("manifestId")) o.optString("manifestId") else null,
                    sourceDirectoryUri = null, folderDisplayName = o.optString("folderDisplayName"),
                    title = o.optString("title"), versionLabel = null, sortOrder = null,
                    storageOriginToken = token, activeRevision = newest.revisionHash, previousRevision = null,
                    validationLevel = newest.validationLevel,
                    sourceState = if (builtin) SourceState.BUILTIN else SourceState.MISSING,
                    hidden = o.optBoolean("hidden", false), lastPlayedAt = null, lastImportAt = newest.createdAt,
                    lastErrorCode = null, lastErrorDetail = null, playerApiVersion = newest.playerApiVersion,
                    importedByteCount = newest.byteCount, backgroundColor = null, builtin = builtin,
                    iconPath = newest.iconPath, manifestSha256 = newest.manifestSha256,
                )
            }.getOrNull()
        }
        return Catalog(games = games)
    }

    companion object {
        fun backoffMs(attempts: Int): Long = when (attempts) {
            1 -> 10_000L
            2 -> 30_000L
            3 -> 90_000L
            else -> 300_000L
        }
    }
}
