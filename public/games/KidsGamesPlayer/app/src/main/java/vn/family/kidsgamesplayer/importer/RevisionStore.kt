package vn.family.kidsgamesplayer.importer

import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger
import org.json.JSONArray
import org.json.JSONObject
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.core.InventoryEntry

/** App-private layout (bible §7.1). */
class AppPaths(val filesDir: File) {
    val catalogDir = File(filesDir, "catalog")
    val gamesDir = File(filesDir, "games")
    val stagingDir = File(filesDir, "staging")
    val settingsDir = File(filesDir, "settings")
    val diagnosticsDir = File(filesDir, "diagnostics")
}

/** Immutable description of one committed revision, stored as meta.json beside root/. */
data class RevisionMeta(
    val revisionHash: String,
    val validationLevel: ValidationLevel,
    val manifestSha256: String?,
    val files: List<InventoryEntry>,
    val iconPath: String?,
    val createdAt: Long,
    val playerApiVersion: Int?,
    val byteCount: Long,
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("format", 1)
        put("revisionHash", revisionHash)
        put("validationLevel", validationLevel.wire)
        putOpt("manifestSha256", manifestSha256)
        put("files", JSONArray().apply {
            files.forEach { put(JSONObject().put("path", it.path).put("size", it.size).put("sha256", it.sha256)) }
        })
        putOpt("iconPath", iconPath)
        put("createdAt", createdAt)
        putOpt("playerApiVersion", playerApiVersion)
        put("byteCount", byteCount)
    }

    companion object {
        fun fromJson(o: JSONObject): RevisionMeta {
            val arr = o.getJSONArray("files")
            val files = (0 until arr.length()).map {
                val f = arr.getJSONObject(it)
                InventoryEntry(f.getString("path"), f.getLong("size"), f.getString("sha256"))
            }
            return RevisionMeta(
                revisionHash = o.getString("revisionHash"),
                validationLevel = ValidationLevel.fromWire(o.optString("validationLevel")),
                manifestSha256 = if (o.isNull("manifestSha256")) null else o.getString("manifestSha256"),
                files = files,
                iconPath = if (o.isNull("iconPath")) null else o.getString("iconPath"),
                createdAt = o.optLong("createdAt"),
                playerApiVersion = if (o.has("playerApiVersion")) o.optInt("playerApiVersion") else null,
                byteCount = o.optLong("byteCount"),
            )
        }
    }
}

/**
 * Owns files/games/<internalGameId>/<revisionHash>/{meta.json,root/} and files/staging/.
 * A revision directory is only ever created by renaming a fully written staging directory,
 * and is never modified afterwards. Leases keep revisions used by a live session from GC.
 */
class RevisionStore(val paths: AppPaths) {
    private val leases = ConcurrentHashMap<String, AtomicInteger>()

    fun gameDir(internalGameId: String) = File(paths.gamesDir, internalGameId)
    fun revisionDir(internalGameId: String, revision: String) = File(gameDir(internalGameId), revision)
    fun revisionRoot(internalGameId: String, revision: String) = File(revisionDir(internalGameId, revision), ROOT)

    fun readMeta(internalGameId: String, revision: String): RevisionMeta? {
        val dir = revisionDir(internalGameId, revision)
        val metaFile = File(dir, META)
        if (!metaFile.isFile || !File(dir, ROOT).isDirectory) return null
        return runCatching { RevisionMeta.fromJson(JSONObject(metaFile.readText(Charsets.UTF_8))) }
            .getOrNull()
            ?.takeIf { it.revisionHash == revision }
    }

    fun isComplete(internalGameId: String, revision: String): Boolean = readMeta(internalGameId, revision) != null

    fun newStagingDir(importId: String): File {
        val dir = File(paths.stagingDir, importId)
        dir.deleteRecursively()
        File(dir, ROOT).mkdirs()
        return dir
    }

    fun writeMeta(stagingDir: File, meta: RevisionMeta) {
        writeSynced(File(stagingDir, META), meta.toJson().toString(1).toByteArray(Charsets.UTF_8))
    }

