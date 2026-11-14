package vn.family.kidsgamesplayer

import android.content.ActivityNotFoundException
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Intent
import android.content.pm.ActivityInfo
import android.content.res.Configuration
import android.net.Uri
import android.os.Bundle
import android.os.SystemClock
import android.provider.Settings
import android.speech.tts.TextToSpeech
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.TextView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.net.toUri
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import vn.family.kidsgamesplayer.catalog.CatalogOps
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.core.Ids
import vn.family.kidsgamesplayer.importer.ScanKind
import vn.family.kidsgamesplayer.parent.ParentAuth
import vn.family.kidsgamesplayer.parent.PinningController
import vn.family.kidsgamesplayer.player.OriginCleaner
import vn.family.kidsgamesplayer.player.PlayerController
import vn.family.kidsgamesplayer.player.speech.SpeechHub
import vn.family.kidsgamesplayer.ui.ConfirmOverlay
import vn.family.kidsgamesplayer.ui.MenuScreen
import vn.family.kidsgamesplayer.ui.ParentScreen
import vn.family.kidsgamesplayer.ui.PinPad
import vn.family.kidsgamesplayer.ui.RecoveryScreen
import vn.family.kidsgamesplayer.ui.SetupScreen

/**
 * Single activity hosting native screens (menu, game shell, parent area, setup, recovery).
 * Screen logic lives in the ui/ and player/ controllers; this class only routes between them
 * and owns window concerns: immersive mode, insets, orientation, Back and the folder picker.
 */
class MainActivity : AppCompatActivity(), PlayerController.Host, ParentScreen.Actions, SetupScreen.Actions {

    enum class Screen { NONE, SETUP, MENU, GAME, PARENT, RECOVERY }

    private lateinit var graph: AppGraph
    private lateinit var container: FrameLayout
    private lateinit var overlay: FrameLayout
    private lateinit var banner: TextView
    private lateinit var pinPad: PinPad
    private lateinit var confirmOverlay: ConfirmOverlay
    private lateinit var pinning: PinningController
    private lateinit var originCleaner: OriginCleaner
    private val parentAuth = ParentAuth(SystemClock::elapsedRealtime)

    var screen = Screen.NONE
        private set
    private var menu: MenuScreen? = null
    var player: PlayerController? = null
        private set
    private var parentScreen: ParentScreen? = null
    private var setup: SetupScreen? = null
    private var resumed = false
    private var sessionStartRequested = false
    private var pendingPickToken: String? = null
    private var parentIdleJob: Job? = null

    private val pickFolder = registerForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        onFolderPicked(uri)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        graph = applicationContext.graph
        setContentView(R.layout.activity_main)
        container = findViewById(R.id.screen_container)
        overlay = findViewById(R.id.overlay_container)
        banner = findViewById(R.id.banner)
        pinPad = PinPad(overlay, graph.pins, lifecycleScope)
        confirmOverlay = ConfirmOverlay(overlay)
        pinning = PinningController(this)
        originCleaner = OriginCleaner(this, graph, lifecycleScope)
        pendingPickToken = savedInstanceState?.getString(KEY_PENDING_PICK)

