package vn.family.kidsgamesplayer

import android.os.SystemClock
import android.view.View
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.cancel
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.debug.WebViewTestActivity
import vn.family.kidsgamesplayer.parent.PinManager
import vn.family.kidsgamesplayer.ui.PinPad
import java.io.File

/**
 * Regression: the keypad's own "Hủy" button must remove the keypad, not only run the caller's
 * callback (found on the release build: the game resumed with sound behind a keypad that stayed).
 */
@RunWith(AndroidJUnit4::class)
class PinPadTest {

    @Test
    fun cancelButtonDismissesKeypadAndReportsOnce() {
        val dir = File(InstrumentationRegistry.getInstrumentation().targetContext.cacheDir, "kgp-pinpad-" + System.nanoTime())
        val pins = PinManager(File(dir, "pin.json"), SystemClock::elapsedRealtime)
        val scope = MainScope()
        ActivityScenario.launch(WebViewTestActivity::class.java).use { sc ->
            var pad: PinPad? = null
            var cancelled = 0
            var succeeded = 0
            sc.onActivity { act ->
                pad = PinPad(act.container, pins, scope)
                pad!!.showVerify(onSuccess = { succeeded++ }, onCancel = { cancelled++ })
            }
            sc.onActivity { act ->
                assertTrue(pad!!.isShowing)
                act.container.findViewById<View>(R.id.pin_cancel).performClick()
                assertFalse("keypad still showing after Hủy", pad!!.isShowing)
                assertNull(act.container.findViewById<View>(R.id.pin_title))
                assertEquals(1, cancelled)
                assertEquals(0, succeeded)
            }
            sc.onActivity { act ->
                var createCancelled = 0
                pad!!.showCreate(onCreated = { succeeded++ }, onCancel = { createCancelled++ })
                act.container.findViewById<View>(R.id.pin_cancel).performClick()
                assertFalse(pad!!.isShowing)
                assertEquals(1, createCancelled)
                assertEquals(0, act.container.childCount)
            }
        }
        scope.cancel()
        dir.deleteRecursively()
    }
}
