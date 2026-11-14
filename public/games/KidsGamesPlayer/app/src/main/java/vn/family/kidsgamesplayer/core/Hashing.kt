package vn.family.kidsgamesplayer.core

import java.io.InputStream
import java.io.OutputStream
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID

object Hashing {
    private val HEX = "0123456789abcdef".toCharArray()

    fun hex(bytes: ByteArray): String {
        val out = CharArray(bytes.size * 2)
        bytes.forEachIndexed { i, b ->
            val v = b.toInt() and 0xFF
            out[i * 2] = HEX[v ushr 4]
            out[i * 2 + 1] = HEX[v and 0x0F]
        }
        return String(out)
    }

    fun sha256Hex(bytes: ByteArray): String = hex(MessageDigest.getInstance("SHA-256").digest(bytes))

    fun sha256Hex(text: String): String = sha256Hex(text.toByteArray(Charsets.UTF_8))

    class LimitExceeded(val bytesSoFar: Long) : Exception("byte limit exceeded")

    data class CopyResult(val size: Long, val sha256: String)

    /**
     * Streams [input] to [output] while counting real bytes and computing SHA-256.
     * Throws [LimitExceeded] as soon as more than [maxBytes] have been read, so a
     * provider lying about sizes can never make us store more than the quota.
     */
    fun copyHashing(input: InputStream, output: OutputStream?, maxBytes: Long): CopyResult {
        val digest = MessageDigest.getInstance("SHA-256")
        val buffer = ByteArray(64 * 1024)
        var total = 0L
        while (true) {
            val n = input.read(buffer)
            if (n < 0) break
            total += n
            if (total > maxBytes) throw LimitExceeded(total)
            digest.update(buffer, 0, n)
            output?.write(buffer, 0, n)
        }
        return CopyResult(total, hex(digest.digest()))
    }
}

object Ids {
    private val random = SecureRandom()
    val TOKEN_REGEX = Regex("^[a-f0-9]{32}$")
    val HOST_REGEX = Regex("^g-[a-f0-9]{32}\\.invalid$")

    fun newOriginToken(): String {
        val bytes = ByteArray(16)
        random.nextBytes(bytes)
        return Hashing.hex(bytes)
    }

    fun newInternalGameId(): String = UUID.randomUUID().toString()

    fun newImportId(): String = "imp-" + Hashing.hex(ByteArray(8).also { random.nextBytes(it) })

    fun hostForToken(token: String): String {
        require(TOKEN_REGEX.matches(token)) { "bad origin token" }
        return "g-$token.invalid"
    }

    fun originForToken(token: String): String = "https://" + hostForToken(token)
}
