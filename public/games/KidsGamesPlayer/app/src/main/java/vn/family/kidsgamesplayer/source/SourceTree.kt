package vn.family.kidsgamesplayer.source

import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.io.InputStream

/**
 * Read-only view of a game source tree. Implementations: SAF (real device), assets
 * (built-in demos) and plain files (unit tests). Provider sizes are hints only; the
 * importer counts real bytes while streaming.
 */
interface SourceNode {
    val name: String
    val isDirectory: Boolean
    /** Provider-declared size, or -1 when unknown. */
    val declaredSize: Long
    /** Provider last-modified time in ms, or 0 when unknown. */
    val lastModified: Long
    /** Opaque location (e.g. SAF document URI) for diagnostics/records; may be null. */
    val location: String?

    @Throws(IOException::class)
    fun children(): List<SourceNode>

    @Throws(IOException::class)
    fun openStream(): InputStream
}

interface SourceRoot {
    /** Stable identifier of the root (tree URI or "builtin"). */
    val rootId: String
    val isBuiltin: Boolean

    /** Direct child directories of the root: the only game candidates (bible §5.1). */
    @Throws(IOException::class)
    fun listGameFolders(): List<SourceNode>
}

/** Thrown when access to the source was revoked or the provider failed. */
class SourceAccessException(val code: String, message: String, cause: Throwable? = null) :
    IOException(message, cause)

/** Lazily resolves relative paths inside a folder, listing each directory at most once. */
class TreeIndex(private val folder: SourceNode) {
    private val cache = HashMap<String, Map<String, SourceNode>>()

    @Throws(IOException::class)
    private fun list(dirPath: String, dir: SourceNode): Map<String, SourceNode> =
        cache.getOrPut(dirPath) {
            dir.children().associateBy { java.text.Normalizer.normalize(it.name, java.text.Normalizer.Form.NFC) }
        }

    @Throws(IOException::class)
    fun resolve(relativePath: String): SourceNode? {
        var current = folder
        var currentPath = ""
        val segments = relativePath.split('/')
        for ((index, segment) in segments.withIndex()) {
            val entries = list(currentPath, current)
            val next = entries[segment] ?: return null
            if (index < segments.size - 1 && !next.isDirectory) return null
            if (index == segments.size - 1 && next.isDirectory) return null
            current = next
            currentPath = if (currentPath.isEmpty()) segment else "$currentPath/$segment"
        }
        return current
    }
}

/** java.io.File implementation, used by unit tests and tooling. */
class FileSourceNode(private val file: File) : SourceNode {
    override val name: String get() = file.name
    override val isDirectory: Boolean get() = file.isDirectory
    override val declaredSize: Long get() = if (file.isFile) file.length() else -1L
    override val lastModified: Long get() = file.lastModified()
    override val location: String get() = file.path

    override fun children(): List<SourceNode> {
        if (!file.isDirectory) throw IOException("not a directory")
        // Never follow symlinks out of the granted tree.
        val rootCanonical = file.canonicalFile
        return (file.listFiles() ?: throw IOException("cannot list ${file.name}"))
            .filter { child ->
                val c = child.canonicalFile
                c.parentFile == rootCanonical
            }
            .sortedBy { it.name }
            .map { FileSourceNode(it) }
    }

    override fun openStream(): InputStream = FileInputStream(file)
}

class FileSourceRoot(private val dir: File, override val isBuiltin: Boolean = false) : SourceRoot {
    override val rootId: String get() = if (isBuiltin) "builtin" else dir.path
    override fun listGameFolders(): List<SourceNode> =
        FileSourceNode(dir).children().filter { it.isDirectory }
}
