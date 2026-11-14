package vn.family.kidsgamesplayer.importer

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import vn.family.kidsgamesplayer.core.NioAtomicBytesFile
import vn.family.kidsgamesplayer.GameFolderBuilder
import vn.family.kidsgamesplayer.catalog.CatalogOps
import vn.family.kidsgamesplayer.catalog.CatalogRepository
import vn.family.kidsgamesplayer.catalog.CatalogStore
import vn.family.kidsgamesplayer.catalog.SourceState
import vn.family.kidsgamesplayer.core.Diagnostics
import vn.family.kidsgamesplayer.core.ErrorCodes
import vn.family.kidsgamesplayer.source.FileSourceRoot
import vn.family.kidsgamesplayer.source.SourceAccessException
import vn.family.kidsgamesplayer.source.SourceNode
import vn.family.kidsgamesplayer.source.SourceRoot
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/** U07, U08, U10, U11, U12 and discovery/missing-source behaviour (bible §6.2–6.5, §7). */
class ScanCoordinatorTest {
    private lateinit var base: File
    private lateinit var sourceDir: File
    private lateinit var builtinDir: File
    private lateinit var repo: CatalogRepository
    private lateinit var revisions: RevisionStore
    private lateinit var scanner: ScanCoordinator
    private var grant = true
    private var brokenRoot = false
    private var now = 1_000_000L

    @Before
    fun setUp() = runBlocking {
        base = tempDir()
        sourceDir = File(base, "KidsGames").apply { mkdirs() }
        builtinDir = File(base, "builtin").apply { mkdirs() }
        repo = CatalogRepository(CatalogStore(File(base, "files/catalog"), NioAtomicBytesFile.FACTORY))
        repo.load()
        revisions = RevisionStore(AppPaths(File(base, "files")))
        scanner = newScanner()
        repo.update { it.copy(selectedSourceUri = sourceDir.path) to Unit }
    }

    private fun newScanner() = ScanCoordinator(
        scope = CoroutineScope(SupervisorJob() + Dispatchers.Unconfined),
        io = Dispatchers.Unconfined,
        repo = repo,
        importer = GameImporter(revisions, IconInspector { 1 to 1 }, settleDelayMs = 0, sleeper = {}),
        revisions = revisions,
        builtinRoot = FileSourceRoot(builtinDir, isBuiltin = true),
        sourceRootFactory = { uri -> if (brokenRoot) BrokenRoot() else FileSourceRoot(File(uri)) },
        hasGrant = { grant },
        diagnostics = Diagnostics(null),
        clock = { now },
    )

    @After
    fun tearDown() {
        base.deleteRecursively()
    }

    private fun scan(kind: ScanKind = ScanKind.FULL) = runBlocking { scanner.runNow(kind) }
    private fun game(key: String) = repo.current.byLogicalKey(key)

    @Test
    fun newFolderAppearsWithoutRebuildingAnything() {
        scan()
        assertTrue(repo.current.games.isEmpty())
        GameFolderBuilder.simpleGame(File(sourceDir, "BongBong"))
        scan(ScanKind.SHALLOW)
        val g = game("folder:BongBong")
        assertNotNull(g)
        assertTrue(g!!.playable)
        assertEquals(SourceState.AVAILABLE, g.sourceState)
    }

    /** U10: version update keeps internalGameId and origin token; keeps a previous revision. */
    @Test
    fun updateKeepsIdentityAndOrigin() {
        val dir = File(sourceDir, "Balloon")
        GameFolderBuilder.simpleGame(dir).manifest("family.balloon", version = "1.0.0", inventory = true)
        scan()
        val v1 = game("manifest:family.balloon")!!
        File(dir, "game.js").writeText("console.log('v2')")
        GameFolderBuilder(dir).manifest("family.balloon", version = "1.1.0", inventory = true)
        scan(ScanKind.SHALLOW)
        val v2 = game("manifest:family.balloon")!!
        assertEquals(v1.internalGameId, v2.internalGameId)
        assertEquals(v1.storageOriginToken, v2.storageOriginToken)
        assertNotEquals(v1.activeRevision, v2.activeRevision)
        assertEquals(v1.activeRevision, v2.previousRevision)
        assertEquals("1.1.0", v2.versionLabel)
    }

    /** Renaming the folder of a game with a manifest id keeps the same identity and save. */
    @Test
    fun manifestIdSurvivesFolderRenameAndRootChange() {
        GameFolderBuilder.simpleGame(File(sourceDir, "Old")).manifest("family.keep", inventory = true)
        scan()
        val before = game("manifest:family.keep")!!
        File(sourceDir, "Old").renameTo(File(sourceDir, "New"))
        scan()
        val after = game("manifest:family.keep")!!
        assertEquals(before.internalGameId, after.internalGameId)
        assertEquals(before.storageOriginToken, after.storageOriginToken)
        assertEquals("New", after.folderDisplayName)
    }