        setupWindow()
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() = onBack()
        })
        lifecycleScope.launch { graph.startup.collect { onStartupState(it) } }
        lifecycleScope.launch { pinning.state.collect { onPinningChanged(it) } }
        lifecycleScope.launch {
            graph.settings.state.map { it.reverseLandscape }.distinctUntilChanged().collect { applyOrientation(it) }
        }
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        pendingPickToken?.let { outState.putString(KEY_PENDING_PICK, it) }
    }

    // ---- window ---------------------------------------------------------------------------

    private fun setupWindow() {
        WindowCompat.setDecorFitsSystemWindows(window, false)
        val root = findViewById<View>(R.id.root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            // Keep native controls and the game out of the camera cutout / caption bar.
            val safe = insets.getInsets(WindowInsetsCompat.Type.displayCutout() or WindowInsetsCompat.Type.captionBar())
            v.setPadding(safe.left, safe.top, safe.right, safe.bottom)
            insets
        }
        hideSystemBars()
    }

    private fun hideSystemBars() {
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        controller.hide(WindowInsetsCompat.Type.systemBars())
    }

    private fun applyOrientation(reverse: Boolean) {
        requestedOrientation = if (reverse) ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE
        else ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
        pinning.onFocusChanged(hasFocus)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // Layouts are match_parent; the menu grid recomputes columns on its layout change.
        hideSystemBars()
    }

    override fun setKeepScreenOn(on: Boolean) {
        if (on) window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    // ---- lifecycle ------------------------------------------------------------------------

    override fun onResume() {
        super.onResume()
        resumed = true
        hideSystemBars()
        pinning.refresh()
        if (screen == Screen.PARENT && !parentAuth.isValid()) showMenu()
        if (screen == Screen.SETUP && graph.pins.isPinSet() && !parentAuth.isValid()) showMenu()
        if (screen == Screen.GAME) player?.onActivityResumed()
        if (screen == Screen.MENU) menu?.startPolling()
        graph.requestAutoFullScan()
        // A voice may have been installed in the system settings meanwhile.
        graph.speech.refresh()
    }

    override fun onPause() {
        resumed = false
        // Order matters: the game is muted/paused before any overlay callback runs.
        player?.onActivityPaused()
        graph.speech.stopTest()
        pinPad.cancel()
        confirmOverlay.dismiss()
        parentAuth.revoke()
        menu?.stopPolling()
        super.onPause()
    }

    override fun onStop() {
        player?.onActivityStopped()
        graph.diagnostics.flush()
        super.onStop()
    }

    override fun onDestroy() {
        player?.destroy()
        // The engine binding is released when the app's window goes away for good; a new
        // activity in the same process binds it again from the menu.
        if (isFinishing) graph.speech.shutdown()
        super.onDestroy()
    }

    // ---- navigation -----------------------------------------------------------------------

    private fun onStartupState(state: AppGraph.Startup) {
        when (state) {
            AppGraph.Startup.LOADING -> Unit
            AppGraph.Startup.CATALOG_UNREADABLE -> showRecovery()
            AppGraph.Startup.READY -> if (screen == Screen.NONE || screen == Screen.RECOVERY) showInitial()
        }
    }

    private fun showInitial() {
        if (!graph.pins.isPinSet() && !graph.settings.state.value.setupDismissed) showSetup() else showMenu()
    }

    private fun switchTo(target: Screen, view: View) {
        when (screen) {
            Screen.MENU -> menu?.onHide()
            Screen.PARENT -> {
                parentScreen?.onHide()
                parentIdleJob?.cancel()
            }
            else -> Unit
        }
        if (view.parent !== container) {
            container.removeAllViews()
            (view.parent as? FrameLayout)?.removeView(view)
            container.addView(view)
        }
        screen = target
    }

    private fun showMenu() {
        // Leaving the game screen always destroys its WebView (bible §4.3).
        player?.destroy()
        parentAuth.revoke()
        setKeepScreenOn(false)
        // Bind the text-to-speech engine early so the first sentence of a game is not late.
        graph.speech.warmUp()
        val m = menu ?: MenuScreen(
            layoutInflater, container, graph, lifecycleScope,
            onOpenGame = { showGame(it) },
            onParentRequested = { requestParentArea() },
            onParentHint = { showBanner(getString(R.string.parent_hold_hint)) },
        ).also { menu = it }
        switchTo(Screen.MENU, m.view)
        m.onShow()
        if (resumed) m.startPolling()
        originCleaner.runPending()
    }

    private fun showGame(record: GameRecord) {
        if (screen != Screen.MENU) return
        val p = player ?: PlayerController(
            this, graph, layoutInflater.inflate(R.layout.screen_game, container, false), lifecycleScope, this,
        ).also { player = it }
        switchTo(Screen.GAME, p.view)
        p.open(record)
    }

    private fun showParent() {
        if (!parentAuth.isValid()) {
            showMenu()
            return
        }
        val p = parentScreen ?: ParentScreen(layoutInflater, container, graph, lifecycleScope, pinning, this).also { parentScreen = it }
        switchTo(Screen.PARENT, p.view)
        p.onShow()
        parentIdleJob = lifecycleScope.launch {
            while (true) {
                delay(15_000)
                if (screen == Screen.PARENT && !parentAuth.isValid()) {
                    showMenu()
                    break
                }
            }
        }
    }

    private fun showSetup() {
        val s = setup ?: SetupScreen(layoutInflater, container, graph, this).also { setup = it }
        switchTo(Screen.SETUP, s.view)
        s.render()
    }

    private fun showRecovery() {
        val r = RecoveryScreen(layoutInflater, container) {
            val rebuild = {
                lifecycleScope.launch {
                    runCatching { withContext(Dispatchers.IO) { graph.rebuildCatalog() } }
                        .onFailure { graph.diagnostics.log("catalog", "rebuild failed: ${it.message}") }
                }
            }
            if (graph.pins.isPinSet()) pinPad.showVerify(onSuccess = { rebuild() }) else rebuild()
        }
        switchTo(Screen.RECOVERY, r.view)
    }

    private fun requestParentArea() {
        if (!graph.pins.isPinSet()) {
            showSetup()
            return
        }
        pinPad.showVerify(onSuccess = {
            parentAuth.grant()
            showParent()
        })
    }

    private fun onBack() {
        when {
            pinPad.isShowing -> pinPad.cancel()
            confirmOverlay.isShowing -> confirmOverlay.dismiss()
            screen == Screen.GAME -> player?.onBackPressed()
            screen == Screen.PARENT -> backToMenu()
            screen == Screen.SETUP -> if (graph.pins.isPinSet()) finishSetup()
            screen == Screen.MENU -> menu?.showBackHint()
            else -> Unit
        }
    }

    // ---- PlayerController.Host --------------------------------------------------------------

    override fun exitToMenu() = showMenu()

    override fun requestParentGate(onCancelled: () -> Unit) {
        if (!graph.pins.isPinSet()) {
            player?.closeForParent()
            showSetup()
            return
        }
        pinPad.showVerify(
            onSuccess = {
                parentAuth.grant()
                player?.closeForParent()
                showParent()
            },
            onCancel = onCancelled,
        )
    }

    // ---- ParentScreen.Actions -------------------------------------------------------------

    override fun backToMenu() {
        parentAuth.revoke()
        showMenu()
    }

    override fun chooseFolder() {
        if (!parentAuth.isValid()) {
            showMenu()
            return
        }
        if (pinning.osState() != PinningController.OsState.NONE) {
            showBanner(getString(R.string.folder_disabled_pinned))
            return
        }
        launchPicker()
    }

    override fun refresh() {
        graph.scanner.request(ScanKind.DEEP)
    }

    override fun startChildSession() {
        sessionStartRequested = true
        when (pinning.requestStart(hasWindowFocus())) {
            PinningController.StartResult.NOT_READY -> {
                sessionStartRequested = false
                showBanner(getString(R.string.session_not_ready))
            }
            PinningController.StartResult.FAILED -> sessionStartRequested = false
            else -> Unit
        }
    }

    override fun endChildSession() {
        sessionStartRequested = false
        val state = pinning.requestStop()
        if (state != PinningController.OsState.NONE) showBanner(getString(R.string.session_end_still_pinned))
    }

    private fun onPinningChanged(state: PinningController.UiState) {
        val pinned = state == PinningController.UiState.PINNED || state == PinningController.UiState.LOCKED
        if (sessionStartRequested && pinned) {
            // Session handed to the child: parent authentication ends here.
            sessionStartRequested = false
            parentAuth.revoke()
            if (screen == Screen.PARENT) showMenu()
        }
        // On DENIED the request stays open: a late confirmation in the Android dialog is still
        // honoured by the poll in PinningController; the parent can also simply retry.
    }

    override fun changePin() {
        pinPad.showCreate(onCreated = { showBanner(getString(R.string.pin_created)) })
    }

    override fun openSecuritySettings() {
        if (pinning.osState() != PinningController.OsState.NONE) {
            showBanner(getString(R.string.folder_disabled_pinned))
            return
        }
        try {
            startActivity(Intent(Settings.ACTION_SECURITY_SETTINGS))
        } catch (_: ActivityNotFoundException) {
            runCatching { startActivity(Intent(Settings.ACTION_SETTINGS)) }
        }
    }

    override fun toggleHidden(record: GameRecord) {
        lifecycleScope.launch {
            val updated = runCatching {
                graph.catalog.update { cat ->
                    val r = cat.byId(record.internalGameId) ?: return@update cat to null
                    CatalogOps.setHidden(cat, r.internalGameId, !r.hidden)
                }
            }.getOrNull()
            updated?.let { withContext(Dispatchers.IO) { runCatching { graph.revisions.writeIdentity(it) } } }
        }
    }

    override fun resetProgress(record: GameRecord) {
        confirmOverlay.show(
            getString(R.string.game_reset_confirm_title, record.title),
            getString(R.string.game_reset_confirm_body),
            getString(R.string.game_reset),
        ) {
            lifecycleScope.launch {
                val updated = runCatching {
                    graph.catalog.update { cat -> CatalogOps.resetProgress(cat, record.internalGameId, Ids.newOriginToken()) }
                }.getOrNull()
                if (updated != null) {
                    withContext(Dispatchers.IO) { runCatching { graph.revisions.writeIdentity(updated) } }
                    graph.diagnostics.log("parent", "progress reset: ${updated.title}")
                    showBanner(getString(R.string.game_reset_done))
                    originCleaner.runPending()
                }
            }
        }
    }

    override fun setFlip(flip: Boolean) {
        graph.settings.update { it.copy(reverseLandscape = flip) }
    }

    override fun testSpeech() {
        val result = graph.speech.testSpeak(getString(R.string.speech_test_phrase), graph.settings.state.value.soundEnabled)
        when (result) {
            SpeechHub.TestResult.SPEAKING -> Unit
            SpeechHub.TestResult.SOUND_OFF -> showBanner(getString(R.string.speech_test_sound_off))
            SpeechHub.TestResult.NO_VIETNAMESE_VOICE -> showBanner(getString(R.string.speech_test_no_voice))
            SpeechHub.TestResult.NOT_READY -> showBanner(getString(R.string.speech_test_not_ready))
            SpeechHub.TestResult.FAILED -> showBanner(getString(R.string.speech_test_failed))
        }
    }

    override fun openSpeechSettings() {
        if (pinning.osState() != PinningController.OsState.NONE) {
            showBanner(getString(R.string.folder_disabled_pinned))
            return
        }
        try {
            startActivity(Intent(ACTION_TTS_SETTINGS))
        } catch (_: ActivityNotFoundException) {
            // Some builds hide the settings page; the engine's own voice installer may exist.
            try {
                startActivity(Intent(TextToSpeech.Engine.ACTION_INSTALL_TTS_DATA))
            } catch (_: ActivityNotFoundException) {
                showBanner(getString(R.string.speech_settings_missing))
            }
        }
    }

    override fun copyDiagnostics(text: String) {
        val cm = getSystemService(ClipboardManager::class.java)
        cm?.setPrimaryClip(ClipData.newPlainText("Kids Games Player", text))
        showBanner(getString(R.string.diagnostics_copied))
    }

    override fun touch() = parentAuth.touch()

    // ---- SetupScreen.Actions --------------------------------------------------------------

    override fun createPin() {
        pinPad.showCreate(onCreated = {
            parentAuth.grant()
            graph.settings.update { it.copy(setupDismissed = true) }
            setup?.render()
            showBanner(getString(R.string.pin_created))
        })
    }

    override fun chooseFolderFromSetup() {
        if (!graph.pins.isPinSet()) return
        if (parentAuth.isValid()) launchPicker()
        else pinPad.showVerify(onSuccess = {
            parentAuth.grant()
            launchPicker()
        })
    }

    override fun trySamples() {
        graph.settings.update { it.copy(setupDismissed = true) }
        showMenu()
    }

    override fun finishSetup() {
        graph.settings.update { it.copy(setupDismissed = true) }
        parentAuth.revoke()
        showMenu()
    }

    // ---- folder picker (bible §6.1, I22) ----------------------------------------------------

    private fun launchPicker() {
        pendingPickToken = Ids.newImportId()
        val initial = graph.catalog.current.selectedSourceUri?.toUri()
        try {
            pickFolder.launch(initial)
        } catch (_: ActivityNotFoundException) {
            pendingPickToken = null
            showBanner(getString(R.string.folder_not_persistable))
        }
    }

    private fun onFolderPicked(uri: Uri?) {
        // Applied once, only for the request the parent authenticated; never re-opens settings.
        if (pendingPickToken == null) {
            graph.diagnostics.log("folder", "picker result without a pending request ignored")
            return
        }
        pendingPickToken = null
        if (uri == null) {
            showBanner(getString(R.string.folder_cancelled))
            return
        }
        if (!graph.grants.takeRead(uri)) {
            graph.diagnostics.log("folder", "provider did not grant a persistable read permission")
            showBanner(getString(R.string.folder_not_persistable))
            return
        }
        lifecycleScope.launch {
            val old = graph.catalog.current.selectedSourceUri
            runCatching { graph.catalog.update { it.copy(selectedSourceUri = uri.toString()) to Unit } }
                .onFailure {
                    showBanner(getString(R.string.err_io))
                    return@launch
                }
            if (old != null && old != uri.toString()) graph.grants.release(old.toUri())
            graph.diagnostics.log("folder", "source folder selected")
            graph.scanner.request(ScanKind.DEEP)
            showBanner(getString(R.string.folder_saved))
            setup?.render()
        }
    }

    // ---- banner -----------------------------------------------------------------------------

    private val hideBanner = Runnable { banner.visibility = View.GONE }

    fun showBanner(text: String) {
        banner.text = text
        banner.visibility = View.VISIBLE
        banner.removeCallbacks(hideBanner)
        banner.postDelayed(hideBanner, 3_500)
    }

    companion object {
        private const val KEY_PENDING_PICK = "pending_pick"
        /** System text-to-speech settings (engine, voice data); not a public Settings constant. */
        private const val ACTION_TTS_SETTINGS = "com.android.settings.TTS_SETTINGS"
    }
}
