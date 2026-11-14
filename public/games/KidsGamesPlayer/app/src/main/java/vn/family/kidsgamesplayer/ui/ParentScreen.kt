package vn.family.kidsgamesplayer.ui

import android.content.Context
import android.provider.DocumentsContract
import android.text.format.DateUtils
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.appcompat.widget.SwitchCompat
import androidx.core.content.ContextCompat
import androidx.core.net.toUri
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import vn.family.kidsgamesplayer.AppGraph
import vn.family.kidsgamesplayer.R
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.catalog.SourceState
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.parent.PinningController
import vn.family.kidsgamesplayer.player.GameWebViewFactory
import vn.family.kidsgamesplayer.player.speech.SpeechEngine
import vn.family.kidsgamesplayer.player.speech.SpeechHub
import vn.family.kidsgamesplayer.source.SourceGrantManager

/** Parent dashboard (bible §4.4). Only reachable after native PIN authentication. */
class ParentScreen(
    inflater: LayoutInflater,
    parent: ViewGroup,
    private val graph: AppGraph,
    private val scope: CoroutineScope,
    private val pinning: PinningController,
    private val actions: Actions,
) {
    interface Actions {
        fun backToMenu()
        fun chooseFolder()
        fun refresh()
        fun startChildSession()
        fun endChildSession()
        fun changePin()
        fun openSecuritySettings()
        fun toggleHidden(record: GameRecord)
        fun resetProgress(record: GameRecord)
        fun setFlip(flip: Boolean)
        fun testSpeech()
        fun openSpeechSettings()
        fun copyDiagnostics(text: String)
        fun touch()
    }

    val view: View = inflater.inflate(R.layout.screen_parent, parent, false)
    private val ctx: Context = view.context
    private val folderPath: TextView = view.findViewById(R.id.folder_path)
    private val folderState: TextView = view.findViewById(R.id.folder_state)
    private val scanStatus: TextView = view.findViewById(R.id.scan_status)
    private val btnChoose: Button = view.findViewById(R.id.btn_choose_folder)
    private val pinnedWarning: TextView = view.findViewById(R.id.folder_pinned_warning)
    private val gamesList: LinearLayout = view.findViewById(R.id.games_list)
    private val issuesTitle: TextView = view.findViewById(R.id.issues_title)
    private val issuesList: LinearLayout = view.findViewById(R.id.issues_list)
    private val switchSound: SwitchCompat = view.findViewById(R.id.switch_sound)
    private val switchFlip: SwitchCompat = view.findViewById(R.id.switch_flip)
    private val muteNote: TextView = view.findViewById(R.id.mute_note)
    private val speechState: TextView = view.findViewById(R.id.speech_state)
    private val speechDetail: TextView = view.findViewById(R.id.speech_detail)
    private val switchSpeech: SwitchCompat = view.findViewById(R.id.switch_speech)
    private val btnSpeechSettings: Button = view.findViewById(R.id.btn_speech_settings)
    private val pinningState: TextView = view.findViewById(R.id.pinning_state)
    private val btnStart: Button = view.findViewById(R.id.btn_start_session)
    private val btnEnd: Button = view.findViewById(R.id.btn_end_session)
    private val btnSecurity: Button = view.findViewById(R.id.btn_security_settings)
    private val diagnosticsText: TextView = view.findViewById(R.id.diagnostics_text)
    private var job: Job? = null
    private var binding = false

    init {
        view.findViewById<View>(R.id.parent_back).setOnClickListener { actions.backToMenu() }
        btnChoose.setOnClickListener { actions.touch(); actions.chooseFolder() }
        view.findViewById<View>(R.id.btn_refresh).setOnClickListener { actions.touch(); actions.refresh() }
        btnStart.setOnClickListener { actions.touch(); actions.startChildSession() }
        btnEnd.setOnClickListener { actions.touch(); actions.endChildSession() }
        view.findViewById<View>(R.id.btn_change_pin).setOnClickListener { actions.touch(); actions.changePin() }
        btnSecurity.setOnClickListener { actions.touch(); actions.openSecuritySettings() }
        view.findViewById<View>(R.id.btn_copy_diagnostics).setOnClickListener {
            actions.touch()
            actions.copyDiagnostics(DiagnosticsReport.build(ctx, graph, pinning.osState()))
        }
        switchSound.setOnCheckedChangeListener { _, checked ->
            if (!binding) {
                actions.touch()
                graph.settings.update { it.copy(soundEnabled = checked) }
            }
        }
        switchFlip.setOnCheckedChangeListener { _, checked ->
            if (!binding) {
                actions.touch()
                actions.setFlip(checked)
            }
        }
        switchSpeech.setOnCheckedChangeListener { _, checked ->
            if (!binding) {
                actions.touch()
                graph.settings.update { it.copy(speechEnabled = checked) }
            }
        }
        view.findViewById<View>(R.id.btn_speech_test).setOnClickListener { actions.touch(); actions.testSpeech() }
        btnSpeechSettings.setOnClickListener { actions.touch(); actions.openSpeechSettings() }
        muteNote.setText(if (GameWebViewFactory.muteSupported()) R.string.mute_supported_note else R.string.mute_unsupported_note)
    }

    fun onShow() {
        job?.cancel()
        pinning.refresh()
        graph.speech.warmUp()
        job = scope.launch {
            combine(graph.catalog.state, graph.scanner.status, graph.settings.state, pinning.state, graph.speech.status) { c, s, st, p, sp ->
                Quint(c, s, st, p, sp)
            }.collect { render() }
        }
    }

    fun onHide() {
        job?.cancel()
        job = null
        graph.speech.stopTest()
    }

    private data class Quint<A, B, C, D, E>(val a: A, val b: B, val c: C, val d: D, val e: E)

    fun render() {
        val catalog = graph.catalog.current
        val settings = graph.settings.state.value
        val pinState = pinning.state.value
        val pinned = pinState == PinningController.UiState.PINNED || pinState == PinningController.UiState.LOCKED

        // Folder
        val selected = catalog.selectedSourceUri
        folderPath.text = if (selected == null) ctx.getString(R.string.folder_none)
        else ctx.getString(R.string.folder_selected, describeTree(selected))
        when (graph.grants.state(selected)) {
            SourceGrantManager.GrantState.NONE_SELECTED -> folderState.visibility = View.GONE
            SourceGrantManager.GrantState.GRANTED -> {
                folderState.visibility = View.VISIBLE
                folderState.setText(R.string.folder_state_ok)
                folderState.setTextColor(ContextCompat.getColor(ctx, R.color.ok_green))
            }
            SourceGrantManager.GrantState.LOST -> {
                folderState.visibility = View.VISIBLE
                folderState.setText(R.string.folder_state_lost)
                folderState.setTextColor(ContextCompat.getColor(ctx, R.color.warn_red))
            }
        }
        val status = graph.scanner.status.value
        scanStatus.text = when {
            status.running -> ctx.getString(R.string.scan_running)
            status.lastFinishedAt != null -> ctx.getString(
                R.string.scan_last,
                DateUtils.getRelativeTimeSpanString(status.lastFinishedAt, System.currentTimeMillis(), DateUtils.SECOND_IN_MILLIS),
                status.lastSummary ?: "",
            )
            else -> ""
        }
        btnChoose.isEnabled = !pinned
        btnSecurity.isEnabled = !pinned
        pinnedWarning.visibility = if (pinned) View.VISIBLE else View.GONE

        // Games
        gamesList.removeAllViews()
        if (catalog.games.isEmpty()) {
            gamesList.addView(text(ctx.getString(R.string.games_empty)))
        }
        val shadowed = MenuScreen.shadowedDemos(catalog.games.filter { it.playable && !it.hidden })
        catalog.games.sortedWith(compareBy({ !it.builtin }, { it.title.lowercase() }))
            .forEach { gamesList.addView(gameRow(it, it.internalGameId in shadowed)) }
        issuesList.removeAllViews()
        issuesTitle.visibility = if (catalog.issues.isEmpty()) View.GONE else View.VISIBLE
        catalog.issues.forEach { issue ->
            val name = issue.folderName.removePrefix("builtin:")
            issuesList.addView(text("• $name — ${ErrorTexts.describe(ctx, issue.code)} (${issue.detail.take(100)})", small = true))
        }

        // Sound / orientation / voice
        binding = true
        switchSound.isChecked = settings.soundEnabled
        switchFlip.isChecked = settings.reverseLandscape
        switchSpeech.isChecked = settings.speechEnabled
        binding = false
        renderSpeech(graph.speech.status.value)
        btnSpeechSettings.isEnabled = !pinned

        // Session
        pinningState.setText(
            when (pinState) {
                PinningController.UiState.NOT_PINNED -> R.string.pin_state_none
                PinningController.UiState.REQUESTING -> R.string.pin_state_requesting
                PinningController.UiState.PINNED -> R.string.pin_state_pinned
                PinningController.UiState.LOCKED -> R.string.pin_state_locked
                PinningController.UiState.DENIED -> R.string.pin_state_denied
            },
        )
        btnStart.isEnabled = !pinned && pinState != PinningController.UiState.REQUESTING
        btnEnd.isEnabled = pinned

        diagnosticsText.text = DiagnosticsReport.build(ctx, graph, pinning.osState())
    }

    private fun renderSpeech(s: SpeechHub.Status) {
        val vi = s.vietnameseVoice
        val (text, color) = when {
            s.state == SpeechEngine.State.INITIALIZING -> ctx.getString(R.string.speech_state_checking) to R.color.ink
            s.state == SpeechEngine.State.UNAVAILABLE -> ctx.getString(R.string.speech_state_no_engine) to R.color.warn_red
            vi != null -> ctx.getString(R.string.speech_state_vi, vi.name) to R.color.ok_green
            else -> ctx.getString(R.string.speech_state_no_vi) to R.color.warn_red
        }
        speechState.text = text
        speechState.setTextColor(ContextCompat.getColor(ctx, color))
        speechDetail.text = if (s.state == SpeechEngine.State.READY) {
            ctx.resources.getQuantityString(R.plurals.speech_state_detail, s.voices.size, s.engineLabel ?: "?", s.voices.size)
        } else {
            ctx.getString(R.string.speech_install_hint)
        }
    }

    private fun gameRow(g: GameRecord, shadowed: Boolean): View {
        val row = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            setPadding(0, dp(8), 0, dp(8))
        }
        val info = LinearLayout(ctx).apply { orientation = LinearLayout.VERTICAL }
        val title = TextView(ctx).apply {
            text = g.title
            textSize = 17f
            setTextColor(ContextCompat.getColor(ctx, R.color.ink))
            paint.isFakeBoldText = true
        }
        val parts = mutableListOf<String>()
        g.versionLabel?.let { parts += ctx.getString(R.string.game_line_version, it) }
        parts += ctx.getString(if (g.validationLevel == ValidationLevel.VERIFIED) R.string.level_verified else R.string.level_basic)
        parts += ctx.getString(
            when (g.sourceState) {
                SourceState.BUILTIN -> R.string.state_builtin
                SourceState.AVAILABLE -> R.string.state_available
                SourceState.MISSING -> R.string.state_missing
                SourceState.PERMISSION_LOST -> R.string.state_permission_lost
                SourceState.PROVIDER_ERROR -> R.string.state_provider_error
            },
        )
        if (g.hidden) parts += ctx.getString(R.string.state_hidden)
        if (shadowed) parts += ctx.getString(R.string.state_shadowed)
        if (!g.playable) parts += ctx.getString(R.string.state_not_ready)
        val meta = text(parts.joinToString(" · "), small = true)
        info.addView(title)
        info.addView(meta)
        g.lastErrorCode?.let { info.addView(text(ErrorTexts.describe(ctx, it), small = true, warn = true)) }
        row.addView(info, LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f))
        val hide = smallButton(row).apply {
            setText(if (g.hidden) R.string.game_show else R.string.game_hide)
            setOnClickListener { actions.touch(); actions.toggleHidden(g) }
        }
        val reset = smallButton(row).apply {
            setText(R.string.game_reset)
            setOnClickListener { actions.touch(); actions.resetProgress(g) }
        }
        row.addView(hide, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        row.addView(reset, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply { marginStart = dp(8) })
        return row
    }

    private fun text(s: String, small: Boolean = false, warn: Boolean = false) = TextView(ctx).apply {
        text = s
        textSize = if (small) 14f else 16f
        setTextColor(ContextCompat.getColor(ctx, if (warn) R.color.warn_red else if (small) R.color.ink_soft else R.color.ink))
    }

    private fun smallButton(parent: ViewGroup): Button =
        LayoutInflater.from(ctx).inflate(R.layout.parent_small_button, parent, false) as Button

    private fun dp(v: Int) = (v * ctx.resources.displayMetrics.density).toInt()

    private fun describeTree(uri: String): String = runCatching {
        val docId = DocumentsContract.getTreeDocumentId(uri.toUri())
        docId.substringAfter(':', docId).ifEmpty { docId }
    }.getOrDefault(uri)
}
