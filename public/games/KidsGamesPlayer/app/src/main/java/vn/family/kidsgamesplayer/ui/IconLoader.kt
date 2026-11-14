package vn.family.kidsgamesplayer.ui

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.ColorFilter
import android.graphics.Paint
import android.graphics.PixelFormat
import android.graphics.RectF
import android.graphics.drawable.Drawable
import android.util.LruCache
import android.widget.ImageView
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Semaphore
import kotlinx.coroutines.sync.withPermit
import kotlinx.coroutines.withContext
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.core.PathPolicy
import vn.family.kidsgamesplayer.importer.RevisionStore

/**
 * Decodes game icons from the immutable revision with bounds-first downsampling
 * (bible §6.6, §14.3) and a small memory cache. Missing/broken icons get a native placeholder.
 */
class IconLoader(
    private val revisions: RevisionStore,
    private val scope: CoroutineScope,
    private val maxPixels: Int = 4096,
) {
    private val cache = object : LruCache<String, Bitmap>(16 * 1024 * 1024) {
        override fun sizeOf(key: String, value: Bitmap): Int = value.allocationByteCount
    }
    private val decodeSlots = Semaphore(3)

    fun load(record: GameRecord, sizePx: Int, target: ImageView) {
        val rev = record.activeRevision
        val iconPath = record.iconPath
        val key = "${record.internalGameId}/$rev/$iconPath/$sizePx"
        target.tag = key
        cache.get(key)?.let {
            target.setImageBitmap(it)
            return
        }
        target.setImageDrawable(PlaceholderIconDrawable(record.title))
        if (rev == null || iconPath == null) return
        scope.launch {
            val bmp = decodeSlots.withPermit {
                withContext(Dispatchers.IO) { decode(record.internalGameId, rev, iconPath, sizePx) }
            }
            if (bmp != null) {
                cache.put(key, bmp)
                if (target.tag == key) target.setImageBitmap(bmp)
            }
        }
    }

    private fun decode(gameId: String, rev: String, iconPath: String, sizePx: Int): Bitmap? = runCatching {
        val file = PathPolicy.resolveContained(revisions.revisionRoot(gameId, rev), iconPath) ?: return null
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) return null
        if (bounds.outWidth > maxPixels || bounds.outHeight > maxPixels) return null
        var sample = 1
        while (bounds.outWidth / (sample * 2) >= sizePx && bounds.outHeight / (sample * 2) >= sizePx) sample *= 2
        BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply { inSampleSize = sample })
    }.getOrNull()
}

/** Rounded tile with the first letter of the title; never crashes the menu for a bad icon. */
class PlaceholderIconDrawable(title: String) : Drawable() {
    private val letter = title.trim().firstOrNull()?.uppercase() ?: "?"
    private val bg = Paint(Paint.ANTI_ALIAS_FLAG).apply { color = PALETTE[(title.hashCode() and 0x7fffffff) % PALETTE.size] }
    private val text = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = 0xFFFFFFFF.toInt()
        textAlign = Paint.Align.CENTER
        isFakeBoldText = true
    }
    private val rect = RectF()

    override fun draw(canvas: Canvas) {
        val b = bounds
        rect.set(b)
        val r = b.width() * 0.22f
        canvas.drawRoundRect(rect, r, r, bg)
        text.textSize = b.height() * 0.5f
        val y = b.exactCenterY() - (text.descent() + text.ascent()) / 2
        canvas.drawText(letter, b.exactCenterX(), y, text)
    }

    override fun setAlpha(alpha: Int) {
        bg.alpha = alpha
        text.alpha = alpha
    }

    override fun setColorFilter(colorFilter: ColorFilter?) {
        bg.colorFilter = colorFilter
    }

    @Deprecated("Deprecated in Java")
    override fun getOpacity(): Int = PixelFormat.TRANSLUCENT

    companion object {
        private val PALETTE = intArrayOf(0xFF227C78.toInt(), 0xFFED7C6D.toInt(), 0xFFE0A030.toInt(), 0xFF5B8DD6.toInt(), 0xFF8E6CC9.toInt())
    }
}
