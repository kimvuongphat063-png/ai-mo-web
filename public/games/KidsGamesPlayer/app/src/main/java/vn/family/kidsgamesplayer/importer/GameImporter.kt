package vn.family.kidsgamesplayer.importer

import android.annotation.SuppressLint
import java.io.File
import java.io.FileNotFoundException
import java.io.FileOutputStream
import java.io.IOException
import java.text.Normalizer
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.core.ErrorCodes
import vn.family.kidsgamesplayer.core.GameManifest
import vn.family.kidsgamesplayer.core.Hashing
import vn.family.kidsgamesplayer.core.Ids
import vn.family.kidsgamesplayer.core.ImportLimits
import vn.family.kidsgamesplayer.core.InventoryEntry
import vn.family.kidsgamesplayer.core.ManifestParser
import vn.family.kidsgamesplayer.core.ManifestResult
import vn.family.kidsgamesplayer.core.MimeTypes
import vn.family.kidsgamesplayer.core.PathPolicy
import vn.family.kidsgamesplayer.source.SourceAccessException
import vn.family.kidsgamesplayer.source.SourceNode
import vn.family.kidsgamesplayer.source.TreeIndex

/** Plain-JVM fallback (unit tests). The app passes StorageManager.getAllocatableBytes. */
@SuppressLint("UsableSpace")
fun fileUsableSpace(dir: File): Long = dir.usableSpace

/** Decodes only image bounds (never the full bitmap) to validate icons. */
fun interface IconInspector {
    /** Returns (width, height) or null when the file is not a decodable image. */
    fun dimensions(file: File): Pair<Int, Int>?
}

/**
 * Copies one candidate folder into an immutable revision (bible §6.3). The importer is
 * synchronous and must run on an IO thread; [ScanCoordinator] guarantees a single
 * concurrent import and commits the catalog afterwards.
 */
