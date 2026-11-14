package vn.family.kidsgamesplayer

import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.webkit.WebViewFeature
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.player.HostReason
import vn.family.kidsgamesplayer.player.HostState
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

/**
 * Real WebView behaviour of the local HTTPS origin design (bible Milestone A gate, I06, I07,
 * I11–I13, I19–I20). The app has no INTERNET permission; everything is served by the router.
 */
@RunWith(AndroidJUnit4::class)
class WebViewPolicyTest {
    private lateinit var h: WebViewHarness

    @Before
    fun setUp() {
        h = WebViewHarness()
    }

    @After
    fun tearDown() {
        h.close()
    }

    /** Gate A + I06 + U14 runtime + I19: HTML, CSS, classic JS, .mjs module, fetch, Range/HEAD, storage, data:. */
    @Test
    fun localOriginServesModulesFetchRangeAndStorage() {
        val s = h.importFixture("webview/modfetch")
        h.load(s)
        val r = h.results()
        assertEquals(s.origin, r.getString("origin"))
        assertEquals(true, r.get("inline"))
        assertEquals(true, r.get("classic"))
        assertEquals(true, r.get("css"))
        assertEquals(true, r.get("module"))
        assertEquals(true, r.get("fetchJson"))
        assertEquals("unicode/space/plus file name", true, r.get("unicode"))
        assertEquals("206|0123456789|bytes 10-19/100", r.getString("range"))
        assertEquals("206|56789", r.getString("suffix"))
        // WebView turns an unsatisfiable range into ERR_REQUEST_RANGE_NOT_SATISFIABLE before JS
        // sees the 416 (Chromium InputStreamReader::SkipToRequestedRange); never a 200/206 with data.
        val unsat = r.getString("unsatisfiable")
        assertTrue("unsatisfiable range: $unsat", unsat == "416|bytes */100" || unsat.startsWith("err:"))
        assertEquals("200|100", r.getString("head"))
        assertEquals(404, r.getInt("missing"))
        assertNotEquals(200, r.optInt("encodedTraversal", -1))
        assertNotEquals(200, r.optInt("dotTraversal", -1))
        assertEquals(405, r.getInt("post"))
        assertEquals("nosniff", r.getString("nosniff"))
        assertEquals(true, r.get("storage"))
        assertEquals("data: image allowed", true, r.get("dataImg"))
        assertEquals("blob: image allowed", true, r.get("blobImg"))
        assertTrue("CSP must block eval", r.getBoolean("evalBlocked"))
        assertTrue("data:text/html fetch must not succeed: ${r.opt("dataHtmlFetch")}", r.optString("dataHtmlFetch").startsWith("err:") || r.optString("dataHtmlFetch") == "status:403")
    }

    /** I07: two games writing the same key do not see each other; the same token keeps its data. */
    @Test
    fun originsIsolateStorageAndSurviveRevisionChange() {
        val tokenA = "a".repeat(31) + "1"
        val tokenB = "b".repeat(31) + "2"
        val a = h.importFixture("webview/storage", tokenA)
        val b = h.importFixture("webview/storage", tokenB)
        h.load(a, "#set=alpha")
        assertEquals(null, h.results().opt("before").takeIf { it != org.json.JSONObject.NULL })
        h.load(b, "#set=beta")
        assertEquals(null, h.results().opt("before").takeIf { it != org.json.JSONObject.NULL })
        h.load(a)
        assertEquals("alpha", h.results().getString("before"))
        h.load(b)
        assertEquals("beta", h.results().getString("before"))
        // A new revision of game A (different snapshot directory) keeps the same origin/save.
        val a2 = h.importFixture("webview/storage", tokenA, gameId = "it-updated")
        assertNotEquals(a.root, a2.root)
        h.load(a2)
        assertEquals("alpha", h.results().getString("before"))
    }

    /** I12 + I13: popups, external/other-game/file/content requests and navigations are refused. */
    @Test
    fun escapeAttemptsAreBlocked() {
        val s = h.importFixture("webview/escape")
        h.load(s)
        val r = h.results()
        assertEquals(true, r.get("openSame"))
        assertEquals(true, r.get("openCross"))
        SystemClock.sleep(2_500)
        // Page must still be ours after the navigation attempts.
        val alive = h.eval("(function(){return window.__results&&window.__results.alive===true&&location.origin;})()")
        assertEquals("\"${s.origin}\"", alive)
        val after = h.results()
        assertEquals("blocked", after.getString("otherGame"))
        assertEquals("blocked", after.getString("external"))
        assertEquals("blocked", after.getString("cleartext"))
        assertEquals("blocked", after.getString("file"))
        assertEquals("blocked", after.getString("content"))
        assertNotEquals("registered", after.optString("sw"))
        // Without a gesture the popup blocker refuses window.open; with a real tap the request
        // reaches onCreateWindow, which always refuses it.
        h.tap()
        assertTrue(h.waitUntil(5_000) { h.eval("window.__results.gestureDone===true") == "true" })
        // The popup request reaches onCreateWindow and is refused: no window survives.
        assertTrue(h.waitUntil(5_000) { h.eval("window.__results.gestureClosed===true") == "true" })
        assertTrue("onCreateWindow refused: ${h.events.blocked}", h.events.blocked.any { it.contains("popup") })
        assertEquals("\"${s.origin}\"", h.eval("location.origin"))
        // Cross-origin fetches are stopped by CSP connect-src before reaching the router; the
        // router refuses other game hosts as a second layer (RouterAndRangeTest).
        val csp = after.getJSONArray("csp").toString()
        assertTrue("other game host refused: csp=$csp blocked=${h.events.blocked}",
            csp.contains("connect-src") || h.events.blocked.any { it.startsWith("OTHER_GAME") })
        assertTrue(h.events.blocked.any { it.contains("navigation https://example.com") })
        assertEquals(1, h.events.pageFinished.count { it.startsWith(s.origin) })
    }

