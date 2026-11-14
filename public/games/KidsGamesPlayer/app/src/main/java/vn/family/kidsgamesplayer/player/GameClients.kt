package vn.family.kidsgamesplayer.player

import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Message
import android.view.View
import android.webkit.ConsoleMessage
import android.webkit.GeolocationPermissions
import android.webkit.HttpAuthHandler
import android.webkit.JsPromptResult
import android.webkit.JsResult
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.graphics.createBitmap
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewRenderProcess
import androidx.webkit.WebViewRenderProcessClient

/** Callbacks from one session's WebView; every call carries the session generation. */
interface PlayerEvents {
    /** A new document of the game origin started loading (not called for same-document navigation). */
    fun onPageStarted(generation: Long, url: String) = Unit
    fun onPageFinished(generation: Long, url: String)
    fun onMainFrameError(generation: Long, description: String)
    fun onRenderProcessGone(generation: Long, crashed: Boolean)
    fun onRendererUnresponsive(generation: Long, process: WebViewRenderProcess?)
    fun onRendererResponsive(generation: Long)
    fun onBlocked(generation: Long, kind: RequestRouter.BlockKind, detail: String)
    fun onGameMessage(generation: Long, tag: String, message: String)
}

/**
 * Resource + navigation policy for one immutable [GameSession]. shouldInterceptRequest
 * protects resources, shouldOverrideUrlLoading protects navigation; both are required.
 */
class GameWebViewClient(
    private val session: GameSession,
    private val router: RequestRouter,
    private val events: PlayerEvents,
) : WebViewClient() {

    private val assetLoader: WebViewAssetLoader = WebViewAssetLoader.Builder()
        .setDomain(session.host)
        .setHttpAllowed(false)
        .addPathHandler("/", GameResponder.SessionPathHandler(session))
        .build()

    override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? {
        val url = request.url.toString()
        val range = request.requestHeaders?.entries?.firstOrNull { it.key.equals("Range", ignoreCase = true) }?.value
        return when (val d = router.decide(session, url, request.method ?: "GET", range, request.isForMainFrame)) {
            RequestRouter.Decision.PassThroughDataUri -> null
            is RequestRouter.Decision.Reject -> {
                events.onBlocked(session.generation, d.kind, if (d.kind == RequestRouter.BlockKind.NOT_FOUND) d.detail else url)
                GameResponder.reject(d.status)
            }
            is RequestRouter.Decision.HostAsset -> GameResponder.hostAsset(view.context, d)
            is RequestRouter.Decision.Serve ->
                if (!d.head && d.range == RangeDecision.Full) {
                    assetLoader.shouldInterceptRequest(request.url) ?: GameResponder.reject(404)
                } else {
                    GameResponder.respond(session, d)
                }
        }
    }

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val url = request.url.toString()
        if (router.allowsNavigation(session, url, request.isForMainFrame)) return false
        // Never hand blocked links to other apps: no ACTION_VIEW, no browser.
        events.onBlocked(session.generation, RequestRouter.BlockKind.EXTERNAL, "navigation " + url)
        return true
    }

    override fun onPageStarted(view: WebView, url: String?, favicon: Bitmap?) {
        // Readiness is reported from onPageFinished only; this only marks a new document.
        if (url != null && url.startsWith(session.origin + "/")) events.onPageStarted(session.generation, url)
    }

    override fun onPageFinished(view: WebView, url: String?) {
        if (url != null && url.startsWith(session.origin + "/")) events.onPageFinished(session.generation, url)
    }

    override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
        if (request.isForMainFrame) events.onMainFrameError(session.generation, "${error.errorCode} ${error.description}")
    }

    override fun onReceivedHttpError(view: WebView, request: WebResourceRequest, errorResponse: WebResourceResponse) {
        if (request.isForMainFrame) events.onMainFrameError(session.generation, "HTTP ${errorResponse.statusCode}")
    }

    override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: SslError) {
        handler.cancel()
    }

    override fun onReceivedHttpAuthRequest(view: WebView, handler: HttpAuthHandler, host: String?, realm: String?) {
        handler.cancel()
    }

    override fun onFormResubmission(view: WebView, dontResend: Message, resend: Message) {
        dontResend.sendToTarget()
    }

    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        events.onRenderProcessGone(session.generation, detail.didCrash())
        return true
    }
}

/** Denies every capability a game might ask the host for (bible §8.6). */
class GameChromeClient(
    private val generation: Long,
    private val events: PlayerEvents,
) : WebChromeClient() {
    private var consoleBudget = 40
    private var dialogBudget = 5

    override fun onCreateWindow(view: WebView, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message): Boolean {
        events.onBlocked(generation, RequestRouter.BlockKind.EXTERNAL, "popup window")
        return false
    }

    override fun onPermissionRequest(request: PermissionRequest) {
        events.onBlocked(generation, RequestRouter.BlockKind.SCHEME, "permission " + request.resources.joinToString())
        request.deny()
    }

    override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback) {
        callback.invoke(origin, false, false)
    }

    override fun onShowFileChooser(view: WebView, callback: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
        events.onBlocked(generation, RequestRouter.BlockKind.SCHEME, "file chooser")
        callback.onReceiveValue(null)
        return true
    }

    override fun onJsAlert(view: WebView, url: String?, message: String?, result: JsResult): Boolean = refuseDialog("alert", message, result)
    override fun onJsConfirm(view: WebView, url: String?, message: String?, result: JsResult): Boolean = refuseDialog("confirm", message, result)
    override fun onJsBeforeUnload(view: WebView, url: String?, message: String?, result: JsResult): Boolean = refuseDialog("beforeunload", message, result)
    override fun onJsPrompt(view: WebView, url: String?, message: String?, defaultValue: String?, result: JsPromptResult): Boolean =
        refuseDialog("prompt", message, result)

    private fun refuseDialog(kind: String, message: String?, result: JsResult): Boolean {
        if (dialogBudget-- > 0) events.onGameMessage(generation, "js-$kind", message ?: "")
        result.cancel()
        return true
    }

    override fun onShowCustomView(view: View, callback: CustomViewCallback) {
        // Web fullscreen would cover the native controls; fullscreen is host-managed.
        callback.onCustomViewHidden()
    }

    override fun onConsoleMessage(consoleMessage: ConsoleMessage): Boolean {
        if (consoleMessage.messageLevel() == ConsoleMessage.MessageLevel.ERROR ||
            consoleMessage.messageLevel() == ConsoleMessage.MessageLevel.WARNING
        ) {
            if (consoleBudget-- > 0) {
                events.onGameMessage(generation, "console", "${consoleMessage.message()} @${consoleMessage.lineNumber()}")
            }
        }
        return true
    }

    override fun getDefaultVideoPoster(): Bitmap = createBitmap(1, 1)
}

class GameRenderProcessClient(
    private val generation: Long,
    private val events: PlayerEvents,
) : WebViewRenderProcessClient() {
    override fun onRenderProcessUnresponsive(view: WebView, renderer: WebViewRenderProcess?) {
        events.onRendererUnresponsive(generation, renderer)
    }

    override fun onRenderProcessResponsive(view: WebView, renderer: WebViewRenderProcess?) {
        events.onRendererResponsive(generation)
    }
}
