package vn.family.kidsgamesplayer.catalog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.core.NioAtomicBytesFile
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/** Catalog persistence: round trip, backup fallback, quarantine of bad records (bible §7.2). */
class CatalogStoreTest {
    private fun record(id: String, token: String = "1".repeat(32)) = GameRecord(
        internalGameId = id, logicalKey = "folder:$id", manifestId = null, sourceDirectoryUri = null,
        folderDisplayName = id, title = "Trò chơi $id", versionLabel = "1", sortOrder = null,
        storageOriginToken = token, activeRevision = "rev", previousRevision = null,
        validationLevel = ValidationLevel.VERIFIED, sourceState = SourceState.AVAILABLE, hidden = true,
        lastPlayedAt = 5, lastImportAt = 6, lastErrorCode = null, lastErrorDetail = null, playerApiVersion = 1,
        importedByteCount = 10, backgroundColor = "#FFFFFF", builtin = false, iconPath = "icon.png", manifestSha256 = null,
    )

    @Test
    fun roundTripPreservesIdentityFields() {
        val dir = tempDir()
        val store = CatalogStore(dir, NioAtomicBytesFile.FACTORY)
        val c = Catalog(selectedSourceUri = "content://tree/x", games = listOf(record("a"), record("b", "2".repeat(32))))
        store.write(c)
        val loaded = (store.load() as CatalogStore.LoadResult.Loaded).catalog
        assertEquals(c.games, loaded.games)
        assertEquals(c.selectedSourceUri, loaded.selectedSourceUri)
        dir.deleteRecursively()
    }

    @Test
    fun corruptMainFileFallsBackToPreviousGoodCopy() {
        val dir = tempDir()
        val store = CatalogStore(dir, NioAtomicBytesFile.FACTORY)
        store.write(Catalog(games = listOf(record("a"))))
        store.write(Catalog(games = listOf(record("a"), record("b"))))
        File(dir, "catalog.json").writeText("{ truncated")
        val r = store.load() as CatalogStore.LoadResult.Loaded
        assertTrue(r.fromBackup)
        assertEquals(listOf("a"), r.catalog.games.map { it.internalGameId })
        dir.deleteRecursively()
    }

    @Test
    fun badRecordIsQuarantinedNotFatal() {
        val dir = tempDir()
        val text = CatalogCodec.encode(Catalog(games = listOf(record("good"))))
            .replace("\"games\": [", "\"games\": [{\"internalGameId\":\"bad\"},")
        File(dir, "catalog.json").writeText(text)
        val r = CatalogStore(dir, NioAtomicBytesFile.FACTORY).load() as CatalogStore.LoadResult.Loaded
        assertEquals(listOf("good"), r.catalog.games.map { it.internalGameId })
        assertEquals(1, r.quarantined)
        assertEquals(1, r.catalog.quarantine.size)
        dir.deleteRecursively()
    }

    @Test
    fun unreadableWhenNothingUsable() {
        val dir = tempDir()
        File(dir, "catalog.json").writeText("garbage")
        assertTrue(CatalogStore(dir, NioAtomicBytesFile.FACTORY).load() is CatalogStore.LoadResult.Unreadable)
        assertTrue(CatalogStore(tempDir(), NioAtomicBytesFile.FACTORY).load() is CatalogStore.LoadResult.Missing)
        dir.deleteRecursively()
    }
}
