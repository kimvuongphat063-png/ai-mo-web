package vn.family.kidsgamesplayer.core

import java.io.File
import java.text.SimpleDateFormat
import java.util.ArrayDeque
import java.util.Date
import java.util.Locale

/**
 * Bounded diagnostics ring buffer (bible §14.2): at most [maxEvents] events and roughly
 * [maxBytes] of text. Never record PINs, hashes, salts, keys or game source code here.
 * Text coming from games (console messages, URLs) is untrusted: it is truncated and
 * stripped of control characters before storage.
 */
class Diagnostics(
    private val file: File?,
    private val maxEvents: Int = 300,
    private val maxBytes: Int = 1024 * 1024,
    private val now: () -> Long = System::currentTimeMillis,
) {
    data class Event(val at: Long, val tag: String, val message: String)

    private val events = ArrayDeque<Event>()
    private var bytes = 0
    private val lock = Any()

    init {
        file?.let { f ->
            runCatching {
                if (f.isFile && f.length() <= maxBytes * 2L) {
                    f.readLines(Charsets.UTF_8).takeLast(maxEvents).forEach { line ->
                        val parts = line.split('\t', limit = 3)
                        if (parts.size == 3) addInternal(Event(parts[0].toLongOrNull() ?: 0L, parts[1], parts[2]))
                    }
                }
            }
        }
    }

    private var lastPersistAt = 0L
    private var dirty = false

    fun log(tag: String, message: String) {
        val event = Event(now(), sanitize(tag, 40), sanitize(message, 500))
        synchronized(lock) {
            addInternal(event)
            dirty = true
            // Throttled persistence keeps a chatty game from hammering storage.
            if (event.at - lastPersistAt >= 2_000L) persist()
        }
    }

    /** Writes pending events; called on lifecycle stop. */
    fun flush() = synchronized(lock) { if (dirty) persist() }

    fun snapshot(): List<Event> = synchronized(lock) { events.toList() }

    fun recent(tagPrefix: String? = null, limit: Int = 30): List<Event> =
        snapshot().filter { tagPrefix == null || it.tag.startsWith(tagPrefix) }.takeLast(limit)

    fun format(event: Event): String {
        val fmt = SimpleDateFormat("MM-dd HH:mm:ss", Locale.US)
        return "${fmt.format(Date(event.at))} [${event.tag}] ${event.message}"
    }

    private fun addInternal(e: Event) {
        events.addLast(e)
        bytes += e.message.length + e.tag.length + 16
        while (events.size > maxEvents || bytes > maxBytes) {
            val old = events.removeFirst()
            bytes -= old.message.length + old.tag.length + 16
        }
    }

    private fun persist() {
        val f = file ?: return
        lastPersistAt = now()
        dirty = false
        runCatching {
            f.parentFile?.mkdirs()
            val tmp = File(f.path + ".tmp")
            tmp.bufferedWriter(Charsets.UTF_8).use { w ->
                events.forEach { w.append("${it.at}\t${it.tag}\t${it.message}\n") }
            }
            if (!tmp.renameTo(f)) {
                f.delete()
                tmp.renameTo(f)
            }
        }
    }

    companion object {
        fun sanitize(text: String, max: Int): String {
            val sb = StringBuilder(minOf(text.length, max))
            for (ch in text) {
                if (sb.length >= max) {
                    sb.append('…')
                    break
                }
                sb.append(if (ch.code < 0x20 || ch.code == 0x7F) ' ' else ch)
            }
            return sb.toString()
        }

        /** Shortens a URL for display: scheme://host/path, no query, at most [max] chars. */
        fun shortUrl(url: String, max: Int = 120): String {
            val noQuery = url.substringBefore('?').substringBefore('#')
            return sanitize(noQuery, max)
        }
    }
}
