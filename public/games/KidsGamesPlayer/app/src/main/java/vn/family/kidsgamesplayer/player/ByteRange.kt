package vn.family.kidsgamesplayer.player

/**
 * Single byte-range support (bible §8.4). Multiple ranges are deliberately answered with
 * the full 200 body; malformed headers are ignored as RFC 9110 allows.
 */
sealed interface RangeDecision {
    data object Full : RangeDecision
    data class Partial(val start: Long, val endInclusive: Long) : RangeDecision {
        val length: Long get() = endInclusive - start + 1
    }
    data object Unsatisfiable : RangeDecision
}

object ByteRange {
    private val SPEC = Regex("^(\\d*)-(\\d*)$")

    fun parse(header: String?, length: Long): RangeDecision {
        if (header.isNullOrBlank()) return RangeDecision.Full
        val trimmed = header.trim()
        val eq = trimmed.indexOf('=')
        if (eq <= 0 || !trimmed.substring(0, eq).trim().equals("bytes", ignoreCase = true)) return RangeDecision.Full
        val spec = trimmed.substring(eq + 1).trim()
        if (spec.contains(',')) return RangeDecision.Full
        val m = SPEC.matchEntire(spec) ?: return RangeDecision.Full
        val (a, b) = m.destructured
        if (a.length > 18 || b.length > 18) return RangeDecision.Full
        return when {
            a.isEmpty() && b.isEmpty() -> RangeDecision.Full
            a.isEmpty() -> {
                val suffix = b.toLong()
                if (suffix == 0L || length == 0L) RangeDecision.Unsatisfiable
                else RangeDecision.Partial(maxOf(0L, length - suffix), length - 1)
            }
            else -> {
                val start = a.toLong()
                val end = if (b.isEmpty()) length - 1 else b.toLong()
                when {
                    b.isNotEmpty() && end < start -> RangeDecision.Full
                    start >= length -> RangeDecision.Unsatisfiable
                    else -> RangeDecision.Partial(start, minOf(end, length - 1))
                }
            }
        }
    }
}
