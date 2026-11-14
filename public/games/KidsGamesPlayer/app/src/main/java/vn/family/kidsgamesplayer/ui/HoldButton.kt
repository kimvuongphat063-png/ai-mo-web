package vn.family.kidsgamesplayer.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.os.SystemClock
import android.util.AttributeSet
import android.view.MotionEvent
import androidx.appcompat.widget.AppCompatTextView

/**
 * Button that activates only after being held for [holdDurationMs] (bible §4.2). A short tap
 * just reports [onShortPress] so the UI can explain the gesture; there is no hidden bypass.
 */
class HoldButton @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
) : AppCompatTextView(context, attrs) {

    var holdDurationMs: Long = 2_000L
    var onActivated: (() -> Unit)? = null
    var onShortPress: (() -> Unit)? = null
    var centerIcon: Drawable? = null
        set(value) {
            field = value
            invalidate()
        }

    private var downAt = 0L
    private var holding = false
    private val progressPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = 0x66FFFFFF }
    private val ringPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        style = Paint.Style.STROKE
        strokeWidth = 5f * resources.displayMetrics.density
        color = 0xFFF5B84B.toInt()
        strokeCap = Paint.Cap.ROUND
    }
    private val rect = RectF()

    private val ticker = object : Runnable {
        override fun run() {
            if (!holding) return
            invalidate()
            if (SystemClock.uptimeMillis() - downAt >= holdDurationMs) {
                holding = false
                isPressed = false
                invalidate()
                onActivated?.invoke()
            } else {
                postOnAnimation(this)
            }
        }
    }

    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (!isEnabled) return false
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                holding = true
                downAt = SystemClock.uptimeMillis()
                isPressed = true
                postOnAnimation(ticker)
            }
            MotionEvent.ACTION_MOVE -> {
                val slop = 24 * resources.displayMetrics.density
                if (event.x < -slop || event.y < -slop || event.x > width + slop || event.y > height + slop) cancelHold()
            }
            MotionEvent.ACTION_UP -> {
                if (holding) {
                    cancelHold()
                    performClick()
                }
            }
            MotionEvent.ACTION_CANCEL -> cancelHold()
        }
        return true
    }

    override fun performClick(): Boolean {
        super.performClick()
        onShortPress?.invoke()
        return true
    }

    private fun cancelHold() {
        holding = false
        isPressed = false
        removeCallbacks(ticker)
        invalidate()
    }

    override fun onDetachedFromWindow() {
        cancelHold()
        super.onDetachedFromWindow()
    }

    override fun onDraw(canvas: Canvas) {
        val progress = if (holding) ((SystemClock.uptimeMillis() - downAt).toFloat() / holdDurationMs).coerceIn(0f, 1f) else 0f
        val round = kotlin.math.abs(width - height) < height / 4
        if (progress > 0f) {
            if (round) {
                val inset = ringPaint.strokeWidth
                rect.set(inset, inset, width - inset, height - inset)
                canvas.drawArc(rect, -90f, 360f * progress, false, ringPaint)
            } else {
                val r = height / 2f
                rect.set(0f, 0f, width * progress, height.toFloat())
                canvas.drawRoundRect(rect, r, r, progressPaint)
            }
        }
        centerIcon?.let { icon ->
            val size = (minOf(width, height) * 0.45f).toInt()
            val left = (width - size) / 2
            val top = (height - size) / 2
            icon.setBounds(left, top, left + size, top + size)
            icon.draw(canvas)
        }
        super.onDraw(canvas)
    }
}
