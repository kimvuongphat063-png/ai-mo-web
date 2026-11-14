package vn.family.kidsgamesplayer.ui

import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.FrameLayout
import android.widget.GridLayout
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.content.ContextCompat
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import vn.family.kidsgamesplayer.R
import vn.family.kidsgamesplayer.parent.PinManager

/**
 * Native PIN keypad overlay (bible §12.1). HTML can never draw or drive this view.
 * Verification and hashing run off the main thread.
 */
class PinPad(
    private val container: FrameLayout,
    private val pins: PinManager,
    private val scope: CoroutineScope,
) {
    private enum class Mode { VERIFY, CREATE_FIRST, CREATE_CONFIRM }

    private var root: View? = null
    private var mode = Mode.VERIFY
    private val entered = StringBuilder()
    private var firstPin: String? = null
    private var onSuccess: (() -> Unit)? = null
    private var onCancel: (() -> Unit)? = null
    private var busy = false
    private var countdown: Job? = null

    private lateinit var title: TextView
    private lateinit var message: TextView
    private lateinit var dots: LinearLayout
    private lateinit var keys: GridLayout

    val isShowing: Boolean get() = root != null

    fun showVerify(onSuccess: () -> Unit, onCancel: () -> Unit = {}) {
        show(Mode.VERIFY, onSuccess, onCancel)
        val wait = pins.lockoutRemainingMs()
        if (wait > 0) startLockoutCountdown(wait)
    }

    fun showCreate(onCreated: () -> Unit, onCancel: () -> Unit = {}) {
        firstPin = null
        show(Mode.CREATE_FIRST, onCreated, onCancel)
    }

    /** Back press / lifecycle pause: closes without granting anything. */
    fun cancel() {
        if (!isShowing) return
        val cb = onCancel
        dismiss()
        cb?.invoke()
    }

    private fun show(m: Mode, successCallback: () -> Unit, cancelCallback: () -> Unit) {
        dismiss()
        mode = m
        onSuccess = successCallback
        onCancel = cancelCallback
        entered.clear()
        val view = LayoutInflater.from(container.context).inflate(R.layout.overlay_pin, container, false)
        title = view.findViewById(R.id.pin_title)
        message = view.findViewById(R.id.pin_message)
        dots = view.findViewById(R.id.pin_dots)
        keys = view.findViewById(R.id.pin_keys)
        // Must dismiss the keypad, not just run the caller's callback (the game resumes on it).
        view.findViewById<Button>(R.id.pin_cancel).setOnClickListener { this.cancel() }
        buildDots()
        buildKeys()
        updateTitle()
        container.addView(view)
        root = view
    }

    private fun dismiss() {
        countdown?.cancel()
        countdown = null
        root?.let { container.removeView(it) }
        root = null
        busy = false
        entered.clear()
        onSuccess = null
        onCancel = null
    }

    private fun updateTitle() {
        title.setText(
            when (mode) {
                Mode.VERIFY -> R.string.pin_title_enter
                Mode.CREATE_FIRST -> R.string.pin_title_create
                Mode.CREATE_CONFIRM -> R.string.pin_title_confirm
            },
        )
    }

    private fun buildDots() {
        val ctx = container.context
        val size = (18 * ctx.resources.displayMetrics.density).toInt()
        val margin = (7 * ctx.resources.displayMetrics.density).toInt()
        dots.removeAllViews()
        repeat(6) {
            val dot = ImageView(ctx)
            dot.layoutParams = LinearLayout.LayoutParams(size, size).apply { setMargins(margin, 0, margin, 0) }
            dots.addView(dot)
        }
        renderDots()
    }

    private fun renderDots() {
        for (i in 0 until dots.childCount) {
            (dots.getChildAt(i) as ImageView).setImageResource(
                if (i < entered.length) R.drawable.bg_pin_dot_full else R.drawable.bg_pin_dot_empty,
            )
        }
    }

    private fun buildKeys() {
        val ctx = container.context
        val density = ctx.resources.displayMetrics.density
        val size = (62 * density).toInt()
        val margin = (5 * density).toInt()
        keys.removeAllViews()
        val labels = listOf("1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "<")
        for (label in labels) {
            val lp = GridLayout.LayoutParams().apply {
                width = size
                height = size
                setMargins(margin, margin, margin, margin)
            }
            val v: View = when (label) {
                "" -> View(ctx)
                "<" -> ImageButton(ctx).apply {
                    setImageResource(R.drawable.ic_backspace)
                    setColorFilter(ContextCompat.getColor(ctx, R.color.teal_dark))
                    setBackgroundResource(R.drawable.bg_key)
                    contentDescription = ctx.getString(R.string.cd_backspace)
                    setOnClickListener { onBackspace() }
                }
                else -> TextView(ctx).apply {
                    text = label
                    textSize = 26f
                    gravity = Gravity.CENTER
                    setTextColor(ContextCompat.getColor(ctx, R.color.teal_dark))
                    setBackgroundResource(R.drawable.bg_key)
                    isClickable = true
                    isFocusable = true
                    setOnClickListener { onDigit(label[0]) }
                }
            }
            keys.addView(v, lp)
        }
    }

    private fun setKeysEnabled(enabled: Boolean) {
        for (i in 0 until keys.childCount) keys.getChildAt(i).isEnabled = enabled
        keys.alpha = if (enabled) 1f else 0.4f
    }

    private fun onBackspace() {
        if (busy || entered.isEmpty()) return
        entered.deleteCharAt(entered.length - 1)
        renderDots()
    }

    private fun onDigit(d: Char) {
        if (busy || entered.length >= 6) return
        entered.append(d)
        renderDots()
        if (entered.length == 6) submit(entered.toString())
    }

    private fun submit(pin: String) {
        when (mode) {
            Mode.VERIFY -> verify(pin)
            Mode.CREATE_FIRST -> {
                when (pins.validateNewPin(pin)) {
                    null -> {
                        firstPin = pin
                        mode = Mode.CREATE_CONFIRM
                        resetEntry(null)
                        updateTitle()
                    }
                    else -> resetEntry(R.string.pin_too_simple)
                }
            }
            Mode.CREATE_CONFIRM -> {
                if (pin != firstPin) {
                    firstPin = null
                    mode = Mode.CREATE_FIRST
                    updateTitle()
                    resetEntry(R.string.pin_mismatch)
                    return
                }
                busy = true
                message.setText(R.string.pin_checking)
                scope.launch {
                    val ok = withContext(Dispatchers.Default) { runCatching { pins.setPin(pin) }.isSuccess }
                    if (!isShowing) return@launch
                    busy = false
                    if (ok) {
                        val cb = onSuccess
                        dismiss()
                        cb?.invoke()
                    } else {
                        resetEntry(R.string.pin_wrong)
                    }
                }
            }
        }
    }

    private fun verify(pin: String) {
        busy = true
        message.setText(R.string.pin_checking)
        scope.launch {
            val result = withContext(Dispatchers.Default) { pins.verify(pin) }
            if (!isShowing) return@launch
            busy = false
            when (result) {
                PinManager.VerifyResult.Ok -> {
                    val cb = onSuccess
                    dismiss()
                    cb?.invoke()
                }
                is PinManager.VerifyResult.Wrong -> {
                    resetEntry(R.string.pin_wrong)
                    shake()
                    if (result.lockoutMs > 0) startLockoutCountdown(result.lockoutMs)
                }
                is PinManager.VerifyResult.LockedOut -> {
                    resetEntry(null)
                    startLockoutCountdown(result.remainingMs)
                }
                PinManager.VerifyResult.NotSet -> {
                    val cb = onSuccess
                    dismiss()
                    cb?.invoke()
                }
            }
        }
    }

    private fun resetEntry(messageRes: Int?) {
        entered.clear()
        renderDots()
        if (messageRes == null) message.text = "" else message.setText(messageRes)
    }

    private fun shake() {
        root?.animate()?.translationX(18f)?.setDuration(60)?.withEndAction {
            root?.animate()?.translationX(-18f)?.setDuration(60)?.withEndAction {
                root?.animate()?.translationX(0f)?.setDuration(60)
            }
        }
    }

    private fun startLockoutCountdown(ms: Long) {
        countdown?.cancel()
        setKeysEnabled(false)
        countdown = scope.launch {
            var left = ms
            while (left > 0 && isShowing) {
                val seconds = ((left + 999) / 1000).toInt()
                message.text = container.context.resources.getQuantityString(R.plurals.pin_locked, seconds, seconds)
                delay(1000)
                left = pins.lockoutRemainingMs()
            }
            if (isShowing) {
                setKeysEnabled(true)
                message.text = ""
            }
        }
    }
}
