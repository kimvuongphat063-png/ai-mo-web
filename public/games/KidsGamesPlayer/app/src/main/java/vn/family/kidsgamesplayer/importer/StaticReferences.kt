package vn.family.kidsgamesplayer.importer

import java.io.File
import vn.family.kidsgamesplayer.core.MimeTypes
import vn.family.kidsgamesplayer.core.PathPolicy

/**
 * Best-effort static reference check for basic folders (bible §6.4): finds relative
 * src/href targets in HTML files that are absent from the copied set. It cannot see
 * URLs built dynamically by JavaScript; that is why packed (verified) games are preferred.
 */
object StaticReferences {
    private val ATTR = Regex("""(?i)\b(?:src|href)\s*=\s*(["'])(.*?)\1""")

    fun missing(root: File, present: Set<String>): List<String> {
        val result = LinkedHashSet<String>()
        for (path in present) {
            if (!MimeTypes.isHtml(path)) continue
            val file = File(root, path)
            if (!file.isFile || file.length() > 4L * 1024 * 1024) continue
            val text = runCatching { file.readText(Charsets.UTF_8) }.getOrNull() ?: continue
            val baseDir = path.substringBeforeLast('/', "")
            for (m in ATTR.findAll(text)) {
                val ref = m.groupValues[2].trim()
                val resolved = resolve(baseDir, ref) ?: continue
                if (resolved !in present) result += resolved
            }
        }
        return result.toList()
    }

    /** Returns the root-relative decoded path for a local reference, or null to ignore it. */
    fun resolve(baseDir: String, rawRef: String): String? {
        val ref = rawRef.substringBefore('#').substringBefore('?')
        if (ref.isEmpty() || ref.startsWith("/") || ref.contains(':') || ref.startsWith("{") || ref.contains("\${")) return null
        val parts = ArrayList<String>()
        if (baseDir.isNotEmpty()) parts += baseDir.split('/')
        for (seg in ref.split('/')) {
            when (seg) {
                "", "." -> {}
                ".." -> if (parts.isEmpty()) return null else parts.removeAt(parts.size - 1)
                else -> parts += seg
            }
        }
        if (parts.isEmpty()) return null
        return when (val r = PathPolicy.decodeUrlPath("/" + parts.joinToString("/"))) {
            is PathPolicy.Result.Ok -> r.path
            is PathPolicy.Result.Rejected -> null
        }
    }
}
