package vn.family.kidsgamesplayer.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/** U02, U03: traversal (plain/encoded/double-encoded), prefix siblings, Unicode, spaces, '+', case. */
class PathPolicyTest {
    private fun ok(p: String) = (PathPolicy.validateRelative(p) as? PathPolicy.Result.Ok)?.path
    private fun rejected(p: String) = PathPolicy.validateRelative(p) is PathPolicy.Result.Rejected
    private fun url(p: String?) = (PathPolicy.decodeUrlPath(p) as? PathPolicy.Result.Ok)?.path

    @Test
    fun acceptsNormalRelativePaths() {
        assertEquals("index.html", ok("index.html"))
        assertEquals("assets/pop.ogg", ok("assets/pop.ogg"))
        assertEquals("ảnh/bé con.png", ok("ảnh/bé con.png"))
        assertEquals("a+b.png", ok("a+b.png"))
    }

    @Test
    fun rejectsTraversalAndAbsolutePaths() {
        listOf(
            "../x", "a/../../x", "./x", "a/./b", "/etc/hosts", "C:/x", "c:x", "a\\b", "\\\\server\\x",
            "a//b", "a/", "", "https://x/y", "file:///x", "a\u0000b", "a\nb", "a/\u202Eb", " a", "a ",
        ).forEach { assertTrue("should reject [$it]", rejected(it)) }
    }

    @Test
    fun normalizesToNfc() {
        val nfd = "a\u0301.png" // a + combining acute
        assertEquals("\u00e1.png", ok(nfd))
    }

    @Test
    fun enforcesDepthLimit() {
        val deep = (1..13).joinToString("/") { "d$it" } + "/f.png"
        assertTrue(rejected(deep))
        val okDepth = (1..12).joinToString("/") { "d$it" } + "/f.png"
        assertEquals(okDepth, ok(okDepth))
    }

    @Test
    fun decodesUrlPathExactlyOnce() {
        assertEquals("index.html", url("/"))
        assertEquals("index.html", url(null))
        assertEquals("assets/pop.ogg", url("/assets/pop.ogg"))
        assertEquals("tải về+plus.json", url("/t%E1%BA%A3i%20v%E1%BB%81%2Bplus.json"))
        assertEquals("a+b.png", url("/a+b.png"))
        // %25 decodes to a literal '%'; it is never decoded again.
        assertEquals("%2e%2e/x", url("/%252e%252e/x"))
    }

    @Test
    fun rejectsEncodedTraversalAndSeparators() {
        listOf(
            "/%2e%2e/%2e%2e/etc/hosts", "/..%2fetc", "/..%2Fetc", "/a%5cb", "/a%00b", "/%2E%2E/x",
            "/assets/", "/bad%zz", "/bad%e", "/%C3%28", "/a//b",
        ).forEach { assertNull("should reject [$it]", url(it)) }
    }

    @Test
    fun collisionKeyIsCaseAndNormalizationInsensitive() {
        assertEquals(PathPolicy.collisionKey("Icon.PNG"), PathPolicy.collisionKey("icon.png"))
        assertEquals(PathPolicy.collisionKey("a\u0301.png"), PathPolicy.collisionKey("\u00e1.png"))
    }

    @Test
    fun containmentUsesPathRelationNotStringPrefix() {
        val base = tempDir()
        val root = File(base, "root").apply { mkdirs() }
        File(base, "root-sibling").mkdirs()
        File(root, "a").mkdirs()
        assertEquals(File(root, "a/b.png").canonicalFile, PathPolicy.resolveContained(root, "a/b.png"))
        assertNull(PathPolicy.resolveContained(root, "../root-sibling/x"))
        assertNull(PathPolicy.resolveContained(root, "../root"))
        base.deleteRecursively()
    }
}