    /**
     * Moves a complete staging directory into place. Never renames over a live non-empty
     * directory: if the target revision already exists and is complete, staging is dropped.
     */
    fun commitStaging(stagingDir: File, internalGameId: String, revision: String): Boolean {
        val target = revisionDir(internalGameId, revision)
        if (target.exists()) {
            if (isComplete(internalGameId, revision)) {
                stagingDir.deleteRecursively()
                return true
            }
            // Incomplete leftover (should not happen): only remove if not leased.
            if (isLeased(internalGameId, revision)) return false
            target.deleteRecursively()
        }
        target.parentFile?.mkdirs()
        return stagingDir.renameTo(target)
    }

    /** Moves a revision committed under one id to another id (identity race resolution). */
    fun moveRevision(fromId: String, toId: String, revision: String): Boolean {
        val src = revisionDir(fromId, revision)
        val dst = revisionDir(toId, revision)
        if (dst.exists()) {
            src.deleteRecursively()
            return isComplete(toId, revision)
        }
        dst.parentFile?.mkdirs()
        val ok = src.renameTo(dst)
        gameDir(fromId).takeIf { it.list()?.isEmpty() == true }?.delete()
        return ok
    }

    fun cleanStaging() {
        paths.stagingDir.listFiles()?.forEach { it.deleteRecursively() }
    }

    fun discardStaging(stagingDir: File) {
        stagingDir.deleteRecursively()
    }

    /** Removes revisions of a game that are neither kept nor leased. */
    fun gc(internalGameId: String, keep: Set<String>) {
        gameDir(internalGameId).listFiles()?.forEach { dir ->
            if (dir.isDirectory && dir.name !in keep && !isLeased(internalGameId, dir.name)) {
                dir.deleteRecursively()
            }
        }
    }

    /** Removes directories of games no longer in the catalog (e.g. identity race leftovers). */
    fun gcOrphans(knownIds: Set<String>) {
        paths.gamesDir.listFiles()?.forEach { dir ->
            if (dir.isDirectory && dir.name !in knownIds && leases.keys.none { it.startsWith(dir.name + "/") }) {
                dir.deleteRecursively()
            }
        }
    }

    fun acquireLease(internalGameId: String, revision: String): Lease {
        val key = "$internalGameId/$revision"
        leases.computeIfAbsent(key) { AtomicInteger() }.incrementAndGet()
        return Lease(key)
    }

    fun isLeased(internalGameId: String, revision: String): Boolean =
        (leases["$internalGameId/$revision"]?.get() ?: 0) > 0

    inner class Lease internal constructor(private val key: String) : AutoCloseable {
        @Volatile private var closed = false
        override fun close() {
            if (closed) return
            closed = true
            leases[key]?.decrementAndGet()
        }
    }

    /** Small per-game identity file used to rebuild an unreadable catalog without losing saves. */
    fun writeIdentity(record: GameRecord) {
        val o = JSONObject()
            .put("internalGameId", record.internalGameId)
            .put("logicalKey", record.logicalKey)
            .putOpt("manifestId", record.manifestId)
            .put("storageOriginToken", record.storageOriginToken)
            .put("title", record.title)
            .put("folderDisplayName", record.folderDisplayName)
            .put("builtin", record.builtin)
            .put("hidden", record.hidden)
        val dir = gameDir(record.internalGameId).apply { mkdirs() }
        val tmp = File(dir, "$IDENTITY.tmp")
        writeSynced(tmp, o.toString().toByteArray(Charsets.UTF_8))
        val dst = File(dir, IDENTITY)
        if (!tmp.renameTo(dst)) {
            dst.delete()
            tmp.renameTo(dst)
        }
    }

    fun readIdentities(): List<JSONObject> =
        paths.gamesDir.listFiles()?.mapNotNull { dir ->
            runCatching { JSONObject(File(dir, IDENTITY).readText(Charsets.UTF_8)) }.getOrNull()
        } ?: emptyList()

    fun listRevisions(internalGameId: String): List<RevisionMeta> =
        gameDir(internalGameId).listFiles()?.filter { it.isDirectory }?.mapNotNull { readMeta(internalGameId, it.name) }
            ?: emptyList()

    companion object {
        const val ROOT = "root"
        const val META = "meta.json"
        const val IDENTITY = "identity.json"
        const val MANIFEST_COPY = "game.json"

        fun writeSynced(file: File, bytes: ByteArray) {
            file.parentFile?.mkdirs()
            FileOutputStream(file).use { out ->
                out.write(bytes)
                out.flush()
                out.fd.sync()
            }
        }
    }
}
