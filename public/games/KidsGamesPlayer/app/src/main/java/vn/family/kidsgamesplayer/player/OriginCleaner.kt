package vn.family.kidsgamesplayer.player

import android.content.Context
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.launch
import vn.family.kidsgamesplayer.AppGraph
import vn.family.kidsgamesplayer.core.Ids

/**
 * Best-effort cleanup of abandoned origins after "Xóa tiến trình" (bible §7.3). The logical
 * reset (new origin token) is already committed; this only clears old localStorage bytes by
 * loading a host-generated page — never game files — at the old origin. Failures are logged
 * and retried on a later start; they never undo the reset.
 */
class OriginCleaner(private val context: Context, private val graph: AppGraph, private val scope: CoroutineScope) {
    private var running = false
    private val attempts = HashMap<String, Int>()

    /** Must only run while no game WebView is alive. */
    fun runPending() {
        if (running) return
        val token = graph.catalog.current.pendingOriginCleanups.firstOrNull { (attempts[it] ?: 0) < 3 } ?: return
        if (!Ids.TOKEN_REGEX.matches(token)) {
            finish(token, success = true)
            return
        }
        running = true
        attempts[token] = (attempts[token] ?: 0) + 1
        val webView = try {
            GameWebViewFactory.create(context)
        } catch (t: Throwable) {
            running = false
            graph.diagnostics.log("cleanup", "webview unavailable: ${t.javaClass.simpleName}")
            return
        }
        val host = Ids.hostForToken(token)
        val pageUrl = "https://$host/__kgp_reset__.html"
        var done = false
        val complete = { ok: Boolean ->
            if (!done) {
                done = true
                webView.stopLoading()
                webView.destroy()
                running = false
                if (ok) finish(token, success = true) else graph.diagnostics.log("cleanup", "origin cleanup failed, will retry later")
            }
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse =
                if (request.url.toString() == pageUrl) {
                    GameResponder.hostHtml("<!doctype html><meta charset=\"utf-8\"><title>reset</title>")
                } else {
                    GameResponder.reject(403)
                }

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = true

            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
                complete(false)
                return true
            }

            override fun onPageFinished(view: WebView, url: String?) {
                if (url != pageUrl) return
                view.evaluateJavascript(
                    "(function(){try{localStorage.clear();sessionStorage.clear();return String(localStorage.length);}catch(e){return 'error';}})()",
                ) { result -> complete(result == "\"0\"") }
            }
        }
        webView.loadUrl(pageUrl)
        webView.postDelayed({ complete(false) }, 10_000)
    }

    private fun finish(token: String, success: Boolean) {
        scope.launch {
            runCatching {
                graph.catalog.update { cat ->
                    if (token !in cat.pendingOriginCleanups) cat to Unit
                    else cat.copy(pendingOriginCleanups = cat.pendingOriginCleanups - token) to Unit
                }
            }
            if (success) graph.diagnostics.log("cleanup", "old progress origin cleared")
            runPending()
        }
    }
}
