package vn.family.kidsgamesplayer

import android.content.Context
import android.os.SystemClock
import android.view.ViewGroup
import android.widget.FrameLayout
import androidx.test.core.app.ActivityScenario
import androidx.test.platform.app.InstrumentationRegistry
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import androidx.webkit.WebViewRenderProcess
import org.json.JSONObject
import org.json.JSONTokener
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.core.Ids
import vn.family.kidsgamesplayer.debug.WebViewTestActivity
import vn.family.kidsgamesplayer.importer.AppPaths
import vn.family.kidsgamesplayer.importer.GameImporter
import vn.family.kidsgamesplayer.importer.IconInspector
import vn.family.kidsgamesplayer.importer.RevisionStore
import vn.family.kidsgamesplayer.player.GameChromeClient
import vn.family.kidsgamesplayer.player.GameRenderProcessClient
import vn.family.kidsgamesplayer.player.GameSession
import vn.family.kidsgamesplayer.player.GameWebViewClient
import vn.family.kidsgamesplayer.player.GameWebViewFactory
import vn.family.kidsgamesplayer.player.KidsWebView
import vn.family.kidsgamesplayer.player.PlayerEvents
import vn.family.kidsgamesplayer.player.RequestRouter
import vn.family.kidsgamesplayer.source.FileSourceNode
import java.io.File
import java.util.Collections
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicReference

/**
 * Loads fixture folders through the real importer, router, clients and WebView settings,
 * inside a debug-only empty activity. Results are read back with evaluateJavascript
 * (the same fixed native→page channel the player uses).
 */
class WebViewHarness : AutoCloseable {
    val instrumentation = InstrumentationRegistry.getInstrumentation()
    val appContext: Context = instrumentation.targetContext
    private val testAssets = instrumentation.context.assets
    private val workDir = File(appContext.cacheDir, "kgp-it-" + System.nanoTime()).apply { mkdirs() }
    private val paths = AppPaths(File(workDir, "files"))
    val revisions = RevisionStore(paths)
    private val importer = GameImporter(revisions, IconInspector { 1 to 1 }, settleDelayMs = 0, sleeper = {})
    val scenario: ActivityScenario<WebViewTestActivity> = ActivityScenario.launch(WebViewTestActivity::class.java)
    var webView: KidsWebView? = null
        private set
    private var generation = 0L

    val events = RecordingEvents()

    class RecordingEvents : PlayerEvents {
        val pageFinished: MutableList<String> = Collections.synchronizedList(mutableListOf())
        val blocked: MutableList<String> = Collections.synchronizedList(mutableListOf())
        val messages: MutableList<String> = Collections.synchronizedList(mutableListOf())
        val mainFrameErrors: MutableList<String> = Collections.synchronizedList(mutableListOf())
        @Volatile var renderGone: Boolean? = null
        @Volatile var unresponsive = false
        /** Run on the main thread, like PlayerController's handlers (speech channel tests). */
        @Volatile var onPageStartedHook: ((String) -> Unit)? = null
        @Volatile var onPageFinishedHook: ((String) -> Unit)? = null

        override fun onPageStarted(generation: Long, url: String) { onPageStartedHook?.invoke(url) }
        override fun onPageFinished(generation: Long, url: String) {
            onPageFinishedHook?.invoke(url)
            pageFinished += url
        }
        override fun onMainFrameError(generation: Long, description: String) { mainFrameErrors += description }
        override fun onRenderProcessGone(generation: Long, crashed: Boolean) { renderGone = crashed }
        override fun onRendererUnresponsive(generation: Long, process: WebViewRenderProcess?) {
            unresponsive = true
            if (process != null && WebViewFeature.isFeatureSupported(WebViewFeature.WEB_VIEW_RENDERER_TERMINATE)) process.terminate()
        }
        override fun onRendererResponsive(generation: Long) = Unit
        override fun onBlocked(generation: Long, kind: RequestRouter.BlockKind, detail: String) { blocked += "$kind $detail" }
        override fun onGameMessage(generation: Long, tag: String, message: String) { messages += "$tag $message" }
    }

