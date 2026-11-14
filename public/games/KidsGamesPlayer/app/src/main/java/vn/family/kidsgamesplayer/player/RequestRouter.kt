package vn.family.kidsgamesplayer.player

import java.net.URI
import java.net.URISyntaxException
import java.util.Locale
import vn.family.kidsgamesplayer.core.ImportLimits
import vn.family.kidsgamesplayer.core.InventoryEntry
import vn.family.kidsgamesplayer.core.MimeTypes
import vn.family.kidsgamesplayer.core.PathPolicy

/**
 * Pure request policy (bible §8.2). Decides what to do with every request the WebView
 * hands to shouldInterceptRequest. Only one branch may return "pass through" (null to
 * WebView): embedded non-document `data:` media. Everything else is answered locally.
 */
class RequestRouter(private val limits: ImportLimits = ImportLimits.DEFAULT) {

    enum class BlockKind { EXTERNAL, OTHER_GAME, SCHEME, BAD_PATH, METHOD, NOT_FOUND, DATA_DOCUMENT }

    sealed interface Decision {
        data object PassThroughDataUri : Decision
        data class Reject(val status: Int, val kind: BlockKind, val detail: String) : Decision
        data class Serve(val path: String, val entry: InventoryEntry, val head: Boolean, val range: RangeDecision) : Decision
        /** A host file under the reserved `/__kgp__/` directory (see [HostAssets]). */
        data class HostAsset(val path: String, val head: Boolean) : Decision
    }

    fun decide(session: GameSession, url: String, method: String, rangeHeader: String?, isMainFrame: Boolean): Decision {
        val colon = url.indexOf(':')
        if (colon <= 0) return Decision.Reject(400, BlockKind.SCHEME, "no scheme")
        val scheme = url.substring(0, colon).lowercase(Locale.ROOT)

        if (scheme == "data") return decideData(url, isMainFrame)
        if (scheme != "https") {
            val kind = if (scheme == "http") BlockKind.EXTERNAL else BlockKind.SCHEME
            return Decision.Reject(403, kind, scheme)
        }

        val uri = try {
            URI(url)
        } catch (_: URISyntaxException) {
            return Decision.Reject(400, BlockKind.BAD_PATH, "unparseable url")
        }
        val host = uri.host?.lowercase(Locale.ROOT)
        val authority = uri.rawAuthority?.lowercase(Locale.ROOT)
        if (host == null || uri.rawUserInfo != null) return Decision.Reject(403, BlockKind.EXTERNAL, "bad authority")
        if (host != session.host || (authority != session.host && authority != session.host + ":443") || (uri.port != -1 && uri.port != 443)) {
            val kind = if (vn.family.kidsgamesplayer.core.Ids.HOST_REGEX.matches(host)) BlockKind.OTHER_GAME else BlockKind.EXTERNAL
            return Decision.Reject(403, kind, host)
        }

        val upperMethod = method.uppercase(Locale.ROOT)
        if (upperMethod != "GET" && upperMethod != "HEAD") return Decision.Reject(405, BlockKind.METHOD, upperMethod)

        val path = when (val r = PathPolicy.decodeUrlPath(uri.rawPath)) {
            is PathPolicy.Result.Ok -> r.path
            is PathPolicy.Result.Rejected -> return Decision.Reject(400, BlockKind.BAD_PATH, r.reason)
        }
        // Reserved for the host; game files at these paths are never served.
        if (path.startsWith(HostAssets.PREFIX)) {
            return if (path == HostAssets.SPEECH_PATH) Decision.HostAsset(path, upperMethod == "HEAD")
            else Decision.Reject(404, BlockKind.NOT_FOUND, path)
        }
        val entry = session.files[path] ?: return Decision.Reject(404, BlockKind.NOT_FOUND, path)
        if (!MimeTypes.isSupported(path)) return Decision.Reject(403, BlockKind.BAD_PATH, "type")
        return Decision.Serve(path, entry, upperMethod == "HEAD", ByteRange.parse(rangeHeader, entry.size))
    }

    private fun decideData(url: String, isMainFrame: Boolean): Decision {
        if (isMainFrame) return Decision.Reject(403, BlockKind.DATA_DOCUMENT, "data document")
        if (url.length > limits.maxDataUriChars) return Decision.Reject(403, BlockKind.SCHEME, "data uri too large")
        val comma = url.indexOf(',')
        if (comma < 0) return Decision.Reject(400, BlockKind.SCHEME, "bad data uri")
        val mediaType = url.substring(5, comma).substringBefore(';')
        return if (MimeTypes.isAllowedDataUriMime(mediaType)) Decision.PassThroughDataUri
        else Decision.Reject(403, BlockKind.DATA_DOCUMENT, "data mime ${mediaType.take(40)}")
    }

    /** Navigation policy: only same-origin HTML pages from the allowlist may become the document. */
    fun allowsNavigation(session: GameSession, url: String, isMainFrame: Boolean): Boolean {
        if (!isMainFrame) return false
        val uri = try { URI(url) } catch (_: URISyntaxException) { return false }
        if (uri.scheme?.lowercase(Locale.ROOT) != "https") return false
        if (uri.rawUserInfo != null || uri.host?.lowercase(Locale.ROOT) != session.host) return false
        if (uri.port != -1 && uri.port != 443) return false
        val path = (PathPolicy.decodeUrlPath(uri.rawPath) as? PathPolicy.Result.Ok)?.path ?: return false
        return MimeTypes.isHtml(path) && !path.startsWith(HostAssets.PREFIX) && session.files.containsKey(path)
    }
}