    /** I04/U05: a partially copied verified update keeps the old revision active. */
    @Test
    fun partialUpdateKeepsOldRevision() {
        val dir = File(sourceDir, "Memory")
        GameFolderBuilder.simpleGame(dir).manifest("family.memory", inventory = true)
        scan()
        val good = game("manifest:family.memory")!!
        File(dir, "assets/new.ogg").apply { parentFile.mkdirs(); writeText("OggS-new") }
        GameFolderBuilder(dir).manifest("family.memory", version = "2.0.0", inventory = true)
        File(dir, "assets/new.ogg").delete() // copy not finished yet
        scan(ScanKind.SHALLOW)
        val held = game("manifest:family.memory")!!
        assertEquals(good.activeRevision, held.activeRevision)
        assertEquals(ErrorCodes.INCOMPLETE_PACKAGE, held.lastErrorCode)
        assertEquals(1, repo.current.issues.size)
        // Copy completes later; the retry is deferred by backoff, then applied.
        File(dir, "assets/new.ogg").writeText("OggS-new")
        scan(ScanKind.SHALLOW)
        assertEquals(good.activeRevision, game("manifest:family.memory")!!.activeRevision)
        now += ScanCoordinator.backoffMs(1) + 1
        scan(ScanKind.SHALLOW)
        val updated = game("manifest:family.memory")!!
        assertNotEquals(good.activeRevision, updated.activeRevision)
        assertNull(updated.lastErrorCode)
        assertTrue(repo.current.issues.isEmpty())
    }

    /** U07: two folders with the same manifest id are not merged and nothing is overwritten. */
    @Test
    fun duplicateManifestIdsAreReportedNotMerged() {
        GameFolderBuilder.simpleGame(File(sourceDir, "A")).manifest("family.same", title = "A", inventory = true)
        scan()
        val original = game("manifest:family.same")!!
        GameFolderBuilder.simpleGame(File(sourceDir, "B"), "<!doctype html><p>B</p>").manifest("family.same", title = "B", inventory = true)
        scan()
        val after = game("manifest:family.same")!!
        assertEquals(original.activeRevision, after.activeRevision)
        assertEquals(original.title, after.title)
        assertEquals(ErrorCodes.DUPLICATE_ID, after.lastErrorCode)
        assertEquals(2, repo.current.issues.count { it.code == ErrorCodes.DUPLICATE_ID })
        assertEquals(1, repo.current.games.size)
    }

    /** U12: losing the source never deletes snapshots or saves. */
    @Test
    fun lostSourceKeepsSnapshots() {
        GameFolderBuilder.simpleGame(File(sourceDir, "Keep"))
        scan()
        val g = game("folder:Keep")!!
        grant = false
        scan()
        assertEquals(SourceState.PERMISSION_LOST, game("folder:Keep")!!.sourceState)
        assertTrue(revisions.isComplete(g.internalGameId, g.activeRevision!!))
        grant = true
        brokenRoot = true
        scan()
        assertEquals(SourceState.PROVIDER_ERROR, game("folder:Keep")!!.sourceState)
        brokenRoot = false
        File(sourceDir, "Keep").deleteRecursively()
        scan()
        val missing = game("folder:Keep")!!
        assertEquals(SourceState.MISSING, missing.sourceState)
        assertTrue(missing.playable)
        assertEquals(g.storageOriginToken, missing.storageOriginToken)
        assertTrue(revisions.isComplete(g.internalGameId, g.activeRevision!!))
    }

    /** U08: concurrent scan requests are serialized; one identity per logicalKey, catalog intact. */
    @Test
    fun concurrentScansDoNotRace() = runBlocking {
        (1..5).forEach { GameFolderBuilder.simpleGame(File(sourceDir, "G$it")) }
        val results = (1..6).map { i ->
            async(Dispatchers.Default) { scanner.runNow(if (i % 2 == 0) ScanKind.FULL else ScanKind.SHALLOW) }
        }.awaitAll()
        assertEquals(5, repo.current.games.size)
        assertEquals(5, repo.current.games.map { it.logicalKey }.toSet().size)
        assertTrue(results.sumOf { it.imported } == 5)
        // The persisted catalog matches memory.
        val reloaded = CatalogRepository(CatalogStore(File(base, "files/catalog"), NioAtomicBytesFile.FACTORY))
        reloaded.load()
        assertEquals(repo.current.games.map { it.internalGameId }.toSet(), reloaded.current.games.map { it.internalGameId }.toSet())
    }

