package vn.family.kidsgamesplayer.core

import java.io.ByteArrayOutputStream
import java.io.File
import java.nio.ByteBuffer
import java.nio.charset.CharacterCodingException
import java.nio.charset.CodingErrorAction
import java.text.Normalizer
import java.util.Locale

/**
 * The single path policy shared by manifest parsing, importer, request router
 * and (mirrored in Python) the packer. See bible §8.3.
 *
 * Accepted paths are relative, '/'-separated, NFC-normalized, with no empty,
 * '.' or '..' segments, no backslash, colon, NUL or control/format characters.
 * Nothing is "repaired": a dangerous path is rejected, never rewritten.
 */
object PathPolicy {
    const val MAX_PATH_LENGTH = 1024
    const val MAX_SEGMENT_LENGTH = 255
    const val ENTRY = "index.html"

    sealed interface Result {
        data class Ok(val path: String) : Result
        data class Rejected(val reason: String) : Result
    }

    fun validateRelative(raw: String, maxDepth: Int = ImportLimits.DEFAULT.maxDirectoryDepth): Result {
        if (raw.isEmpty()) return Result.Rejected("empty")
        if (raw.length > MAX_PATH_LENGTH) return Result.Rejected("too_long")
        var i = 0
        while (i < raw.length) {
            val cp = raw.codePointAt(i)
            when {
                cp < 0x20 || cp == 0x7F -> return Result.Rejected("control_char")
                Character.isISOControl(cp) -> return Result.Rejected("control_char")
                Character.getType(cp) == Character.FORMAT.toInt() -> return Result.Rejected("format_char")
                Character.getType(cp) == Character.SURROGATE.toInt() -> return Result.Rejected("bad_surrogate")
                cp == '\\'.code -> return Result.Rejected("backslash")
                cp == ':'.code -> return Result.Rejected("colon")
            }
            i += Character.charCount(cp)
        }
        if (raw.startsWith("/")) return Result.Rejected("absolute")
        val path = Normalizer.normalize(raw, Normalizer.Form.NFC)
        val segments = path.split('/')
        if (segments.size - 1 > maxDepth) return Result.Rejected("too_deep")
        for (segment in segments) {
            if (segment.isEmpty()) return Result.Rejected("empty_segment")
            if (segment == "." || segment == "..") return Result.Rejected("dot_segment")
            if (segment.length > MAX_SEGMENT_LENGTH) return Result.Rejected("segment_too_long")
            if (segment.trim() != segment) return Result.Rejected("edge_whitespace")
        }
        return Result.Ok(path)
    }

    /** Key used to detect paths that collide after NFC + case folding inside one package. */
    fun collisionKey(path: String): String =
        Normalizer.normalize(path, Normalizer.Form.NFC).lowercase(Locale.ROOT)

    /**
     * Decodes the raw (still percent-encoded) path of an https request exactly once.
     * Encoded separators/NUL are refused instead of being reinterpreted. '+' stays '+'.
     */
    fun decodeUrlPath(rawPath: String?): Result {
        if (rawPath.isNullOrEmpty() || rawPath == "/") return Result.Ok(ENTRY)
        if (!rawPath.startsWith("/")) return Result.Rejected("not_rooted")
        val encoded = rawPath.substring(1)
        val lower = encoded.lowercase(Locale.ROOT)
        if ("%2f" in lower || "%5c" in lower || "%00" in lower) return Result.Rejected("encoded_separator")
        val bytes = ByteArrayOutputStream(encoded.length)
        var i = 0
        while (i < encoded.length) {
            val c = encoded[i]
            if (c == '%') {
                if (i + 2 >= encoded.length) return Result.Rejected("bad_percent")
                val hi = Character.digit(encoded[i + 1], 16)
                val lo = Character.digit(encoded[i + 2], 16)
                if (hi < 0 || lo < 0) return Result.Rejected("bad_percent")
                bytes.write(hi * 16 + lo)
                i += 3
            } else {
                val cp = encoded.codePointAt(i)
                bytes.write(String(Character.toChars(cp)).toByteArray(Charsets.UTF_8))
                i += Character.charCount(cp)
            }
        }
        val decoder = Charsets.UTF_8.newDecoder()
            .onMalformedInput(CodingErrorAction.REPORT)
            .onUnmappableCharacter(CodingErrorAction.REPORT)
        val decoded = try {
            decoder.decode(ByteBuffer.wrap(bytes.toByteArray())).toString()
        } catch (_: CharacterCodingException) {
            return Result.Rejected("bad_utf8")
        }
        if (decoded.endsWith("/")) return Result.Rejected("directory")
        return validateRelative(decoded)
    }

    /**
     * Resolves an already validated relative path inside [root] and verifies canonical
     * containment using a separator-aware check (never a bare string prefix).
     */
    fun resolveContained(root: File, relative: String): File? {
        val rootCanonical = root.canonicalFile
        val target = File(rootCanonical, relative.replace('/', File.separatorChar)).canonicalFile
        var cursor: File? = target
        while (cursor != null) {
            if (cursor == rootCanonical) return if (target == rootCanonical) null else target
            cursor = cursor.parentFile
        }
        return null
    }
}