    /** I20: the SDK starts inactive and muted in the host and does not play before the first host state. */
    @Test
    fun sdkStartsInactiveAndMutedUntilHostState() {
        val s = h.importFixture("webview/sdkboot")
        h.load(s)
        val r = h.results()
        assertEquals("host", r.getString("mode"))
        assertFalse(r.getBoolean("activeBefore"))
        assertTrue(r.getBoolean("mutedBefore"))
        assertFalse(r.getBoolean("playedBeforeHost"))
        val ok = h.eval(HostState(1, active = true, muted = false, reason = HostReason.START, requestSave = false).script())
        assertEquals("\"ok\"", ok)
        assertEquals("true", h.eval("KidsSDK.isActive()"))
        assertEquals("false", h.eval("KidsSDK.isMuted()"))
        // Older sequence numbers are ignored.
        h.eval(HostState(0, active = false, muted = true, reason = HostReason.BACKGROUND, requestSave = true).script())
        assertEquals("true", h.eval("KidsSDK.isActive()"))
        h.eval(HostState(2, active = false, muted = true, reason = HostReason.BACKGROUND, requestSave = true).script())
        assertEquals("false", h.eval("KidsSDK.isActive()"))
        val saves = h.eval("JSON.stringify(window.__results.saves)")
        assertTrue("save requested on background: $saves", saves!!.contains("background"))
    }

    /** I18 (feature gate): toggling native mute never crashes, whatever the provider supports. */
    @Test
    fun muteFeatureGateIsSafe() {
        val s = h.importFixture("webview/storage")
        h.load(s)
        val latch = CountDownLatch(1)
        var applied: Boolean? = null
        h.scenario.onActivity {
            applied = vn.family.kidsgamesplayer.player.GameWebViewFactory.setMuted(h.webView!!, true)
            vn.family.kidsgamesplayer.player.GameWebViewFactory.setMuted(h.webView!!, false)
            latch.countDown()
        }
        assertTrue(latch.await(5, TimeUnit.SECONDS))
        assertEquals(WebViewFeature.isFeatureSupported(WebViewFeature.MUTE_AUDIO), applied)
    }

    /** I11: a JS infinite loop does not block the native UI thread. */
    @Test
    fun hungRendererKeepsNativeUiResponsive() {
        val s = h.importFixture("webview/hang")
        h.load(s)
        SystemClock.sleep(1_500)
        // Input to a hung renderer is what makes WebView report it unresponsive.
        h.tap()
        val latch = CountDownLatch(1)
        val start = SystemClock.elapsedRealtime()
        Handler(Looper.getMainLooper()).post { latch.countDown() }
        assertTrue("main thread blocked", latch.await(2, TimeUnit.SECONDS))
        assertTrue(SystemClock.elapsedRealtime() - start < 2_000)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_VIEW_RENDERER_CLIENT_BASIC_USAGE)) {
            assertTrue("unresponsive callback expected", h.waitUntil(30_000) {
                if (!h.events.unresponsive) h.tap()
                h.events.unresponsive
            })
        }
    }

    /** I11: renderer crash is reported and handled without killing the app process. */
    @Test
    fun rendererCrashIsReported() {
        val s = h.importFixture("webview/storage")
        h.load(s)
        h.scenario.onActivity {
            val wv = h.webView!!
            if (androidx.webkit.WebViewFeature.isFeatureSupported(androidx.webkit.WebViewFeature.WEB_VIEW_RENDERER_TERMINATE)) {
                // Deterministic renderer loss (same callback path as a system kill).
                androidx.webkit.WebViewCompat.getWebViewRenderProcess(wv)?.terminate()
            } else {
                wv.loadUrl("chrome://crash")
            }
        }
        assertTrue("onRenderProcessGone expected", h.waitUntil(20_000) { h.events.renderGone != null })
        h.destroyWebView()
        // A fresh WebView still works afterwards.
        h.load(h.importFixture("webview/storage"))
        assertNotNull(h.results())
    }

    /** Dialog loops are cancelled natively and never block the UI. */
    @Test
    fun dialogLoopIsRefused() {
        val s = h.importFixture("webview/alerts")
        h.load(s)
        val r = h.results()
        assertEquals(0, r.getInt("confirmed"))
        assertTrue(h.events.messages.any { it.startsWith("js-alert") })
    }
}
