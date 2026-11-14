package vn.family.kidsgamesplayer.player

import android.content.Context
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.ByteArrayInputStream
import java.io.File
import java.io.FileInputStream
import java.io.InputStream
import java.io.RandomAccessFile
import vn.family.kidsgamesplayer.core.MimeTypes
import vn.family.kidsgamesplayer.core.PathPolicy

/**
 * Builds every local response with host-controlled headers (bible §8.4–8.5). Used both by
 * the WebViewAssetLoader path handler (plain GET) and directly for HEAD/Range requests,
 * because PathHandler.handle(path) never sees request headers or the method.
 */
object GameResponder {
    const val CSP = "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; media-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; " +
        "object-src 'none'; frame-src 'none'; child-src 'none'; worker-src 'none'; base-uri 'none'; " +
        "form-action 'none'; frame-ancestors 'none'"

    private fun baseHeaders(isHtml: Boolean): MutableMap<String, String> = linkedMapOf(
        "Cache-Control" to "no-store",
        "X-Content-Type-Options" to "nosniff",
        "Referrer-Policy" to "no-referrer",
        "Accept-Ranges" to "bytes",
    ).apply { if (isHtml) put("Content-Security-Policy", CSP) }

    fun reject(status: Int): WebResourceResponse {
        val reason = when (status) {
            400 -> "Bad Request"
            403 -> "Forbidden"
            404 -> "Not Found"
            405 -> "Method Not Allowed"
            416 -> "Range Not Satisfiable"
            else -> "Error"
        }
        return WebResourceResponse("text/plain", "utf-8", status, reason, baseHeaders(false), ByteArrayInputStream(ByteArray(0)))
    }

    fun respond(session: GameSession, serve: RequestRouter.Decision.Serve): WebResourceResponse {
        val file = PathPolicy.resolveContained(session.root, serve.path) ?: return reject(404)
        if (!file.isFile) return reject(404)
        val length = file.length()
        // Revisions are immutable; a size mismatch means local corruption. Refuse unknown bytes.
        if (length != serve.entry.size) return reject(404)
        val type = MimeTypes.forPath(serve.path) ?: return reject(403)
        // Content-Length is not set here: WebView derives it from the stream's available()
        // (and the request Range) and would append a second, conflicting value.
        val isHtml = MimeTypes.isHtml(serve.path)
        val headers = baseHeaders(isHtml)
        val encoding = if (type.isText) "utf-8" else null
        return when (val r = serve.range) {
            RangeDecision.Full -> {
                val body: InputStream = if (isHtml && length <= MAX_INJECT_BYTES) {
                    // Every page gets the host speech shim as its first script (DECISIONS §22).
                    val bytes = HtmlInjector.inject(file.readBytes())
                    if (serve.head) HeadStream(bytes.size.toLong()) else ByteArrayInputStream(bytes)
                } else {
                    if (serve.head) HeadStream(length) else FileInputStream(file)
                }
                WebResourceResponse(type.mime, encoding, 200, "OK", headers, body)
            }
            // Range requests on HTML (only possible from fetch(), never for navigation) get the
            // original file bytes without the shim, so offsets match the file in the game folder.
            is RangeDecision.Partial -> {
                headers["Content-Range"] = "bytes ${r.start}-${r.endInclusive}/$length"
                // WebView's stream loader applies the request's Range itself: it reads available()
                // as the total size, skip()s to the first byte and reads to EOF. So the body is
                // the whole file seen from offset 0, ending right after the last requested byte.
                // (Chromium components/embedder_support/android/util/input_stream_reader.cc)
                val body: InputStream = if (serve.head) HeadStream(length) else RangeEndLimitedStream(file, r.endInclusive + 1)
                WebResourceResponse(type.mime, encoding, 206, "Partial Content", headers, body)
            }
            RangeDecision.Unsatisfiable -> {
                headers["Content-Range"] = "bytes */$length"
                WebResourceResponse(type.mime, encoding, 416, "Range Not Satisfiable", headers, empty())
            }
        }
    }

    /** A file of the host under `/__kgp__/` (currently only the speech shim), from the APK. */
    fun hostAsset(context: Context, asset: RequestRouter.Decision.HostAsset): WebResourceResponse {
        val bytes = when (asset.path) {
            HostAssets.SPEECH_PATH -> HostAssets.speechShim(context)
            else -> null
        } ?: return reject(404)
        val body: InputStream = if (asset.head) HeadStream(bytes.size.toLong()) else ByteArrayInputStream(bytes)
        return WebResourceResponse("text/javascript", "utf-8", 200, "OK", baseHeaders(false), body)
    }

    /** HTML page generated by the host (never game code), used to clear an abandoned origin. */
    fun hostHtml(html: String): WebResourceResponse {
        val bytes = html.toByteArray(Charsets.UTF_8)
        return WebResourceResponse("text/html", "utf-8", 200, "OK", baseHeaders(true), ByteArrayInputStream(bytes))
    }

    private fun empty(): InputStream = ByteArrayInputStream(ByteArray(0))

    /** HTML pages up to this size are read into memory to insert the shim; larger ones are served as-is. */
    const val MAX_INJECT_BYTES = 8L * 1024 * 1024

    /** Path handler bound to one immutable session; resolves through the same allowlist. */
    class SessionPathHandler(private val session: GameSession) : WebViewAssetLoader.PathHandler {
        override fun handle(path: String): WebResourceResponse {
            val relative = if (path.isEmpty()) PathPolicy.ENTRY else path
            val normalized = when (val r = PathPolicy.validateRelative(relative)) {
                is PathPolicy.Result.Ok -> r.path
                is PathPolicy.Result.Rejected -> return reject(400)
            }
            val entry = session.files[normalized] ?: return reject(404)
            return respond(session, RequestRouter.Decision.Serve(normalized, entry, head = false, range = RangeDecision.Full))
        }
    }
}

/** HEAD body: no bytes, but reports the resource size so WebView emits the right Content-Length. */
class HeadStream(private val size: Long) : InputStream() {
    override fun read(): Int = -1
    override fun read(b: ByteArray, off: Int, len: Int): Int = -1
    override fun available(): Int = minOf(size, Int.MAX_VALUE.toLong()).toInt()
}

/**
 * File stream for 206 responses served to WebView. It starts at offset 0, reports the full
 * remaining file size from [available] (WebView uses it to validate the range), supports
 * [skip] (WebView seeks to the first requested byte itself) and reaches EOF at
 * [endExclusive], so exactly the requested bytes are delivered. The file is closed on close().
 */
class RangeEndLimitedStream(file: File, private val endExclusive: Long) : InputStream() {
    private val raf = RandomAccessFile(file, "r")
    private val total = raf.length()
    private var pos = 0L

    override fun read(): Int {
        if (pos >= endExclusive) return -1
        val b = raf.read()
        if (b >= 0) pos++ else pos = endExclusive
        return b
    }

    override fun read(b: ByteArray, off: Int, len: Int): Int {
        if (len == 0) return 0
        if (pos >= endExclusive) return -1
        val n = raf.read(b, off, minOf(len.toLong(), endExclusive - pos).toInt())
        if (n < 0) {
            pos = endExclusive
            return -1
        }
        pos += n
        return n
    }

    override fun skip(n: Long): Long {
        if (n <= 0) return 0
        val k = minOf(n, endExclusive - pos).coerceAtLeast(0)
        pos += k
        raf.seek(pos)
        return k
    }

    override fun available(): Int = minOf((total - pos).coerceAtLeast(0), Int.MAX_VALUE.toLong()).toInt()

    override fun close() = raf.close()
}
