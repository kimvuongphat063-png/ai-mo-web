package vn.family.kidsgamesplayer.player

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.core.InventoryEntry
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/** U14 (range math, stream closure) and router policy (I13/I19 logic level). */
class RouterAndRangeTest {
    private val token = "0123456789abcdef0123456789abcdef"
    private val router = RequestRouter()
    private val session = GameSession(
        generation = 1, internalGameId = "g", title = "t", revisionHash = "r", root = File("."),
        storageOriginToken = token,
        files = mapOf(
            "index.html" to InventoryEntry("index.html", 10, "a".repeat(64)),
            "assets/pop.ogg" to InventoryEntry("assets/pop.ogg", 100, "b".repeat(64)),
            "tải về.json" to InventoryEntry("tải về.json", 5, "c".repeat(64)),
            // A game file inside the reserved host directory: shadowed, never served.
            "__kgp__/speech-v1.js" to InventoryEntry("__kgp__/speech-v1.js", 5, "d".repeat(64)),
            "__kgp__/page.html" to InventoryEntry("__kgp__/page.html", 5, "e".repeat(64)),
        ),
        sdkGame = true,
    )
    private val origin = "https://g-$token.invalid"

    private fun decide(url: String, method: String = "GET", range: String? = null, main: Boolean = false) =
        router.decide(session, url, method, range, main)

    @Test
    fun rangeParsing() {
        assertEquals(RangeDecision.Full, ByteRange.parse(null, 100))
        assertEquals(RangeDecision.Partial(0, 9), ByteRange.parse("bytes=0-9", 100))
        assertEquals(RangeDecision.Partial(90, 99), ByteRange.parse("bytes=90-", 100))
        assertEquals(RangeDecision.Partial(95, 99), ByteRange.parse("bytes=-5", 100))
        assertEquals(RangeDecision.Partial(0, 99), ByteRange.parse("bytes=-500", 100))
        assertEquals(RangeDecision.Partial(50, 99), ByteRange.parse("bytes=50-1000", 100))
        assertEquals(RangeDecision.Unsatisfiable, ByteRange.parse("bytes=100-", 100))
        assertEquals(RangeDecision.Unsatisfiable, ByteRange.parse("bytes=-0", 100))
        assertEquals(RangeDecision.Unsatisfiable, ByteRange.parse("bytes=0-", 0))
        assertEquals(RangeDecision.Full, ByteRange.parse("bytes=0-1,5-6", 100))
        assertEquals(RangeDecision.Full, ByteRange.parse("bytes=9-1", 100))
        assertEquals(RangeDecision.Full, ByteRange.parse("items=0-1", 100))
        assertEquals(RangeDecision.Full, ByteRange.parse("bytes=x-y", 100))
    }

    @Test
    fun rangeStreamMatchesWebViewSkipSemantics() {
        val dir = tempDir()
        val f = File(dir, "f.txt").apply { writeText("0123456789".repeat(10)) }
        // WebView reads available() as the total size, skips to the first byte and reads to EOF.
        RangeEndLimitedStream(f, 20).use { s ->
            assertEquals(100, s.available())
            var skipped = 0L
            while (skipped < 10) skipped += s.skip(10 - skipped)
            assertEquals("0123456789", s.readBytes().toString(Charsets.UTF_8))
        }
        RangeEndLimitedStream(f, 100).use { s ->
            s.skip(95)
            assertEquals("56789", s.readBytes().toString(Charsets.UTF_8))
        }
        dir.deleteRecursively()
    }

    @Test
    fun servesOnlyAllowlistedFilesOfTheExactOrigin() {
        assertTrue(decide("$origin/index.html") is RequestRouter.Decision.Serve)
        assertTrue(decide("$origin/") is RequestRouter.Decision.Serve)
        assertTrue(decide("$origin:443/index.html") is RequestRouter.Decision.Serve)
        assertTrue(decide("$origin/t%E1%BA%A3i%20v%E1%BB%81.json?x=1#y") is RequestRouter.Decision.Serve)
        val head = decide("$origin/assets/pop.ogg", "HEAD") as RequestRouter.Decision.Serve
        assertTrue(head.head)
        val partial = decide("$origin/assets/pop.ogg", range = "bytes=10-19") as RequestRouter.Decision.Serve
        assertEquals(RangeDecision.Partial(10, 19), partial.range)
    }