class GameImporter(
    private val revisions: RevisionStore,
    private val iconInspector: IconInspector,
    private val limits: ImportLimits = ImportLimits.DEFAULT,
    private val clock: () -> Long = System::currentTimeMillis,
    private val freeSpace: (File) -> Long = ::fileUsableSpace,
    private val settleDelayMs: Long = 1_500L,
    private val sleeper: (Long) -> Unit = { Thread.sleep(it) },
) {
    data class Candidate(
        val folder: SourceNode,
        val folderName: String,
        val manifest: GameManifest,
        val manifestBytes: ByteArray?,
        val manifestSha256: String?,
        val logicalKey: String,
        val warnings: List<String>,
    ) {
        val validationLevel: ValidationLevel
            get() = if (manifest.isVerified) ValidationLevel.VERIFIED else ValidationLevel.BASIC
    }

    sealed interface Prepared {
        data class Ok(val candidate: Candidate) : Prepared
        data class Failed(val folderName: String, val code: String, val detail: String, val retryable: Boolean) : Prepared
    }

    sealed interface Outcome {
        data class Imported(val meta: RevisionMeta, val warnings: List<String>) : Outcome
        data class Unchanged(val revisionHash: String) : Outcome
        data class Failed(val code: String, val detail: String, val retryable: Boolean) : Outcome
    }

    private class Fail(val code: String, val detail: String, val retryable: Boolean) : Exception(detail)

    private data class PlanItem(val path: String, val node: SourceNode, val expected: InventoryEntry?)

    /** Reads only game.json (bounded) to resolve identity before touching any large asset. */
    fun prepare(folder: SourceNode, allowBuiltinNamespace: Boolean): Prepared {
        val folderName = Normalizer.normalize(folder.name, Normalizer.Form.NFC)
        return try {
            val manifestNode = folder.children().firstOrNull { it.name == ManifestParser.MANIFEST_NAME && !it.isDirectory }
            if (manifestNode == null) {
                return Prepared.Ok(
                    Candidate(folder, folderName, GameManifest.basicDefaults(), null, null,
                        "folder:$folderName", listOf("no game.json; basic validation")),
                )
            }
            val bytes = readBounded(manifestNode, limits.maxManifestBytes)
                ?: return Prepared.Failed(folderName, ErrorCodes.MANIFEST_TOO_LARGE, "game.json", false)
            when (val r = ManifestParser.parse(bytes, allowBuiltinNamespace, limits)) {
                is ManifestResult.Error -> Prepared.Failed(folderName, r.code, r.detail, retryable = r.code == ErrorCodes.MANIFEST_INVALID_JSON)
                is ManifestResult.Ok -> {
                    val key = r.manifest.id?.let { "manifest:$it" } ?: "folder:$folderName"
                    Prepared.Ok(Candidate(folder, folderName, r.manifest, bytes, Hashing.sha256Hex(bytes), key, r.warnings))
                }
            }
        } catch (e: SourceAccessException) {
            Prepared.Failed(folderName, e.code, e.message ?: "source", true)
        } catch (e: IOException) {
            Prepared.Failed(folderName, ErrorCodes.IO_ERROR, e.message ?: "io", true)
        }
    }

    fun import(
        candidate: Candidate,
        internalGameId: String,
        currentActive: String?,
        allowMissingReferences: Boolean = false,
    ): Outcome {
        val staging = revisions.newStagingDir(Ids.newImportId())
        var committed = false
        try {
            val warnings = candidate.warnings.toMutableList()
            val firstLook = clock()
            val (plan, signatureBefore) = buildPlan(candidate, warnings)

            if (plan.none { it.path == PathPolicy.ENTRY }) {
                throw Fail(ErrorCodes.MISSING_ENTRY, PathPolicy.ENTRY, retryable = true)
            }
            val declared = plan.sumOf { it.expected?.size ?: maxOf(it.node.declaredSize, 0L) }
            if (declared > limits.maxBytesPerGame) throw Fail(ErrorCodes.QUOTA_BYTES, "$declared bytes", false)
            if (freeSpace(revisions.paths.filesDir) < declared + limits.freeSpaceReserveBytes) {
                throw Fail(ErrorCodes.NO_SPACE, "need ${declared + limits.freeSpaceReserveBytes} bytes", true)
            }

            val stagingRoot = File(staging, RevisionStore.ROOT)
            val copied = copyAll(plan, stagingRoot)

            // Second observation: the source must not have changed while we copied it.
            if (candidate.manifest.isVerified) {
                val again = candidate.folder.children().firstOrNull { it.name == ManifestParser.MANIFEST_NAME && !it.isDirectory }
                    ?.let { readBounded(it, limits.maxManifestBytes) }
                if (again == null || Hashing.sha256Hex(again) != candidate.manifestSha256) {
                    throw Fail(ErrorCodes.SOURCE_CHANGED, "game.json changed during copy", true)
                }
            } else {
                val elapsed = clock() - firstLook
                if (elapsed < settleDelayMs) sleeper(settleDelayMs - elapsed)
                val (_, signatureAfter) = buildPlan(candidate, mutableListOf())
                if (signatureAfter != signatureBefore) {
                    throw Fail(ErrorCodes.SOURCE_CHANGED, "folder changed during copy", true)
                }
                val missing = StaticReferences.missing(stagingRoot, copied.map { it.path }.toSet())
                if (missing.isNotEmpty()) {
                    if (!allowMissingReferences) {
                        throw Fail(ErrorCodes.INCOMPLETE_PACKAGE, "missing: " + missing.take(3).joinToString(), true)
                    }
                    warnings += "missing static references: " + missing.take(5).joinToString()
                }
            }

            val iconPath = candidate.manifest.icon.takeIf { icon -> copied.any { it.path == icon } }?.takeIf { icon ->
                val dims = iconInspector.dimensions(File(stagingRoot, icon))
                val ok = dims != null && dims.first in 1..limits.maxIconPixels && dims.second in 1..limits.maxIconPixels
                if (!ok) warnings += "icon unusable: $icon"
                ok
            }
            if (iconPath == null && warnings.none { it.startsWith("icon unusable") }) warnings += "icon missing"

            val revisionHash = revisionHash(candidate, copied)
            if (revisionHash == currentActive && revisions.isComplete(internalGameId, revisionHash)) {
                return Outcome.Unchanged(revisionHash)
            }
            val meta = RevisionMeta(
                revisionHash = revisionHash,
                validationLevel = candidate.validationLevel,
                manifestSha256 = candidate.manifestSha256,
                files = copied.sortedBy { it.path },
                iconPath = iconPath,
                createdAt = clock(),
                playerApiVersion = candidate.manifest.playerApiVersion,
                byteCount = copied.sumOf { it.size },
            )
            candidate.manifestBytes?.let { RevisionStore.writeSynced(File(staging, RevisionStore.MANIFEST_COPY), it) }
            revisions.writeMeta(staging, meta)
            if (!revisions.commitStaging(staging, internalGameId, revisionHash)) {
                throw Fail(ErrorCodes.IO_ERROR, "commit rename failed", true)
            }
            committed = true
            return Outcome.Imported(meta, warnings)
        } catch (f: Fail) {
            return Outcome.Failed(f.code, f.detail.take(300), f.retryable)
        } catch (e: SourceAccessException) {
            return Outcome.Failed(e.code, e.message ?: "source", true)
        } catch (e: FileNotFoundException) {
            return Outcome.Failed(ErrorCodes.INCOMPLETE_PACKAGE, "file vanished: ${e.message}", true)
        } catch (e: IOException) {
            val lowSpace = freeSpace(revisions.paths.filesDir) < limits.freeSpaceReserveBytes
            return Outcome.Failed(if (lowSpace) ErrorCodes.NO_SPACE else ErrorCodes.IO_ERROR, e.message ?: "io", true)
        } catch (e: SecurityException) {
            return Outcome.Failed(ErrorCodes.PERMISSION_LOST, "permission", true)
        } finally {
            if (!committed) revisions.discardStaging(staging)
        }
    }

    private fun buildPlan(candidate: Candidate, warnings: MutableList<String>): Pair<List<PlanItem>, String> {
        val inventory = candidate.manifest.files
        if (inventory != null) {
            val index = TreeIndex(candidate.folder)
            val items = inventory.map { entry ->
                val node = index.resolve(entry.path)
                    ?: throw Fail(ErrorCodes.INCOMPLETE_PACKAGE, "missing: ${entry.path}", true)
                PlanItem(entry.path, node, entry)
            }
            return items to (candidate.manifestSha256 ?: "")
        }
        val items = ArrayList<PlanItem>()
        val skipped = ArrayList<String>()
        walk(candidate.folder, "", 0, items, skipped)
        val seen = HashMap<String, String>()
        for (item in items) {
            val previous = seen.put(PathPolicy.collisionKey(item.path), item.path)
            if (previous != null) throw Fail(ErrorCodes.PATH_COLLISION, "$previous ~ ${item.path}", false)
        }
        if (skipped.isNotEmpty()) warnings += "skipped: " + skipped.take(5).joinToString()
        val signature = Hashing.sha256Hex(
            items.sortedBy { it.path }.joinToString("\n") { "${it.path}\t${it.node.declaredSize}\t${it.node.lastModified}" } +
                "\n#" + skipped.sorted().joinToString("\n"),
        )
        return items to signature
    }

    private fun walk(dir: SourceNode, prefix: String, depth: Int, out: MutableList<PlanItem>, skipped: MutableList<String>) {
        for (child in dir.children()) {
            val name = Normalizer.normalize(child.name, Normalizer.Form.NFC)
            if (isIgnoredName(name)) continue
            val rel = if (prefix.isEmpty()) name else "$prefix/$name"
            if (child.isDirectory) {
                if (depth + 1 > limits.maxDirectoryDepth) throw Fail(ErrorCodes.QUOTA_DEPTH, rel.take(120), false)
                walk(child, rel, depth + 1, out, skipped)
                continue
            }
            if (prefix.isEmpty() && name == ManifestParser.MANIFEST_NAME) continue
            if (!MimeTypes.isSupported(rel)) {
                skipped += rel
                continue
            }
            when (val v = PathPolicy.validateRelative(rel, limits.maxDirectoryDepth)) {
                is PathPolicy.Result.Ok -> out += PlanItem(v.path, child, null)
                is PathPolicy.Result.Rejected -> skipped += rel
            }
            if (out.size > limits.maxFilesPerGame) throw Fail(ErrorCodes.QUOTA_FILES, "${out.size} files", false)
        }
    }

    private fun copyAll(plan: List<PlanItem>, stagingRoot: File): List<InventoryEntry> {
        var total = 0L
        val copied = ArrayList<InventoryEntry>(plan.size)
        for (item in plan) {
            val dest = PathPolicy.resolveContained(stagingRoot, item.path)
                ?: throw Fail(ErrorCodes.PATH_REJECTED, item.path, false)
            dest.parentFile?.mkdirs()
            val perFile = if (item.path == PathPolicy.ENTRY) limits.maxEntryHtmlBytes else limits.maxBytesPerFile
            val remaining = limits.maxBytesPerGame - total
            val limit = minOf(perFile, remaining)
            val result = try {
                item.node.openStream().use { input ->
                    FileOutputStream(dest).use { output ->
                        val r = Hashing.copyHashing(input, output, limit)
                        output.flush()
                        output.fd.sync()
                        r
                    }
                }
            } catch (_: Hashing.LimitExceeded) {
                val code = when {
                    perFile <= remaining && item.path == PathPolicy.ENTRY -> ErrorCodes.QUOTA_ENTRY_SIZE
                    perFile <= remaining -> ErrorCodes.QUOTA_FILE_SIZE
                    else -> ErrorCodes.QUOTA_BYTES
                }
                throw Fail(code, item.path.take(120), false)
            }
            total += result.size
            val expected = item.expected
            if (expected != null && (expected.size != result.size || expected.sha256 != result.sha256)) {
                throw Fail(ErrorCodes.INCOMPLETE_PACKAGE, "hash mismatch: ${item.path.take(120)}", true)
            }
            copied += InventoryEntry(item.path, result.size, result.sha256)
        }
        return copied
    }

    private fun readBounded(node: SourceNode, max: Long): ByteArray? = node.openStream().use { input ->
        val buffer = java.io.ByteArrayOutputStream()
        val chunk = ByteArray(16 * 1024)
        var total = 0L
        while (true) {
            val n = input.read(chunk)
            if (n < 0) break
            total += n
            if (total > max) return null
            buffer.write(chunk, 0, n)
        }
        buffer.toByteArray()
    }

    companion object {
        private val IGNORED = setOf("thumbs.db", "desktop.ini", "__macosx")

        fun isIgnoredName(name: String): Boolean = name.startsWith(".") || name.lowercase() in IGNORED

        /** Content identity of a revision: manifest bytes + every runtime file's path/size/hash. */
        fun revisionHash(candidate: Candidate, files: List<InventoryEntry>): String {
            val sb = StringBuilder("kgp-revision-v1\n")
            sb.append("level:").append(candidate.validationLevel.wire).append('\n')
            sb.append("manifest:").append(candidate.manifestSha256 ?: "none").append('\n')
            files.sortedBy { it.path }.forEach { sb.append(it.path).append('\t').append(it.size).append('\t').append(it.sha256).append('\n') }
            return Hashing.sha256Hex(sb.toString())
        }
    }
}
