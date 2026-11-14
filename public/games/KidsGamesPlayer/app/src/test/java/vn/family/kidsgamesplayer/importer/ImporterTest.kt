package vn.family.kidsgamesplayer.importer

import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import vn.family.kidsgamesplayer.GameFolderBuilder
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.core.ErrorCodes
import vn.family.kidsgamesplayer.core.ImportLimits
import vn.family.kidsgamesplayer.source.FileSourceNode
import vn.family.kidsgamesplayer.source.SourceNode
import vn.family.kidsgamesplayer.tempDir
import java.io.File
import java.io.InputStream

/** U04, U05, U06, U09 and verified/basic classification (bible §5.2, §6.3–6.4). */
class ImporterTest {
    private lateinit var base: File
    private lateinit var revisions: RevisionStore
    private lateinit var importer: GameImporter

    @Before
    fun setUp() {
        base = tempDir()
        revisions = RevisionStore(AppPaths(File(base, "files")))
        importer = GameImporter(revisions, IconInspector { 1 to 1 }, settleDelayMs = 0, sleeper = {})
    }

    @After
    fun tearDown() {
        base.deleteRecursively()
    }

    private fun candidate(dir: File, builtin: Boolean = false): GameImporter.Candidate =
        (importer.prepare(FileSourceNode(dir), builtin) as GameImporter.Prepared.Ok).candidate

    @Test
    fun basicFolderWithoutManifestImports() {
        val dir = File(base, "src/BongBong")
        GameFolderBuilder.simpleGame(dir).file("README.md", "dev notes").file(".DS_Store", "x")
        val c = candidate(dir)
        assertEquals("folder:BongBong", c.logicalKey)
        assertEquals(ValidationLevel.BASIC, c.validationLevel)
        val out = importer.import(c, "g1", null) as GameImporter.Outcome.Imported
        val paths = out.meta.files.map { it.path }
        assertEquals(listOf("game.js", "icon.png", "index.html"), paths)
        assertEquals("icon.png", out.meta.iconPath)
        assertTrue(revisions.isComplete("g1", out.meta.revisionHash))
        assertTrue(File(revisions.revisionRoot("g1", out.meta.revisionHash), "index.html").isFile)
        assertTrue("staging cleaned", revisions.paths.stagingDir.listFiles().isNullOrEmpty())
    }

    @Test
    fun verifiedPackageCopiesOnlyInventoryFiles() {
        val dir = File(base, "src/Verified")
        GameFolderBuilder.simpleGame(dir).file("assets/pop.ogg", "OggS").manifest("family.verified", inventory = true)
        File(dir, "extra-not-listed.js").writeText("alert(1)")
        val c = candidate(dir)
        assertEquals("manifest:family.verified", c.logicalKey)
        assertEquals(ValidationLevel.VERIFIED, c.validationLevel)
        val out = importer.import(c, "g2", null) as GameImporter.Outcome.Imported
        assertFalse(out.meta.files.any { it.path == "extra-not-listed.js" })
        assertFalse(File(revisions.revisionRoot("g2", out.meta.revisionHash), "extra-not-listed.js").exists())
        assertTrue(File(revisions.revisionDir("g2", out.meta.revisionHash), "game.json").isFile)
    }

    /** U05: missing inventory file or hash mismatch never commits; staging is discarded. */
    @Test
    fun incompleteVerifiedPackageIsNotCommitted() {
        val dir = File(base, "src/Partial")
        GameFolderBuilder.simpleGame(dir).file("assets/big.ogg", "OggS-data").manifest("family.partial", inventory = true)
        File(dir, "assets/big.ogg").delete()
        val missing = importer.import(candidate(dir), "g3", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.INCOMPLETE_PACKAGE, missing.code)
        assertTrue(missing.retryable)
        File(dir, "assets/big.ogg").writeText("OggS-dat4") // same size, different bytes
        val mismatch = importer.import(candidate(dir), "g3", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.INCOMPLETE_PACKAGE, mismatch.code)
        assertTrue(mismatch.detail.contains("hash mismatch"))
        assertTrue(revisions.listRevisions("g3").isEmpty())
        assertTrue(revisions.paths.stagingDir.listFiles().isNullOrEmpty())
    }

    /** U06: same metadata/version, same size, different bytes => new revision on a full scan. */
    @Test
    fun contentChangeWithSameSizeIsDetected() {
        val dir = File(base, "src/Same")
        GameFolderBuilder.simpleGame(dir).file("data.json", """{"a":1}""")
        val first = importer.import(candidate(dir), "g4", null) as GameImporter.Outcome.Imported
        val unchanged = importer.import(candidate(dir), "g4", first.meta.revisionHash)
        assertTrue(unchanged is GameImporter.Outcome.Unchanged)
        val f = File(dir, "data.json")
        val mtime = f.lastModified()
        f.writeText("""{"a":2}""")
        f.setLastModified(mtime)
        val second = importer.import(candidate(dir), "g4", first.meta.revisionHash) as GameImporter.Outcome.Imported
        assertNotEquals(first.meta.revisionHash, second.meta.revisionHash)
        assertTrue(revisions.isComplete("g4", first.meta.revisionHash))
        assertTrue(revisions.isComplete("g4", second.meta.revisionHash))
    }

