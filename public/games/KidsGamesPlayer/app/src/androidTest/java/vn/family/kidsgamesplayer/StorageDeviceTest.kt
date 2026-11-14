package vn.family.kidsgamesplayer

import android.os.SystemClock
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.catalog.Catalog
import vn.family.kidsgamesplayer.catalog.CatalogStore
import vn.family.kidsgamesplayer.parent.PinManager
import java.io.File

/** Real androidx AtomicFile on Android (the JVM tests use the NIO variant on Windows hosts). */
@RunWith(AndroidJUnit4::class)
class StorageDeviceTest {
    private val dir = File(InstrumentationRegistry.getInstrumentation().targetContext.cacheDir, "kgp-store-" + System.nanoTime())

    @Test
    fun catalogAtomicFileRoundTripAndBackup() {
        val store = CatalogStore(dir)
        store.write(Catalog(selectedSourceUri = "content://a"))
        store.write(Catalog(selectedSourceUri = "content://b"))
        assertEquals("content://b", (store.load() as CatalogStore.LoadResult.Loaded).catalog.selectedSourceUri)
        File(dir, "catalog.json").writeText("{broken")
        val r = store.load() as CatalogStore.LoadResult.Loaded
        assertTrue(r.fromBackup)
        assertEquals("content://a", r.catalog.selectedSourceUri)
        dir.deleteRecursively()
    }

    @Test
    fun pinHashCostOnDevice() {
        val m = PinManager(File(dir, "pin.json"), SystemClock::elapsedRealtime)
        val t0 = SystemClock.elapsedRealtime()
        m.setPin("482916")
        val t1 = SystemClock.elapsedRealtime()
        assertEquals(PinManager.VerifyResult.Ok, m.verify("482916"))
        val t2 = SystemClock.elapsedRealtime()
        android.util.Log.i("KGP-PIN", "PBKDF2 ${PinManager.DEFAULT_ITERATIONS} iterations: set=${t1 - t0}ms verify=${t2 - t1}ms")
        // Must stay usable on the UI flow (runs off the main thread, but should not take seconds).
        assertTrue("verify took ${t2 - t1} ms", t2 - t1 < 3_000)
        dir.deleteRecursively()
    }
}
