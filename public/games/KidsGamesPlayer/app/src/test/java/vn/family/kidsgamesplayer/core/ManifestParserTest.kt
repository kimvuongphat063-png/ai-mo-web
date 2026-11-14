package vn.family.kidsgamesplayer.core

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/** U01: valid/invalid manifests, unsupported versions, inventory schema, reserved ids. */
class ManifestParserTest {
    private val sha = "a".repeat(64)

    private fun parse(json: String, builtin: Boolean = false) = ManifestParser.parse(json.toByteArray(), builtin)
    private fun code(json: String, builtin: Boolean = false) = (parse(json, builtin) as? ManifestResult.Error)?.code
    private fun ok(json: String) = (parse(json) as ManifestResult.Ok).manifest

    @Test
    fun parsesFullManifest() {
        val m = ok(
            """{"schemaVersion":1,"id":"family.balloon-pop","title":"Chạm bong bóng","version":"1.0.0","entry":"index.html",
               "icon":"icon.png","orientation":"landscape","playerApiVersion":1,"backgroundColor":"#fff7e8","sortOrder":10,
               "files":[{"path":"index.html","size":10,"sha256":"$sha"},{"path":"assets/pop.ogg","size":0,"sha256":"$sha"}]}""",
        )
        assertEquals("family.balloon-pop", m.id)
        assertEquals("Chạm bong bóng", m.title)
        assertEquals("#FFF7E8", m.backgroundColor)
        assertEquals(10, m.sortOrder)
        assertEquals(1, m.playerApiVersion)
        assertTrue(m.isVerified)
        assertEquals(2, m.files!!.size)
    }

    @Test
    fun emptyOrMissingFilesMeansBasic() {
        assertNull(ok("""{"schemaVersion":1,"files":[]}""").files)
        assertNull(ok("""{"schemaVersion":1}""").files)
        assertNull(ok("""{"schemaVersion":1,"files":null}""").files)
    }

    @Test
    fun rejectsBadDocuments() {
        assertEquals(ErrorCodes.MANIFEST_INVALID_JSON, code("{not json"))
        assertEquals(ErrorCodes.MANIFEST_INVALID_JSON, code("[1,2]"))
        assertEquals(ErrorCodes.MANIFEST_UNSUPPORTED_SCHEMA, code("""{"schemaVersion":2}"""))
        assertEquals(ErrorCodes.MANIFEST_INVALID_FIELD, code("""{"schemaVersion":"1"}"""))
        assertEquals(ErrorCodes.MANIFEST_BAD_ID, code("""{"schemaVersion":1,"id":"Bad ID"}"""))
        assertEquals(ErrorCodes.MANIFEST_BAD_ID, code("""{"schemaVersion":1,"id":"ab"}"""))
        assertEquals(ErrorCodes.MANIFEST_RESERVED_ID, code("""{"schemaVersion":1,"id":"builtin.x-game"}"""))
        assertEquals(null, code("""{"schemaVersion":1,"id":"builtin.x-game"}""", builtin = true))
        assertEquals(ErrorCodes.MANIFEST_BAD_ENTRY, code("""{"schemaVersion":1,"entry":"main.html"}"""))
        assertEquals(ErrorCodes.MANIFEST_BAD_PATH, code("""{"schemaVersion":1,"icon":"../icon.png"}"""))
        assertEquals(ErrorCodes.MANIFEST_UNSUPPORTED_PLAYER_API, code("""{"schemaVersion":1,"playerApiVersion":2}"""))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code("""{"schemaVersion":1,"files":"x"}"""))
    }

    @Test
    fun rejectsBadInventory() {
        fun files(vararg entries: String) = """{"schemaVersion":1,"files":[${entries.joinToString(",")}]}"""
        val index = """{"path":"index.html","size":1,"sha256":"$sha"}"""
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files("""{"path":"a.js","size":1,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"../a.js","size":1,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"a.js","size":-1,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"a.js","size":1.5,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"a.js","size":1,"sha256":"XYZ"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"game.json","size":1,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"A.js","size":1,"sha256":"$sha"}""", """{"path":"a.js","size":1,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, """{"path":"run.exe","size":1,"sha256":"$sha"}""")))
        assertEquals(ErrorCodes.MANIFEST_BAD_FILES, code(files(index, "5")))
    }

    @Test
    fun lenientFieldsBecomeWarnings() {
        val r = parse("""{"schemaVersion":1,"title":"${"x".repeat(80)}","backgroundColor":"red","sortOrder":99999999999,"orientation":"portrait","permissions":["camera"]}""")
        r as ManifestResult.Ok
        assertEquals(60, r.manifest.title!!.length)
        assertNull(r.manifest.backgroundColor)
        assertNull(r.manifest.sortOrder)
        assertTrue(r.warnings.any { it.contains("orientation") })
    }

    @Test
    fun rejectsOversizedManifest() {
        val big = ByteArray((ImportLimits.MIB + 1).toInt()) { ' '.code.toByte() }
        assertEquals(ErrorCodes.MANIFEST_TOO_LARGE, (ManifestParser.parse(big, false) as ManifestResult.Error).code)
    }
}
