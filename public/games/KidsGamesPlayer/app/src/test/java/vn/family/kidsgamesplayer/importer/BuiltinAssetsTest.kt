package vn.family.kidsgamesplayer.importer

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.source.FileSourceRoot
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/**
 * The demo games bundled in the APK must be complete verified packages with builtin.* ids,
 * imported through the same importer as external games (bible §17.1).
 */
class BuiltinAssetsTest {
    @Test
    fun bundledDemosAreVerifiedPackages() {
        val builtin = File("src/main/assets/builtin")
        assertTrue("run tools/sync_games.py", builtin.isDirectory)
        val base = tempDir()
        val revisions = RevisionStore(AppPaths(File(base, "files")))
        val importer = GameImporter(revisions, IconInspector { 256 to 256 }, settleDelayMs = 0, sleeper = {})
        val folders = FileSourceRoot(builtin, isBuiltin = true).listGameFolders()
        assertEquals(setOf("BongBong", "GhepMau", "LatThe"), folders.map { it.name }.toSet())
        for (folder in folders) {
            val c = (importer.prepare(folder, allowBuiltinNamespace = true) as GameImporter.Prepared.Ok).candidate
            assertTrue(c.manifest.id!!.startsWith("builtin."))
            assertEquals(ValidationLevel.VERIFIED, c.validationLevel)
            assertEquals(1, c.manifest.playerApiVersion)
            val out = importer.import(c, folder.name, null)
            assertTrue("${folder.name}: $out", out is GameImporter.Outcome.Imported)
            assertEquals("icon.png", (out as GameImporter.Outcome.Imported).meta.iconPath)
        }
        base.deleteRecursively()
    }

    @Test
    fun sdkCopiesAreIdentical() {
        val reference = File("../games-template/MauGame/player-sdk.js").readBytes()
        listOf("BongBong", "GhepMau", "LatThe").forEach {
            assertTrue("$it player-sdk.js", File("../sample-games/$it/player-sdk.js").readBytes().contentEquals(reference))
            assertTrue("builtin $it player-sdk.js", File("src/main/assets/builtin/$it/player-sdk.js").readBytes().contentEquals(reference))
        }
    }
}
