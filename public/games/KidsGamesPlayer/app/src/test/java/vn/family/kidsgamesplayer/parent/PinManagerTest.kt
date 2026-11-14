package vn.family.kidsgamesplayer.parent

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import vn.family.kidsgamesplayer.core.NioAtomicBytesFile
import vn.family.kidsgamesplayer.tempDir
import java.io.File

/** U13: PIN hashing, throttling across restarts, session timeout. */
class PinManagerTest {
    private var clock = 10_000L
    private fun manager(file: File) = PinManager(file, { clock }, iterations = 1_000, factory = NioAtomicBytesFile.FACTORY)

    @Test
    fun storesSaltedHashOnly() {
        val dir = tempDir()
        val f = File(dir, "pin.json")
        val m = manager(f)
        assertFalse(m.isPinSet())
        m.setPin("482916")
        assertTrue(m.isPinSet())
        val text = f.readText()
        assertFalse(text.contains("482916"))
        assertTrue(text.contains("PBKDF2WithHmacSHA256"))
        assertEquals(PinManager.VerifyResult.Ok, m.verify("482916"))
        assertTrue(m.verify("111112") is PinManager.VerifyResult.Wrong)
        dir.deleteRecursively()
    }

    @Test
    fun rejectsWeakOrMalformedPins() {
        val m = manager(File(tempDir(), "p.json"))
        assertNotNull(m.validateNewPin("12345"))
        assertNotNull(m.validateNewPin("12345a"))
        assertNotNull(m.validateNewPin("000000"))
        assertNotNull(m.validateNewPin("123456"))
        assertNotNull(m.validateNewPin("654321"))
        assertNull(m.validateNewPin("482916"))
    }

    @Test
    fun throttlesAfterFiveFailuresAndSurvivesRestart() {
        val dir = tempDir()
        val f = File(dir, "pin.json")
        manager(f).setPin("482916")
        repeat(4) { assertEquals(0L, (manager(f).verify("000001") as PinManager.VerifyResult.Wrong).lockoutMs) }
        val fifth = manager(f).verify("000001") as PinManager.VerifyResult.Wrong
        assertEquals(30_000L, fifth.lockoutMs)
        // Even the right PIN is refused while locked out, also from a fresh instance (app restart).
        assertTrue(manager(f).verify("482916") is PinManager.VerifyResult.LockedOut)
        clock += 30_001
        val sixth = manager(f).verify("000001") as PinManager.VerifyResult.Wrong
        assertEquals(60_000L, sixth.lockoutMs)
        clock += 60_001
        assertEquals(PinManager.VerifyResult.Ok, manager(f).verify("482916"))
        assertEquals(0L, manager(f).lockoutRemainingMs())
        dir.deleteRecursively()
    }

    @Test
    fun lockoutIsCappedAfterClockReset() {
        val dir = tempDir()
        val f = File(dir, "pin.json")
        clock = 5_000_000L
        manager(f).setPin("482916")
        repeat(5) { manager(f).verify("000001") }
        clock = 1_000L // reboot: monotonic clock restarted
        val left = manager(f).lockoutRemainingMs()
        assertTrue(left in 1..30_000L)
        dir.deleteRecursively()
    }

    @Test
    fun parentSessionExpires() {
        var t = 0L
        val auth = ParentAuth({ t }, idleTimeoutMs = 1_000)
        assertFalse(auth.isValid())
        auth.grant()
        assertTrue(auth.isValid())
        t = 900
        auth.touch()
        t = 1_800
        assertTrue(auth.isValid())
        t = 3_000
        assertFalse(auth.isValid())
        auth.grant()
        auth.revoke()
        assertFalse(auth.isValid())
    }

    @Test
    fun throttlePolicyIsBounded() {
        val p = PinManager.ThrottlePolicy()
        assertEquals(0L, p.lockoutFor(4))
        assertEquals(30_000L, p.lockoutFor(5))
        assertEquals(15 * 60_000L, p.lockoutFor(50))
    }
}