    /** U04: quotas are enforced on real bytes, not on provider-declared sizes. */
    @Test
    fun quotasUseRealBytes() {
        val limits = ImportLimits(maxBytesPerFile = 1024, maxBytesPerGame = 4096, maxFilesPerGame = 5, maxDirectoryDepth = 2)
        val small = GameImporter(revisions, IconInspector { 1 to 1 }, limits, settleDelayMs = 0, sleeper = {})
        val dir = File(base, "src/Big")
        GameFolderBuilder.simpleGame(dir).bytes("big.png", ByteArray(2000))
        // A lying provider declares a tiny size.
        val lying = LyingNode(FileSourceNode(dir))
        val c = (small.prepare(lying, false) as GameImporter.Prepared.Ok).candidate
        val r = small.import(c, "g5", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.QUOTA_FILE_SIZE, r.code)

        val many = File(base, "src/Many")
        GameFolderBuilder.simpleGame(many)
        (1..6).forEach { File(many, "f$it.js").writeText("x") }
        val r2 = small.import((small.prepare(FileSourceNode(many), false) as GameImporter.Prepared.Ok).candidate, "g6", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.QUOTA_FILES, r2.code)

        val deep = File(base, "src/Deep")
        GameFolderBuilder.simpleGame(deep).file("a/b/c/d.js", "x")
        val r3 = small.import((small.prepare(FileSourceNode(deep), false) as GameImporter.Prepared.Ok).candidate, "g7", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.QUOTA_DEPTH, r3.code)
        assertTrue(revisions.paths.stagingDir.listFiles().isNullOrEmpty())
    }

    @Test
    fun missingEntryAndBrokenManifest() {
        val noEntry = File(base, "src/NoEntry")
        GameFolderBuilder(noEntry).file("game.js", "x")
        val r = importer.import(candidate(noEntry), "g8", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.MISSING_ENTRY, r.code)

        val bad = File(base, "src/Bad")
        GameFolderBuilder.simpleGame(bad).file("game.json", "{oops")
        val p = importer.prepare(FileSourceNode(bad), false) as GameImporter.Prepared.Failed
        assertEquals(ErrorCodes.MANIFEST_INVALID_JSON, p.code)
    }

    @Test
    fun caseCollisionInBasicFolderIsRejected() {
        val dir = File(base, "src/Collide")
        GameFolderBuilder.simpleGame(dir)
        // Simulate a provider that lists two names colliding after case folding.
        val node = ExtraChildNode(FileSourceNode(dir), "GAME.js", "y")
        val c = (importer.prepare(node, false) as GameImporter.Prepared.Ok).candidate
        val r = importer.import(c, "g9", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.PATH_COLLISION, r.code)
    }

    @Test
    fun basicImportWaitsForMissingStaticReferences() {
        val dir = File(base, "src/Copying")
        GameFolderBuilder(dir).file("index.html", """<script src="game.js"></script><img src="assets/bg.png">""").file("game.js", "x")
        val r = importer.import(candidate(dir), "g10", null) as GameImporter.Outcome.Failed
        assertEquals(ErrorCodes.INCOMPLETE_PACKAGE, r.code)
        val forced = importer.import(candidate(dir), "g10", null, allowMissingReferences = true)
        assertTrue(forced is GameImporter.Outcome.Imported)
    }

    @Test
    fun unicodeNamesAreServedByNfcPath() {
        val dir = File(base, "src/Unicode")
        GameFolderBuilder.simpleGame(dir).file("âm thanh/tiếng+vỗ tay.ogg", "OggS")
        val out = importer.import(candidate(dir), "g11", null) as GameImporter.Outcome.Imported
        assertTrue(out.meta.files.any { it.path == "âm thanh/tiếng+vỗ tay.ogg" })
    }

    @Test
    fun brokenIconFallsBackToPlaceholder() {
        val noIcon = GameImporter(revisions, IconInspector { null }, settleDelayMs = 0, sleeper = {})
        val dir = File(base, "src/BadIcon")
        GameFolderBuilder.simpleGame(dir)
        val out = noIcon.import((noIcon.prepare(FileSourceNode(dir), false) as GameImporter.Prepared.Ok).candidate, "g12", null) as GameImporter.Outcome.Imported
        assertNull(out.meta.iconPath)
        val huge = GameImporter(revisions, IconInspector { 5000 to 5000 }, settleDelayMs = 0, sleeper = {})
        val out2 = huge.import((huge.prepare(FileSourceNode(dir), false) as GameImporter.Prepared.Ok).candidate, "g13", null) as GameImporter.Outcome.Imported
        assertNull(out2.meta.iconPath)
    }

    /** U09: leftover staging from a killed import is removed; committed revisions stay intact. */
    @Test
    fun leftoverStagingIsCleaned() {
        val dir = File(base, "src/Ok")
        GameFolderBuilder.simpleGame(dir)
        val out = importer.import(candidate(dir), "g14", null) as GameImporter.Outcome.Imported
        val leftover = revisions.newStagingDir("imp-killed")
        File(leftover, "root/index.html").writeText("half")
        revisions.cleanStaging()
        assertFalse(leftover.exists())
        assertTrue(revisions.isComplete("g14", out.meta.revisionHash))
        // A revision directory without meta.json (killed before commit rename) is not complete.
        File(revisions.revisionDir("g14", "deadbeef"), "root").mkdirs()
        assertFalse(revisions.isComplete("g14", "deadbeef"))
    }

    private class LyingNode(private val inner: SourceNode) : SourceNode by inner {
        override val declaredSize: Long get() = if (inner.isDirectory) -1 else 1
        override fun children(): List<SourceNode> = inner.children().map { LyingNode(it) }
    }

    private class ExtraChildNode(private val inner: SourceNode, private val extraName: String, private val content: String) : SourceNode by inner {
        override fun children(): List<SourceNode> = inner.children() + object : SourceNode {
            override val name = extraName
            override val isDirectory = false
            override val declaredSize = content.length.toLong()
            override val lastModified = 0L
            override val location: String? = null
            override fun children(): List<SourceNode> = emptyList()
            override fun openStream(): InputStream = content.byteInputStream()
        }
    }
}
