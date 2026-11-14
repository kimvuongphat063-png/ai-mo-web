package vn.family.kidsgamesplayer

import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.runner.lifecycle.ActivityLifecycleMonitorRegistry
import androidx.test.runner.lifecycle.Stage
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith
import vn.family.kidsgamesplayer.player.PlayerController

/** I01 (menu + demos usable), I08 (repeated open/close, tap spam), D03 (Back never exits). */
@RunWith(AndroidJUnit4::class)
class MainFlowTest {

    private fun waitUntil(timeoutMs: Long = 15_000, cond: () -> Boolean): Boolean {
        val end = SystemClock.elapsedRealtime() + timeoutMs
        while (SystemClock.elapsedRealtime() < end) {
            if (cond()) return true
            SystemClock.sleep(100)
        }
        return cond()
    }

    private var activity: MainActivity? = null

    /**
     * Runs [block] on the main thread without waiting for the looper to become idle. A game
     * keeps the UI thread busy with frames (very visible on slow software-rendered emulators),
     * and ActivityScenario.onActivity() waits for idle first, which can stall forever there.
     */
    private fun <T> on(sc: ActivityScenario<MainActivity>, block: (MainActivity) -> T): T {
        if (activity == null) sc.onActivity { activity = it }
        var out: T? = null
        InstrumentationRegistry.getInstrumentation().runOnMainSync { out = block(activity!!) }
        @Suppress("UNCHECKED_CAST")
        return out as T
    }

    private fun webViews(root: View): Int = when (root) {
        is WebView -> 1
        is ViewGroup -> (0 until root.childCount).sumOf { webViews(root.getChildAt(it)) }
        else -> 0
    }

    private fun toMenu(sc: ActivityScenario<MainActivity>) {
        assertTrue(waitUntil { on(sc) { it.screen } in setOf(MainActivity.Screen.SETUP, MainActivity.Screen.MENU) })
        on(sc) { if (it.screen == MainActivity.Screen.SETUP) it.findViewById<View>(R.id.setup_try).performClick() }
        assertTrue(waitUntil { on(sc) { it.screen } == MainActivity.Screen.MENU })
    }

    @Test
    fun menuShowsGamesAndRepeatedOpenCloseKeepsOneWebView() {
        ActivityScenario.launch(MainActivity::class.java).use { sc ->
            toMenu(sc)
            assertTrue("demo games visible", waitUntil(20_000) { on(sc) { it.findViewById<RecyclerView>(R.id.grid).childCount } >= 3 })
            repeat(30) { round ->
                on(sc) { act ->
                    val grid = act.findViewById<RecyclerView>(R.id.grid)
                    val card = grid.getChildAt(round % minOf(3, grid.childCount))
                    // Tap spam: only one session may start.
                    card.performClick()
                    card.performClick()
                    card.performClick()
                }
                assertTrue(
                    "round $round playing",
                    waitUntil { on(sc) { it.player?.phase } == PlayerController.Phase.PLAYING } || run {
                        val phase = on(sc) { it.player?.phase }
                        val events = on(sc) { act -> act.applicationContext.graph.diagnostics.recent(limit = 8).joinToString(" | ") { e -> e.tag + ": " + e.message } }
                        throw AssertionError("round $round not playing: phase=$phase events=$events")
                    },
                )
                assertEquals(1, on(sc) { webViews(it.window.decorView) })
                on(sc) { it.onBackPressedDispatcher.onBackPressed() }
                assertTrue("round $round back to menu", waitUntil { on(sc) { it.screen } == MainActivity.Screen.MENU })
                assertTrue(waitUntil(3_000) { on(sc) { webViews(it.window.decorView) } == 0 })
                SystemClock.sleep(400) // a child's next tap; the menu ignores taps within 350 ms
            }
            val resumed = InstrumentationRegistry.getInstrumentation().let { inst ->
                var n = 0
                inst.runOnMainSync { n = ActivityLifecycleMonitorRegistry.getInstance().getActivitiesInStage(Stage.RESUMED).size }
                n
            }
            assertEquals(1, resumed)
        }
    }

    @Test
    fun backOnMenuNeverFinishesTheActivity() {
        ActivityScenario.launch(MainActivity::class.java).use { sc ->
            toMenu(sc)
            repeat(3) { on(sc) { it.onBackPressedDispatcher.onBackPressed() } }
            SystemClock.sleep(500)
            assertFalse(on(sc) { it.isFinishing })
            assertEquals(MainActivity.Screen.MENU, on(sc) { it.screen })
        }
    }
}
