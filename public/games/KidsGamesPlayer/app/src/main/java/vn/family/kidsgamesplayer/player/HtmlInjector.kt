package vn.family.kidsgamesplayer.player

/**
 * Inserts the host's speech shim tag into a game HTML document at byte level (no decoding,
 * the page keeps its encoding). The tag goes right after the first `<head …>` start tag; with
 * no head, after `<html …>`; with neither, after the doctype and leading comments; otherwise
 * at the start (after a UTF-8 BOM). It is never placed before the doctype, which would switch
 * the page to quirks mode. Only the document prolog is scanned, so a `<head>` inside a comment
 * or a later `<header>` element is never mistaken for the head.
 */
object HtmlInjector {
    const val SHIM_TAG = "<script src=\"/" + HostAssets.SPEECH_PATH + "\"></script>"
    private val TAG_BYTES = SHIM_TAG.toByteArray(Charsets.US_ASCII)

    /** Returns the document with the shim tag, or [html] unchanged when it is UTF-16 encoded. */
    fun inject(html: ByteArray): ByteArray {
        val at = insertionOffset(html) ?: return html
        val out = ByteArray(html.size + TAG_BYTES.size)
        System.arraycopy(html, 0, out, 0, at)
        System.arraycopy(TAG_BYTES, 0, out, at, TAG_BYTES.size)
        System.arraycopy(html, at, out, at + TAG_BYTES.size, html.size - at)
        return out
    }

    /** Byte offset where the tag goes, or null when the bytes are UTF-16 (ASCII would corrupt them). */
    fun insertionOffset(b: ByteArray): Int? {
        if (b.size >= 2 && ((b[0] == 0xFE.toByte() && b[1] == 0xFF.toByte()) || (b[0] == 0xFF.toByte() && b[1] == 0xFE.toByte()))) {
            return null
        }
        var pos = if (b.size >= 3 && b[0] == 0xEF.toByte() && b[1] == 0xBB.toByte() && b[2] == 0xBF.toByte()) 3 else 0
        // Prolog: whitespace, comments, <!doctype …>, <?…?>. An unterminated one runs to the
        // end of the file, so the tag goes last rather than in front of it.
        var afterProlog = pos
        while (true) {
            pos = skipSpace(b, pos)
            when {
                startsWith(b, pos, "<!--") -> pos = indexOf(b, "-->", pos + 4)?.plus(3) ?: return b.size
                startsWith(b, pos, "<!") || startsWith(b, pos, "<?") -> pos = tagEnd(b, pos) ?: return b.size
                else -> break
            }
            afterProlog = pos
        }
        if (isStartTag(b, pos, "html")) {
            val afterHtml = tagEnd(b, pos) ?: return afterProlog
            var p = afterHtml
            while (true) {
                p = skipSpace(b, p)
                if (startsWith(b, p, "<!--")) p = indexOf(b, "-->", p + 4)?.plus(3) ?: return afterHtml else break
            }
            return if (isStartTag(b, p, "head")) tagEnd(b, p) ?: afterHtml else afterHtml
        }
        if (isStartTag(b, pos, "head")) return tagEnd(b, pos) ?: afterProlog
        return afterProlog
    }

    private fun skipSpace(b: ByteArray, from: Int): Int {
        var p = from
        while (p < b.size && (b[p] == ' '.code.toByte() || b[p] == '\t'.code.toByte() || b[p] == '\n'.code.toByte() ||
                b[p] == '\r'.code.toByte() || b[p] == 0x0C.toByte())
        ) p++
        return p
    }

    private fun lower(x: Byte): Int {
        val c = x.toInt() and 0xFF
        return if (c in 'A'.code..'Z'.code) c + 32 else c
    }

    private fun startsWith(b: ByteArray, at: Int, s: String): Boolean {
        if (at < 0 || at + s.length > b.size) return false
        for (i in s.indices) if (lower(b[at + i]) != s[i].code) return false
        return true
    }

    /** `<name` followed by whitespace, `/` or `>` (so `<header>` is not `<head>`). */
    private fun isStartTag(b: ByteArray, at: Int, name: String): Boolean {
        if (!startsWith(b, at, "<$name")) return false
        val next = at + name.length + 1
        if (next >= b.size) return false
        val c = b[next].toInt() and 0xFF
        return c == ' '.code || c == '\t'.code || c == '\n'.code || c == '\r'.code || c == 0x0C || c == '/'.code || c == '>'.code
    }

    /** Offset just after the `>` closing the tag that starts at [at]; quoted attribute values may contain `>`. */
    private fun tagEnd(b: ByteArray, at: Int): Int? {
        var p = at + 1
        var quote = 0
        while (p < b.size) {
            val c = b[p].toInt() and 0xFF
            if (quote != 0) {
                if (c == quote) quote = 0
            } else if (c == '"'.code || c == '\''.code) {
                quote = c
            } else if (c == '>'.code) {
                return p + 1
            }
            p++
        }
        return null
    }

    private fun indexOf(b: ByteArray, s: String, from: Int): Int? {
        var p = from
        while (p + s.length <= b.size) {
            if (startsWith(b, p, s)) return p
            p++
        }
        return null
    }
}