    /** U11: resetting one game rotates only its token. */
    @Test
    fun resetProgressRotatesOnlyThatToken() = runBlocking {
        GameFolderBuilder.simpleGame(File(sourceDir, "One"))
        GameFolderBuilder.simpleGame(File(sourceDir, "Two"))
        scan()
        val one = game("folder:One")!!
        val two = game("folder:Two")!!
        val newToken = "f".repeat(32)
        repo.update { CatalogOps.resetProgress(it, one.internalGameId, newToken) }
        assertEquals(newToken, game("folder:One")!!.storageOriginToken)
        assertEquals(one.activeRevision, game("folder:One")!!.activeRevision)
        assertEquals(two.storageOriginToken, game("folder:Two")!!.storageOriginToken)
        assertEquals(listOf(one.storageOriginToken), repo.current.pendingOriginCleanups)
        // Hiding is a flag only.
        repo.update { CatalogOps.setHidden(it, two.internalGameId, true) }
        assertTrue(game("folder:Two")!!.hidden)
        assertTrue(revisions.isComplete(two.internalGameId, two.activeRevision!!))
    }

    @Test
    fun builtinNamespaceIsReservedForTheApk() {
        GameFolderBuilder.simpleGame(File(builtinDir, "Demo")).manifest("builtin.demo", inventory = true)
        GameFolderBuilder.simpleGame(File(sourceDir, "Fake")).manifest("builtin.fake", inventory = true)
        scan()
        assertEquals(SourceState.BUILTIN, game("manifest:builtin.demo")!!.sourceState)
        assertTrue(game("manifest:builtin.demo")!!.builtin)
        assertNull(game("manifest:builtin.fake"))
        assertEquals(ErrorCodes.MANIFEST_RESERVED_ID, repo.current.issues.single().code)
    }

    /** U09: a missing active revision falls back to the previous one at startup. */
    @Test
    fun startupFallsBackToPreviousRevision() = runBlocking {
        val dir = File(sourceDir, "Fall")
        GameFolderBuilder.simpleGame(dir).manifest("family.fall", inventory = true)
        scan()
        File(dir, "game.js").writeText("v2")
        GameFolderBuilder(dir).manifest("family.fall", version = "2", inventory = true)
        scan()
        val g = game("manifest:family.fall")!!
        revisions.revisionDir(g.internalGameId, g.activeRevision!!).deleteRecursively()
        File(revisions.paths.stagingDir, "imp-x/root").mkdirs()
        scanner.verifyOnStart()
        val fixed = game("manifest:family.fall")!!
        assertEquals(g.previousRevision, fixed.activeRevision)
        assertEquals(ErrorCodes.REVISION_MISSING, fixed.lastErrorCode)
        assertTrue(revisions.paths.stagingDir.listFiles().isNullOrEmpty())
    }

    @Test
    fun catalogCanBeRebuiltFromIdentityFiles() {
        GameFolderBuilder.simpleGame(File(sourceDir, "Rebuild")).manifest("family.rebuild", inventory = true)
        scan()
        val g = game("manifest:family.rebuild")!!
        val rebuilt = scanner.rebuildFromDisk()
        val r = rebuilt.byId(g.internalGameId)!!
        assertEquals(g.storageOriginToken, r.storageOriginToken)
        assertEquals(g.activeRevision, r.activeRevision)
    }

    @Test
    fun garbageCollectionKeepsActivePreviousAndLeased() {
        val dir = File(sourceDir, "Gc")
        GameFolderBuilder.simpleGame(dir).manifest("family.gc", inventory = true)
        scan()
        val r1 = game("manifest:family.gc")!!.activeRevision!!
        val id = game("manifest:family.gc")!!.internalGameId
        val lease = revisions.acquireLease(id, r1)
        repeat(3) { i ->
            File(dir, "game.js").writeText("v$i")
            GameFolderBuilder(dir).manifest("family.gc", version = "v$i", inventory = true)
            scan()
        }
        val g = game("manifest:family.gc")!!
        val kept = revisions.listRevisions(id).map { it.revisionHash }.toSet()
        assertTrue(g.activeRevision in kept)
        assertTrue(g.previousRevision in kept)
        assertTrue("leased revision of a live session survives", r1 in kept)
        assertEquals(3, kept.size)
        lease.close()
        scan()
        assertEquals(2, revisions.listRevisions(id).size)
    }

    private class BrokenRoot : SourceRoot {
        override val rootId = "broken"
        override val isBuiltin = false
        override fun listGameFolders(): List<SourceNode> = throw SourceAccessException(ErrorCodes.PROVIDER_ERROR, "provider crashed")
    }
}
