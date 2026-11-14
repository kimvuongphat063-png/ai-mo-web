package vn.family.kidsgamesplayer.parent

import android.app.Activity
import android.app.ActivityManager
import android.app.KeyguardManager
import android.content.Context
import android.os.SystemClock
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

/**
 * Screen pinning / lock task state (bible §4.5, §12.2–12.3). The displayed state is always
 * derived from ActivityManager.lockTaskModeState; a stored Boolean is never treated as proof.
 */
class PinningController(private val activity: Activity) {

    enum class OsState { NONE, PINNED, LOCKED }

    enum class UiState { NOT_PINNED, REQUESTING, PINNED, LOCKED, DENIED }

    private val am = activity.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val keyguard = activity.getSystemService(Context.KEYGUARD_SERVICE) as KeyguardManager

    private var requestedAt = -1L
    private var denied = false
    private var awaitingFocusReturn = false
    private val handler = android.os.Handler(android.os.Looper.getMainLooper())

    /**
     * The confirmation dialog does not always take window focus (seen on Android 17), so the
     * OS state is also polled for a while after a request. The answer always comes from
     * ActivityManager; nothing is assumed from the dialog.
     */
    private val poll = object : Runnable {
        override fun run() {
            if (requestedAt < 0 && !awaitingFocusReturn) return
            val elapsed = SystemClock.elapsedRealtime() - requestedAt
            if (osState() == OsState.NONE && requestedAt >= 0 && elapsed > DIALOG_GRACE_MS && !denied) {
                denied = true
            }
            refresh()
            if (osState() == OsState.NONE && elapsed < POLL_WINDOW_MS) handler.postDelayed(this, 1_000)
        }
    }

    private val _state = MutableStateFlow(UiState.NOT_PINNED)
    val state: StateFlow<UiState> = _state.asStateFlow()

    fun osState(): OsState = when (am.lockTaskModeState) {
        ActivityManager.LOCK_TASK_MODE_PINNED -> OsState.PINNED
        ActivityManager.LOCK_TASK_MODE_LOCKED -> OsState.LOCKED
        else -> OsState.NONE
    }

    enum class StartResult { REQUESTED, ALREADY, NOT_READY, FAILED }

    /** Starts a child session. Only call from an explicit, authenticated parent action. */
    fun requestStart(hasWindowFocus: Boolean): StartResult {
        if (osState() != OsState.NONE) {
            refresh()
            return StartResult.ALREADY
        }
        if (!hasWindowFocus || keyguard.isKeyguardLocked) return StartResult.NOT_READY
        return try {
            denied = false
            requestedAt = SystemClock.elapsedRealtime()
            awaitingFocusReturn = true
            activity.startLockTask()
            refresh()
            handler.removeCallbacks(poll)
            handler.postDelayed(poll, 1_000)
            StartResult.REQUESTED
        } catch (e: RuntimeException) {
            requestedAt = -1L
            awaitingFocusReturn = false
            denied = true
            refresh()
            StartResult.FAILED
        }
    }

    /** Ends a session this activity started. Re-reads the OS state; never claims success blindly. */
    fun requestStop(): OsState {
        try {
            activity.stopLockTask()
        } catch (_: RuntimeException) {
            // Not in lock task, or pinned by someone else: the state below tells the truth.
        }
        requestedAt = -1L
        awaitingFocusReturn = false
        refresh()
        return osState()
    }

    /** Call from onResume / onWindowFocusChanged. */
    fun onFocusChanged(hasFocus: Boolean) {
        if (hasFocus && awaitingFocusReturn && requestedAt >= 0) {
            // The confirmation dialog is gone. Give the system a moment to apply the decision.
            activity.window.decorView.postDelayed({ settleAfterDialog() }, 600)
        }
        refresh()
    }

    private fun settleAfterDialog() {
        if (!awaitingFocusReturn) return
        awaitingFocusReturn = false
        if (osState() == OsState.NONE) denied = true
        requestedAt = -1L
        refresh()
    }

    fun refresh() {
        val os = osState()
        if (os != OsState.NONE) {
            denied = false
            awaitingFocusReturn = false
            requestedAt = -1L
            handler.removeCallbacks(poll)
        } else if (requestedAt >= 0 && SystemClock.elapsedRealtime() - requestedAt > POLL_WINDOW_MS) {
            requestedAt = -1L
            awaitingFocusReturn = false
            denied = true
        }
        _state.value = when {
            os == OsState.PINNED -> UiState.PINNED
            os == OsState.LOCKED -> UiState.LOCKED
            denied -> UiState.DENIED
            requestedAt >= 0 -> UiState.REQUESTING
            else -> UiState.NOT_PINNED
        }
    }

    companion object {
        /** After this long without the OS reporting a pin, the UI says "not pinned yet". */
        const val DIALOG_GRACE_MS = 8_000L
        /** A late "Got it" is still picked up within this window. */
        const val POLL_WINDOW_MS = 30_000L
    }

    fun clearDenied() {
        denied = false
        refresh()
    }
}
