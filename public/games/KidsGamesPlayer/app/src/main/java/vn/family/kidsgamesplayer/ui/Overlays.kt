package vn.family.kidsgamesplayer.ui

import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import android.widget.TextView
import vn.family.kidsgamesplayer.R

/** In-window confirmation card (keeps immersive mode, unlike a Dialog window). */
class ConfirmOverlay(private val container: FrameLayout) {
    private var root: View? = null

    val isShowing: Boolean get() = root != null

    fun show(title: String, body: String, okLabel: String? = null, onOk: () -> Unit) {
        dismiss()
        val view = LayoutInflater.from(container.context).inflate(R.layout.overlay_confirm, container, false)
        view.findViewById<TextView>(R.id.confirm_title).text = title
        view.findViewById<TextView>(R.id.confirm_body).text = body
        val ok = view.findViewById<Button>(R.id.confirm_ok)
        okLabel?.let { ok.text = it }
        ok.setOnClickListener {
            dismiss()
            onOk()
        }
        view.findViewById<Button>(R.id.confirm_cancel).setOnClickListener { dismiss() }
        container.addView(view)
        root = view
    }

    fun dismiss() {
        root?.let { container.removeView(it) }
        root = null
    }
}
