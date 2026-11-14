package vn.family.kidsgamesplayer.core

import java.util.Locale

/**
 * Runtime file types allowed by the v1 game contract (bible §8.4) plus a few
 * harmless extras documented in docs/GAME_FORMAT.md. Anything else is neither
 * imported from a basic folder nor served.
 */
object MimeTypes {
    data class Type(val mime: String, val isText: Boolean)

    private val TABLE: Map<String, Type> = mapOf(
        "html" to Type("text/html", true),
        "htm" to Type("text/html", true),
        "js" to Type("text/javascript", true),
        "mjs" to Type("text/javascript", true),
        "css" to Type("text/css", true),
        "json" to Type("application/json", true),
        "txt" to Type("text/plain", true),
        "png" to Type("image/png", false),
        "jpg" to Type("image/jpeg", false),
        "jpeg" to Type("image/jpeg", false),
        "webp" to Type("image/webp", false),
        "gif" to Type("image/gif", false),
        "svg" to Type("image/svg+xml", false),
        "ogg" to Type("audio/ogg", false),
        "mp3" to Type("audio/mpeg", false),
        "wav" to Type("audio/wav", false),
        "m4a" to Type("audio/mp4", false),
        "mp4" to Type("video/mp4", false),
        "webm" to Type("video/webm", false),
        "woff" to Type("font/woff", false),
        "woff2" to Type("font/woff2", false),
        "ttf" to Type("font/ttf", false),
        "otf" to Type("font/otf", false),
    )

    fun extension(path: String): String {
        val name = path.substringAfterLast('/')
        val dot = name.lastIndexOf('.')
        return if (dot <= 0 || dot == name.length - 1) "" else name.substring(dot + 1).lowercase(Locale.ROOT)
    }

    fun forPath(path: String): Type? = TABLE[extension(path)]

    fun isSupported(path: String): Boolean = forPath(path) != null

    fun isHtml(path: String): Boolean = extension(path).let { it == "html" || it == "htm" }

    /** Media types that may stay embedded as non-document `data:` resources (bible §8.2 step 2). */
    fun isAllowedDataUriMime(mime: String): Boolean {
        val m = mime.trim().lowercase(Locale.ROOT)
        if (m.isEmpty()) return false
        if (m.contains("html") || m.contains("javascript") || m.contains("ecmascript") || m.contains("xml") && !m.startsWith("image/svg+xml")) {
            return false
        }
        return m.startsWith("image/") || m.startsWith("audio/") || m.startsWith("video/") || m.startsWith("font/")
    }
}
