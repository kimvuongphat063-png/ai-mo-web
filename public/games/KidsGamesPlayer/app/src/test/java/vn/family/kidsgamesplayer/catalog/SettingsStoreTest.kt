package vn.family.kidsgamesplayer.catalog

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.core.NioAtomicBytesFile
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/** 1.1.0 adds speechEnabled; a 1.0.0 settings file keeps its values and gets speech on. */
class SettingsStoreTest {
    @Test
    fun oneZeroZeroFileUpgradesWithSpeechOn() {
        val dir = tempDir()
        File(dir, "settings.json").writeText("""{"soundEnabled":false,"reverseLandscape":true,"setupDismissed":true}""")
        val s = SettingsStore(dir, NioAtomicBytesFile.FACTORY).state.value
        assertEquals(AppSettings(soundEnabled = false, reverseLandscape = true, setupDismissed = true, speechEnabled = true), s)
        dir.deleteRecursively()
    }

    @Test
    fun speechSwitchIsPersisted() {
        val dir = tempDir()
        val store = SettingsStore(dir, NioAtomicBytesFile.FACTORY)
        assertTrue(store.state.value.speechEnabled)
        store.update { it.copy(speechEnabled = false) }
        assertFalse(SettingsStore(dir, NioAtomicBytesFile.FACTORY).state.value.speechEnabled)
        assertTrue(SettingsStore(dir, NioAtomicBytesFile.FACTORY).state.value.soundEnabled)
        dir.deleteRecursively()
    }
}