    /** Copies assets/<assetDir> to disk and imports it as a basic game with the given token. */
    fun importFixture(assetDir: String, token: String = Ids.newOriginToken(), gameId: String = "it-" + System.nanoTime()): GameSession {
        val src = File(workDir, "src/" + assetDir.replace('/', '_') + "-" + System.nanoTime())
        copyAssetDir(assetDir, src)
        val prepared = importer.prepare(FileSourceNode(src), allowBuiltinNamespace = false) as GameImporter.Prepared.Ok
        val outcome = importer.import(prepared.candidate, gameId, null, allowMissingReferences = true)
        check(outcome is GameImporter.Outcome.Imported) { "fixture import failed: $outcome" }
        val meta = outcome.meta
        check(meta.validationLevel == ValidationLevel.BASIC || meta.validationLevel == ValidationLevel.VERIFIED)
        return GameSession(
            generation = ++generation,
            internalGameId = gameId,
            title = assetDir,
            revisionHash = meta.revisionHash,
            root = revisions.revisionRoot(gameId, meta.revisionHash),
            storageOriginToken = token,
            files = meta.files.associateBy { it.path },
            sdkGame = true,
        )
    }

    private fun copyAssetDir(assetPath: String, dest: File) {
        val children = testAssets.list(assetPath) ?: emptyArray()
        if (children.isEmpty()) {
            dest.parentFile?.mkdirs()
            testAssets.open(assetPath).use { input -> dest.outputStream().use { input.copyTo(it) } }
            return
        }
        dest.mkdirs()
        for (c in children) copyAssetDir("$assetPath/$c", File(dest, c))
    }

    fun load(session: GameSession, urlSuffix: String = "") {
        destroyWebView()
        events.pageFinished.clear()
        scenario.onActivity { activity ->
            val wv = GameWebViewFactory.create(activity)
            wv.webViewClient = GameWebViewClient(session, RequestRouter(), events)
            wv.webChromeClient = GameChromeClient(session.generation, events)
            if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_VIEW_RENDERER_CLIENT_BASIC_USAGE)) {
                WebViewCompat.setWebViewRenderProcessClient(wv, GameRenderProcessClient(session.generation, events))
            }
            activity.container.addView(wv, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
            webView = wv
            wv.loadUrl(session.entryUrl + urlSuffix)
        }
        waitUntil(15_000) { events.pageFinished.isNotEmpty() }
    }

    /** Evaluates [script] on the UI thread and returns the JSON-encoded result. */
    fun eval(script: String, timeoutMs: Long = 5_000): String? {
        val latch = CountDownLatch(1)
        val out = AtomicReference<String?>()
        scenario.onActivity { webView?.evaluateJavascript(script) { r -> out.set(r); latch.countDown() } ?: latch.countDown() }
        latch.await(timeoutMs, TimeUnit.MILLISECONDS)
        return out.get()
    }

    /** Polls window.__results until it has done === true, then returns it as JSON. */
    fun results(timeoutMs: Long = 15_000): JSONObject {
        var last: String? = null
        val deadline = SystemClock.elapsedRealtime() + timeoutMs
        while (SystemClock.elapsedRealtime() < deadline) {
            last = eval("(function(){var r=window.__results;return r&&r.done?JSON.stringify(r):null;})()")
            if (last != null && last != "null") return JSONObject(JSONTokener(last).nextValue() as String)
            SystemClock.sleep(200)
        }
        throw AssertionError("fixture did not finish; last=$last; blocked=${events.blocked}; messages=${events.messages}")
    }

    /** Injects a real tap (user activation) at the given fraction of the WebView area. */
    fun tap(fx: Float = 0.5f, fy: Float = 0.5f) {
        val loc = IntArray(2)
        var w = 0
        var hgt = 0
        scenario.onActivity {
            webView!!.getLocationOnScreen(loc)
            w = webView!!.width
            hgt = webView!!.height
        }
        val x = loc[0] + w * fx
        val y = loc[1] + hgt * fy
        val down = SystemClock.uptimeMillis()
        val ev1 = android.view.MotionEvent.obtain(down, down, android.view.MotionEvent.ACTION_DOWN, x, y, 0)
        val ev2 = android.view.MotionEvent.obtain(down, down + 60, android.view.MotionEvent.ACTION_UP, x, y, 0)
        ev1.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
        ev2.source = android.view.InputDevice.SOURCE_TOUCHSCREEN
        instrumentation.uiAutomation.injectInputEvent(ev1, true)
        instrumentation.uiAutomation.injectInputEvent(ev2, true)
        ev1.recycle()
        ev2.recycle()
    }

    fun waitUntil(timeoutMs: Long, condition: () -> Boolean): Boolean {
        val deadline = SystemClock.elapsedRealtime() + timeoutMs
        while (SystemClock.elapsedRealtime() < deadline) {
            if (condition()) return true
            SystemClock.sleep(100)
        }
        return condition()
    }

    fun destroyWebView() {
        scenario.onActivity { activity ->
            webView?.let {
                activity.container.removeView(it)
                it.destroy()
            }
            webView = null
        }
    }

    override fun close() {
        destroyWebView()
        scenario.close()
        workDir.deleteRecursively()
    }
}
