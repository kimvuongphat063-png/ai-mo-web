package vn.family.kidsgamesplayer.player

import android.app.Activity
import android.graphics.Color
import android.os.SystemClock
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.core.graphics.toColorInt
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import androidx.webkit.WebViewRenderProcess
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import vn.family.kidsgamesplayer.AppGraph
import vn.family.kidsgamesplayer.R
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.importer.RevisionStore
import vn.family.kidsgamesplayer.ui.HoldButton
import vn.family.kidsgamesplayer.ui.IconLoader

/**
 * Owns the single game WebView and its lifecycle (bible §9–§10). Every WebView callback is
 * tagged with the session generation; callbacks from an older WebView never change the UI or
 * the mute policy of the current one. Open/home/restart are serialized through [phase].
 */
class PlayerController(
    private val activity: Activity,
    private val graph: AppGraph,
    val view: View,
    private val scope: CoroutineScope,
    private val host: Host,
) : PlayerEvents {

    interface Host {
        fun exitToMenu()
        fun requestParentGate(onCancelled: () -> Unit)
        fun setKeepScreenOn(on: Boolean)
    }

    enum class Phase { IDLE, LOADING, PLAYING, CLOSING, SUSPENDED, ERROR }

    var phase = Phase.IDLE
        private set
    private var record: GameRecord? = null
    private var session: GameSession? = null
    private var webView: KidsWebView? = null
    private var lease: RevisionStore.Lease? = null
    private var generationCounter = 0L
    private var seq = 0
    private var foreground = true
    private var parentGateOpen = false
    private var confirmOpen = false
    private var lastSent: Pair<Boolean, Boolean>? = null
    private var pendingReason = HostReason.START
    private var loadTimeout: Job? = null
    private var stateRetries = 0
    private var blockedLogBudget = 30
    private var unresponsiveShown = false
    /** Documents loaded in this session (onPageStarted) and the one the speech channel serves. */
    private var pageSeq = 0
    private var speechPage = -1
    private val crashTimes = ArrayDeque<Long>()

    private val webContainer: FrameLayout = view.findViewById(R.id.web_container)
    private val inputBlocker: View = view.findViewById(R.id.input_blocker)
    private val loading: View = view.findViewById(R.id.loading_overlay)
    private val loadingIcon: ImageView = view.findViewById(R.id.loading_icon)
    private val error: View = view.findViewById(R.id.error_overlay)
    private val errorTitle: TextView = view.findViewById(R.id.error_title)
    private val errorRetry: ImageButton = view.findViewById(R.id.error_retry)
    private val resume: View = view.findViewById(R.id.resume_overlay)
    private val confirm: View = view.findViewById(R.id.confirm_overlay)
    private val btnSound: ImageButton = view.findViewById(R.id.btn_sound)
    private val btnParent: HoldButton = view.findViewById(R.id.btn_parent)
    private val iconLoader = IconLoader(graph.revisions, scope)

    init {
        view.findViewById<View>(R.id.btn_home).setOnClickListener { goHome() }
        view.findViewById<View>(R.id.btn_restart).setOnClickListener { askRestart() }
        view.findViewById<View>(R.id.error_home).setOnClickListener { goHome() }
        view.findViewById<View>(R.id.resume_play).setOnClickListener { record?.let { open(it, HostReason.RESUME) } }
        view.findViewById<View>(R.id.confirm_no).setOnClickListener { closeConfirm() }
        view.findViewById<View>(R.id.confirm_yes).setOnClickListener { confirmRestart() }
        errorRetry.setOnClickListener { record?.let { open(it, HostReason.RESTART) } }
        btnSound.setOnClickListener { toggleSound() }
        btnParent.centerIcon = ContextCompat.getDrawable(activity, R.drawable.ic_lock)
        btnParent.onActivated = { openParentGate() }
        renderSoundButton()
    }

    val currentGameId: String? get() = record?.internalGameId

    // ---- open / close -------------------------------------------------------------------

    fun open(target: GameRecord, reason: HostReason = HostReason.START) {
        if (phase == Phase.LOADING || phase == Phase.PLAYING || phase == Phase.CLOSING) return
        teardownWebView()
        record = target
        hideOverlays()
        confirmOpen = false
        parentGateOpen = false
        unresponsiveShown = false
        val rev = target.activeRevision
        val meta = rev?.let { graph.revisions.readMeta(target.internalGameId, it) }
        if (rev == null || meta == null) {
            graph.diagnostics.log("player", "${target.title}: revision unavailable")
            showError(R.string.game_error_title, retry = false)
            return
        }
        val gen = ++generationCounter
        val sdkGame = (target.playerApiVersion ?: meta.playerApiVersion) == 1
        val s = GameSession(
            generation = gen,
            internalGameId = target.internalGameId,
            title = target.title,
            revisionHash = rev,
            root = graph.revisions.revisionRoot(target.internalGameId, rev),
            storageOriginToken = target.storageOriginToken,
            files = meta.files.associateBy { it.path },
            sdkGame = sdkGame,
        )
        val soundOn = graph.settings.state.value.soundEnabled
        if (AudioPolicy.mustBlockLaunch(GameWebViewFactory.muteSupported(), sdkGame, soundOn)) {
            graph.diagnostics.log("player", "${target.title}: blocked, provider cannot mute a non-SDK game while sound is off")
            showError(R.string.game_blocked_silent, retry = false)
            return
        }
        val wv = try {
            GameWebViewFactory.create(activity, parseColor(target.backgroundColor))
        } catch (t: Throwable) {
            graph.diagnostics.log("webview", "create failed: ${t.javaClass.simpleName}: ${t.message}")
            showError(R.string.webview_missing_title, retry = true, detail = activity.getString(R.string.webview_missing_body))
            return
        }
        lease = graph.revisions.acquireLease(target.internalGameId, rev)
        wv.webViewClient = GameWebViewClient(s, graph.router, this)
        wv.webChromeClient = GameChromeClient(gen, this)
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_VIEW_RENDERER_CLIENT_BASIC_USAGE)) {
            WebViewCompat.setWebViewRenderProcessClient(wv, ContextCompat.getMainExecutor(activity), GameRenderProcessClient(gen, this))
        }
        GameWebViewFactory.setMuted(wv, true)
        webContainer.addView(wv, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        session = s
        webView = wv
        phase = Phase.LOADING
        pendingReason = reason
        lastSent = null
        stateRetries = 0
        blockedLogBudget = 30
        pageSeq = 0
        speechPage = -1
        showLoading(target)
        wv.loadUrl(s.entryUrl)
        loadTimeout = scope.launch {
            delay(LOAD_TIMEOUT_MS)
            if (session?.generation == gen && phase == Phase.LOADING) failSession(gen, "load timeout")
        }
        val now = System.currentTimeMillis()
        scope.launch {
            runCatching {
                graph.catalog.update { cat ->
                    val r = cat.byId(target.internalGameId) ?: return@update cat to Unit
                    cat.replaceGame(r.copy(lastPlayedAt = now)) to Unit
                }
            }
        }
    }

    /** Home button / Back: pause+save best effort with a bounded wait, then destroy. */
    fun goHome() {
        when (phase) {
            Phase.LOADING, Phase.PLAYING -> {
                val wv = webView
                val gen = session?.generation
                phase = Phase.CLOSING
                if (wv == null || gen == null) {
                    finishClose()
                    return
                }
                GameWebViewFactory.setMuted(wv, true)
                graph.speech.closeChannel()
                var done = false
                val finish = {
                    if (!done) {
                        done = true
                        finishClose()
                    }
                }
                sendState(HostState(++seq, active = false, muted = true, reason = HostReason.HOME, requestSave = true)) { finish() }
                view.postDelayed({ finish() }, SAVE_WAIT_MS)
            }
            Phase.CLOSING -> Unit
            else -> finishClose()
        }
    }

    private fun finishClose() {
        teardownWebView()
        phase = Phase.IDLE
        record = null
        hideOverlays()
        host.exitToMenu()
    }

    /** PIN accepted from inside the game: the session ends; the host shows the parent area. */
    fun closeForParent() {
        teardownWebView()
        phase = Phase.IDLE
        record = null
        parentGateOpen = false
        hideOverlays()
    }

    fun destroy() {
        teardownWebView()
        phase = Phase.IDLE
    }

    private fun teardownWebView() {
        graph.speech.closeChannel()
        speechPage = -1
        loadTimeout?.cancel()
        loadTimeout = null
        val wv = webView
        webView = null
        session = null
        if (wv != null) {
            GameWebViewFactory.setMuted(wv, true)
            wv.stopLoading()
            (wv.parent as? ViewGroup)?.removeView(wv)
            wv.destroy()
        }
        lease?.close()
        lease = null
        inputBlocker.visibility = View.GONE
        host.setKeepScreenOn(false)
    }

    // ---- lifecycle ----------------------------------------------------------------------

    fun onActivityResumed() {
        foreground = true
        val wv = webView
        if (wv != null && phase == Phase.PLAYING) {
            wv.onResume()
            applyPolicy(HostReason.RESUME)
        }
        renderSoundButton()
    }

    fun onActivityPaused() {
        foreground = false
        val wv = webView ?: return
        if (phase != Phase.PLAYING && phase != Phase.LOADING) return
        GameWebViewFactory.setMuted(wv, true)
        applyPolicy(HostReason.BACKGROUND, requestSave = true)
        wv.onPause()
        if (!GameWebViewFactory.muteSupported()) {
            // Without native mute, a paused-but-alive WebView could keep playing sound.
            suspendSession()
        }
    }

    fun onActivityStopped() {
        if (webView != null && (phase == Phase.PLAYING || phase == Phase.LOADING)) suspendSession()
    }

    private fun suspendSession() {
        teardownWebView()
        phase = Phase.SUSPENDED
        hideOverlays()
        resume.visibility = View.VISIBLE
    }

    // ---- controls -----------------------------------------------------------------------

    private fun openParentGate() {
        if (parentGateOpen) return
        parentGateOpen = true
        webView?.let { GameWebViewFactory.setMuted(it, true) }
        if (phase == Phase.PLAYING) applyPolicy(HostReason.PARENT, requestSave = true)
        if (!GameWebViewFactory.muteSupported() && webView != null) suspendSession()
        host.requestParentGate(onCancelled = {
            parentGateOpen = false
            if (phase == Phase.PLAYING) applyPolicy(HostReason.RESUME)
        })
    }

    private fun askRestart() {
        if (phase != Phase.PLAYING && phase != Phase.LOADING) {
            record?.let { open(it, HostReason.RESTART) }
            return
        }
        confirmOpen = true
        confirm.visibility = View.VISIBLE
        if (phase == Phase.PLAYING) applyPolicy(HostReason.RESTART, requestSave = true)
    }

    private fun closeConfirm() {
        confirmOpen = false
        confirm.visibility = View.GONE
        if (phase == Phase.PLAYING) applyPolicy(HostReason.RESUME)
    }

    private fun confirmRestart() {
        confirmOpen = false
        confirm.visibility = View.GONE
        val target = record ?: return
        teardownWebView()
        phase = Phase.IDLE
        open(target, HostReason.RESTART)
    }

    fun onBackPressed() {
        if (confirmOpen) closeConfirm() else goHome()
    }

    private fun toggleSound() {
        graph.settings.update { it.copy(soundEnabled = !it.soundEnabled) }
        renderSoundButton()
        val s = session
        if (s != null && !graph.settings.state.value.soundEnabled &&
            AudioPolicy.mustBlockLaunch(GameWebViewFactory.muteSupported(), s.sdkGame, false)
        ) {
            graph.diagnostics.log("player", "sound off for non-SDK game without native mute: session closed")
            teardownWebView()
            phase = Phase.IDLE
            showError(R.string.game_blocked_silent, retry = false)
            return
        }
        if (phase == Phase.PLAYING) applyPolicy(HostReason.SOUND_CHANGED)
    }

    private fun renderSoundButton() {
        val on = graph.settings.state.value.soundEnabled
        btnSound.setImageResource(if (on) R.drawable.ic_volume_on else R.drawable.ic_volume_off)
        btnSound.contentDescription = activity.getString(if (on) R.string.cd_sound_on else R.string.cd_sound_off)
    }

    // ---- audio / host state -------------------------------------------------------------

    private fun audible(): Boolean = AudioPolicy.shouldBeAudible(
        activityForeground = foreground,
        screenIsGame = true,
        sessionPlaying = phase == Phase.PLAYING,
        parentGateClosed = !parentGateOpen,
        userSoundEnabled = graph.settings.state.value.soundEnabled,
    ) && !confirmOpen

    private fun active(): Boolean = foreground && phase == Phase.PLAYING && !parentGateOpen && !confirmOpen

    private fun applyPolicy(reason: HostReason, requestSave: Boolean = false) {
        val wv = webView ?: return
        val audible = audible()
        val active = active()
        // Native mute is applied before the page is told to pause (bible §10.2).
        GameWebViewFactory.setMuted(wv, !audible)
        val key = active to !audible
        if (requestSave || lastSent != key) sendState(HostState(++seq, active, !audible, reason, requestSave))
        inputBlocker.visibility = if (!active && phase == Phase.PLAYING) View.VISIBLE else View.GONE
        host.setKeepScreenOn(active)
        // The game's voice follows the same rule: silent (timed) as soon as not audible.
        graph.speech.policyChanged()
    }

    /** The speech rule: [audible] plus the parent's "read text in games" switch. */
    private fun speechAudible(): Boolean = audible() && graph.settings.state.value.speechEnabled

    /** Opens the speech channel for the current document once it is loaded and the session plays. */
    private fun attachSpeech() {
        val wv = webView ?: return
        val s = session ?: return
        if (phase != Phase.PLAYING || speechPage == pageSeq) return
        speechPage = pageSeq
        graph.speech.openChannel(wv, s.origin, "g${s.generation}-p$pageSeq", ::speechAudible)
    }

    private fun sendState(state: HostState, onResult: ((String?) -> Unit)? = null) {
        val wv = webView ?: run {
            onResult?.invoke(null)
            return
        }
        val gen = session?.generation
        lastSent = state.active to state.muted
        try {
            wv.evaluateJavascript(state.script()) { result ->
                if (gen != null && session?.generation == gen && result == "\"error\"") {
                    graph.diagnostics.log("player", "onHostState threw (${state.reason.wire})")
                }
                onResult?.invoke(result)
            }
        } catch (t: RuntimeException) {
            graph.diagnostics.log("player", "evaluateJavascript failed: ${t.javaClass.simpleName}")
            onResult?.invoke(null)
        }
    }

    private fun deliverInitialState(gen: Long) {
        val wouldBeAudible = foreground && !parentGateOpen && !confirmOpen && graph.settings.state.value.soundEnabled
        val active = foreground && !parentGateOpen && !confirmOpen
        sendState(HostState(++seq, active, !wouldBeAudible, pendingReason, requestSave = false)) { result ->
            if (session?.generation != gen || phase != Phase.LOADING) return@sendState
            if (result == "\"absent\"" && (session?.sdkGame == true) && stateRetries < 6) {
                // SDK still booting: retry briefly instead of relying on one late callback.
                stateRetries++
                view.postDelayed({ if (session?.generation == gen && phase == Phase.LOADING) deliverInitialState(gen) }, 250)
                return@sendState
            }
            markPlaying()
        }
    }

    private fun markPlaying() {
        loadTimeout?.cancel()
        phase = Phase.PLAYING
        loading.visibility = View.GONE
        lastSent = null
        applyPolicy(pendingReason)
        attachSpeech()
    }

    // ---- PlayerEvents -------------------------------------------------------------------

    override fun onPageStarted(generation: Long, url: String) {
        if (session?.generation != generation) return
        // A new document: whatever the previous one was saying stops, its channel is closed.
        pageSeq++
        graph.speech.closeChannel()
        speechPage = -1
    }

    override fun onPageFinished(generation: Long, url: String) {
        if (session?.generation != generation) return
        when (phase) {
            Phase.LOADING -> deliverInitialState(generation)
            // A later document of the same session (reload, link to another page of the game).
            Phase.PLAYING -> attachSpeech()
            else -> Unit
        }
    }

    override fun onMainFrameError(generation: Long, description: String) {
        if (session?.generation != generation) return
        view.post { failSession(generation, "main frame: $description") }
    }

    private fun failSession(generation: Long, reason: String) {
        if (session?.generation != generation) return
        graph.diagnostics.log("player", "${record?.title}: $reason")
        teardownWebView()
        showError(R.string.game_error_title, retry = true)
    }

    override fun onRenderProcessGone(generation: Long, crashed: Boolean) {
        // The WebView that lost its renderer must be removed and destroyed, never reused.
        if (session?.generation != generation) return
        graph.diagnostics.log("player", "${record?.title}: renderer ${if (crashed) "crashed" else "killed by system"}")
        val now = SystemClock.elapsedRealtime()
        crashTimes.addLast(now)
        while (crashTimes.isNotEmpty() && now - crashTimes.first() > 60_000L) crashTimes.removeFirst()
        teardownWebView()
        showError(R.string.game_error_title, retry = crashTimes.size < 3)
    }

    override fun onRendererUnresponsive(generation: Long, process: WebViewRenderProcess?) {
        if (session?.generation != generation || unresponsiveShown) return
        unresponsiveShown = true
        graph.diagnostics.log("player", "${record?.title}: renderer unresponsive")
        if (process != null && WebViewFeature.isFeatureSupported(WebViewFeature.WEB_VIEW_RENDERER_TERMINATE)) {
            runCatching { process.terminate() }
        }
        teardownWebView()
        showError(R.string.game_unresponsive, retry = true)
    }

    override fun onRendererResponsive(generation: Long) = Unit

    override fun onBlocked(generation: Long, kind: RequestRouter.BlockKind, detail: String) {
        if (session?.generation != generation) return
        // Browsers probe favicon.ico automatically; that is not a game error.
        if (kind == RequestRouter.BlockKind.NOT_FOUND && detail == "favicon.ico") return
        if (blockedLogBudget-- <= 0) return
        val text = when (kind) {
            RequestRouter.BlockKind.EXTERNAL -> "Game đang yêu cầu tài nguyên ngoài máy: " + vn.family.kidsgamesplayer.core.Diagnostics.shortUrl(detail)
            RequestRouter.BlockKind.NOT_FOUND -> "Thiếu file trong game: " + detail.take(120)
            RequestRouter.BlockKind.OTHER_GAME -> "Chặn truy cập sang game khác"
            else -> "Chặn: ${kind.name.lowercase()} " + vn.family.kidsgamesplayer.core.Diagnostics.shortUrl(detail, 80)
        }
        graph.diagnostics.log("game", "${record?.title}: $text")
    }

    override fun onGameMessage(generation: Long, tag: String, message: String) {
        if (session?.generation != generation) return
        graph.diagnostics.log("game", "${record?.title} [$tag] ${message.take(200)}")
    }

    // ---- overlays -----------------------------------------------------------------------

    private fun showLoading(target: GameRecord) {
        hideOverlays()
        loading.visibility = View.VISIBLE
        iconLoader.load(target, (96 * activity.resources.displayMetrics.density).toInt(), loadingIcon)
    }

    private fun showError(titleRes: Int, retry: Boolean, detail: String? = null) {
        phase = Phase.ERROR
        hideOverlays()
        errorTitle.setText(titleRes)
        val detailView = view.findViewById<TextView>(R.id.error_detail)
        detailView.text = detail ?: ""
        detailView.visibility = if (detail == null) View.GONE else View.VISIBLE
        errorRetry.visibility = if (retry) View.VISIBLE else View.GONE
        error.visibility = View.VISIBLE
    }

    private fun hideOverlays() {
        loading.visibility = View.GONE
        error.visibility = View.GONE
        resume.visibility = View.GONE
        confirm.visibility = View.GONE
        inputBlocker.visibility = View.GONE
    }

    private fun parseColor(c: String?): Int = runCatching { c?.toColorInt() ?: Color.BLACK }.getOrDefault(Color.BLACK)

    /** For tests/diagnostics: the WebView currently attached, if any. */
    fun currentWebViewForTest(): KidsWebView? = webView

    companion object {
        const val LOAD_TIMEOUT_MS = 20_000L
        const val SAVE_WAIT_MS = 300L
    }
}
