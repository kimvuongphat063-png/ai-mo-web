package vn.family.kidsgamesplayer.player

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Color
import android.view.ActionMode
import android.view.View
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.webkit.ServiceWorkerClientCompat
import androidx.webkit.ServiceWorkerControllerCompat
import androidx.webkit.WebResourceRequestCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature

/**
 * WebView that never starts a text-selection/context action mode, so long presses cannot
 * open Search, Share or other apps from game content (bible §8.6).
 */
@SuppressLint("ViewConstructor")
class KidsWebView(context: Context) : WebView(context) {
    override fun startActionMode(callback: ActionMode.Callback?): ActionMode? = null
    override fun startActionMode(callback: ActionMode.Callback?, type: Int): ActionMode? = null
}

/** Creates and configures game WebViews; one instance per play session, never pooled. */
object GameWebViewFactory {

    /** May throw if the WebView provider is missing or broken; callers show a native error. */
    @SuppressLint("SetJavaScriptEnabled")
    fun create(context: Context, background: Int = Color.BLACK): KidsWebView {
        val webView = KidsWebView(context)
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            @Suppress("DEPRECATION")
            allowFileAccessFromFileURLs = false
            @Suppress("DEPRECATION")
            allowUniversalAccessFromFileURLs = false
            javaScriptCanOpenWindowsAutomatically = false
            // true only so that onCreateWindow is invoked, where every popup is refused.
            setSupportMultipleWindows(true)
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            blockNetworkLoads = true
            builtInZoomControls = false
            displayZoomControls = false
            setSupportZoom(false)
            cacheMode = WebSettings.LOAD_NO_CACHE
            setGeolocationEnabled(false)
            loadsImagesAutomatically = true
            textZoom = 100
        }
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(webView.settings, false)
        }
        webView.isLongClickable = false
        webView.setOnLongClickListener { true }
        webView.isHapticFeedbackEnabled = false
        webView.overScrollMode = View.OVER_SCROLL_NEVER
        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false
        webView.setBackgroundColor(background)
        return webView
    }

    fun muteSupported(): Boolean = WebViewFeature.isFeatureSupported(WebViewFeature.MUTE_AUDIO)

    /** Applies native mute only when the provider supports it (runtime feature gate). */
    fun setMuted(webView: WebView, muted: Boolean): Boolean {
        if (!muteSupported()) return false
        WebViewCompat.setAudioMuted(webView, muted)
        return true
    }

    /**
     * Global, once per process: service workers are outside the v1 contract. Where the
     * provider exposes the controls, deny every worker request and block worker network,
     * file and content access.
     */
    fun lockDownServiceWorkers() {
        if (!WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BASIC_USAGE)) return
        val controller = ServiceWorkerControllerCompat.getInstance()
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_SHOULD_INTERCEPT_REQUEST)) {
            controller.setServiceWorkerClient(object : ServiceWorkerClientCompat() {
                override fun shouldInterceptRequest(request: WebResourceRequest): WebResourceResponse =
                    GameResponder.reject(403)
            })
        }
        val s = controller.serviceWorkerWebSettings
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_BLOCK_NETWORK_LOADS)) s.blockNetworkLoads = true
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_CONTENT_ACCESS)) s.allowContentAccess = false
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_FILE_ACCESS)) s.allowFileAccess = false
        if (WebViewFeature.isFeatureSupported(WebViewFeature.SERVICE_WORKER_CACHE_MODE)) s.cacheMode = WebSettings.LOAD_NO_CACHE
    }

    fun isRedirect(request: WebResourceRequest): Boolean =
        WebViewFeature.isFeatureSupported(WebViewFeature.WEB_RESOURCE_REQUEST_IS_REDIRECT) &&
            WebResourceRequestCompat.isRedirect(request)
}