    @Test
    fun rejectsEverythingElse() {
        fun status(url: String, method: String = "GET", main: Boolean = false) =
            (decide(url, method, main = main) as RequestRouter.Decision.Reject).status
        assertEquals(404, status("$origin/missing.png"))
        assertEquals(400, status("$origin/..%2fsecret"))
        assertEquals(400, status("$origin/%2e%2e/%2e%2e/etc/hosts"))
        assertEquals(405, status("$origin/index.html", "POST"))
        assertEquals(403, status("https://g-${"f".repeat(32)}.invalid/index.html"))
        assertEquals(403, status("https://g-$token.invalid.evil.com/index.html"))
        assertEquals(403, status("https://user@g-$token.invalid/index.html"))
        assertEquals(403, status("https://g-$token.invalid:8443/index.html"))
        assertEquals(403, status("http://g-$token.invalid/index.html"))
        assertEquals(403, status("https://example.com/x.js"))
        assertEquals(403, status("file:///sdcard/x.html"))
        assertEquals(403, status("content://x/y"))
        assertEquals(403, status("intent://x#Intent;end"))
        assertEquals(403, status("data:image/png;base64,AAAA", main = true))
        assertEquals(403, status("data:text/html,<b>x</b>"))
        assertEquals(403, status("data:application/javascript,alert(1)"))
        assertEquals(403, status("data:,hello"))
        val kind = (decide("https://g-${"f".repeat(32)}.invalid/x") as RequestRouter.Decision.Reject).kind
        assertEquals(RequestRouter.BlockKind.OTHER_GAME, kind)
    }

    @Test
    fun reservedHostDirectoryServesOnlyTheSpeechShim() {
        assertEquals(RequestRouter.Decision.HostAsset(HostAssets.SPEECH_PATH, head = false), decide("$origin/__kgp__/speech-v1.js"))
        assertEquals(RequestRouter.Decision.HostAsset(HostAssets.SPEECH_PATH, head = true), decide("$origin/__kgp__/speech-v1.js?v=1", "HEAD"))
        // Same rules as game files: method, origin, path checks come first.
        assertEquals(405, (decide("$origin/__kgp__/speech-v1.js", "POST") as RequestRouter.Decision.Reject).status)
        assertEquals(403, (decide("https://g-${"f".repeat(32)}.invalid/__kgp__/speech-v1.js") as RequestRouter.Decision.Reject).status)
        // Anything else under /__kgp__/ is a 404, even if the game ships such a file.
        val other = decide("$origin/__kgp__/page.html") as RequestRouter.Decision.Reject
        assertEquals(404, other.status)
        assertEquals(404, (decide("$origin/__kgp__/other.js") as RequestRouter.Decision.Reject).status)
        assertEquals(400, (decide("$origin/__kgp__/") as RequestRouter.Decision.Reject).status)
        assertTrue(!router.allowsNavigation(session, "$origin/__kgp__/page.html", true))
        assertTrue(!router.allowsNavigation(session, "$origin/__kgp__/speech-v1.js", true))
    }

    @Test
    fun embeddedMediaDataUrisPassThrough() {
        assertEquals(RequestRouter.Decision.PassThroughDataUri, decide("data:image/png;base64,AAAA"))
        assertEquals(RequestRouter.Decision.PassThroughDataUri, decide("data:audio/ogg;base64,AAAA"))
        assertEquals(RequestRouter.Decision.PassThroughDataUri, decide("data:font/woff2;base64,AAAA"))
        val tooBig = "data:image/png;base64," + "A".repeat(9 * 1024 * 1024)
        assertTrue(decide(tooBig) is RequestRouter.Decision.Reject)
    }

    @Test
    fun navigationAllowsOnlySameOriginHtmlPages() {
        assertTrue(router.allowsNavigation(session, "$origin/index.html", true))
        assertTrue(!router.allowsNavigation(session, "$origin/index.html", false))
        assertTrue(!router.allowsNavigation(session, "$origin/assets/pop.ogg", true))
        assertTrue(!router.allowsNavigation(session, "https://example.com/", true))
        assertTrue(!router.allowsNavigation(session, "data:text/html,x", true))
        assertTrue(!router.allowsNavigation(session, "javascript:alert(1)", true))
    }

    @Test
    fun hostStateJsonIsFixedShape() {
        val s = HostState(3, active = false, muted = true, reason = HostReason.BACKGROUND, requestSave = true)
        val o = org.json.JSONObject(s.toJson())
        assertEquals(setOf("apiVersion", "seq", "active", "muted", "reason", "requestSave"), o.keys().asSequence().toSet())
        assertEquals("background", o.getString("reason"))
        assertTrue(s.script().startsWith("(function(s){try{var g=window.KidsPlayerGame;"))
    }

    @Test
    fun audioPolicy() {
        assertTrue(AudioPolicy.shouldBeAudible(true, true, true, true, true))
        assertTrue(!AudioPolicy.shouldBeAudible(false, true, true, true, true))
        assertTrue(!AudioPolicy.shouldBeAudible(true, true, true, false, true))
        assertTrue(!AudioPolicy.shouldBeAudible(true, true, true, true, false))
        assertTrue(AudioPolicy.mustBlockLaunch(muteSupported = false, sdkGame = false, userSoundEnabled = false))
        assertTrue(!AudioPolicy.mustBlockLaunch(muteSupported = false, sdkGame = true, userSoundEnabled = false))
        assertTrue(!AudioPolicy.mustBlockLaunch(muteSupported = true, sdkGame = false, userSoundEnabled = false))
    }
}
