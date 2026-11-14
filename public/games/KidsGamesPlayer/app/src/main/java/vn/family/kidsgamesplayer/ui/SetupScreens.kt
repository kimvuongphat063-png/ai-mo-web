package vn.family.kidsgamesplayer.ui

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import vn.family.kidsgamesplayer.AppGraph
import vn.family.kidsgamesplayer.R

/** First-run parent screen (bible §4.1): one-sentence intro, PIN, folder, pinning guide. */
class SetupScreen(
    inflater: LayoutInflater,
    parent: ViewGroup,
    private val graph: AppGraph,
    private val actions: Actions,
) {
    interface Actions {
        fun createPin()
        fun chooseFolderFromSetup()
        fun trySamples()
        fun finishSetup()
    }

    val view: View = inflater.inflate(R.layout.screen_setup, parent, false)
    private val pinStatus: TextView = view.findViewById(R.id.setup_pin_status)
    private val pinButton: Button = view.findViewById(R.id.setup_pin_button)
    private val folderStatus: TextView = view.findViewById(R.id.setup_folder_status)
    private val folderButton: Button = view.findViewById(R.id.setup_folder_button)
    private val doneButton: Button = view.findViewById(R.id.setup_done)

    init {
        pinButton.setOnClickListener { actions.createPin() }
        folderButton.setOnClickListener { actions.chooseFolderFromSetup() }
        view.findViewById<View>(R.id.setup_try).setOnClickListener { actions.trySamples() }
        doneButton.setOnClickListener { actions.finishSetup() }
    }

    fun render() {
        val hasPin = graph.pins.isPinSet()
        pinStatus.text = if (hasPin) view.context.getString(R.string.setup_pin_done) else ""
        pinButton.visibility = if (hasPin) View.GONE else View.VISIBLE
        val hasFolder = graph.catalog.current.selectedSourceUri != null
        folderStatus.setText(if (hasFolder) R.string.setup_folder_done else R.string.setup_folder_none)
        // The folder picker needs the parent PIN to exist first, so settings stay protected.
        folderButton.isEnabled = hasPin
        doneButton.isEnabled = hasPin
    }
}

/** Shown when the catalog file cannot be read at all (bible §7.2). */
class RecoveryScreen(
    inflater: LayoutInflater,
    parent: ViewGroup,
    onRebuild: () -> Unit,
) {
    val view: View = inflater.inflate(R.layout.screen_recovery, parent, false)

    init {
        view.findViewById<HoldButton>(R.id.recovery_button).apply {
            onActivated = onRebuild
        }
    }
}
