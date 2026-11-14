package vn.family.kidsgamesplayer.parent

import java.io.File
import java.io.IOException
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec
import org.json.JSONObject
import vn.family.kidsgamesplayer.core.AndroidAtomicBytesFile
import vn.family.kidsgamesplayer.core.AtomicBytesFile
import vn.family.kidsgamesplayer.core.Hashing

/**
 * Parent PIN (bible §12.1): 6 digits, random salt, PBKDF2-HMAC-SHA256, never plaintext.
 * Failed attempts are persisted so killing the app does not reset the throttle.
 * Lockout timing uses a monotonic clock ([elapsed]); a clock reset (reboot) is clamped.
 */
class PinManager(
    private val file: File,
    private val elapsed: () -> Long,
    private val iterations: Int = DEFAULT_ITERATIONS,
    private val random: SecureRandom = SecureRandom(),
    private val policy: ThrottlePolicy = ThrottlePolicy(),
    factory: AtomicBytesFile.Factory = AndroidAtomicBytesFile.FACTORY,
) {
    data class ThrottlePolicy(
        val freeAttempts: Int = 5,
        val baseLockoutMs: Long = 30_000L,
        val maxLockoutMs: Long = 15 * 60_000L,
    ) {
        fun lockoutFor(failures: Int): Long {
            if (failures < freeAttempts) return 0L
            val exp = (failures - freeAttempts).coerceAtMost(10)
            return (baseLockoutMs shl exp).coerceAtMost(maxLockoutMs)
        }
    }

    sealed interface VerifyResult {
        data object Ok : VerifyResult
        data class Wrong(val failures: Int, val lockoutMs: Long) : VerifyResult
        data class LockedOut(val remainingMs: Long) : VerifyResult
        data object NotSet : VerifyResult
    }

    enum class PinProblem { NOT_SIX_DIGITS, TOO_SIMPLE }

    private data class Stored(
        val iterations: Int,
        val salt: String,
        val hash: String,
        val failures: Int,
        val lockoutUntil: Long,
    )

    private val atomic = factory.create(file)
    private val lock = Any()

    fun isPinSet(): Boolean = synchronized(lock) { read() != null }

    fun validateNewPin(pin: String): PinProblem? {
        if (pin.length != 6 || pin.any { it !in '0'..'9' }) return PinProblem.NOT_SIX_DIGITS
        if (pin.toSet().size == 1) return PinProblem.TOO_SIMPLE
        val ascending = "0123456789012345"
        val descending = "9876543210987654"
        if (ascending.contains(pin) || descending.contains(pin)) return PinProblem.TOO_SIMPLE
        return null
    }

    @Throws(IOException::class)
    fun setPin(pin: String) {
        require(validateNewPin(pin) == null) { "invalid pin" }
        val salt = ByteArray(16).also { random.nextBytes(it) }
        val hash = derive(pin, salt, iterations)
        synchronized(lock) { write(Stored(iterations, Hashing.hex(salt), Hashing.hex(hash), 0, 0L)) }
    }

    fun lockoutRemainingMs(): Long = synchronized(lock) {
        val s = read() ?: return 0L
        remaining(s)
    }

    /** CPU-heavy (PBKDF2); call off the main thread. */
    fun verify(pin: String): VerifyResult {
        val stored = synchronized(lock) { read() } ?: return VerifyResult.NotSet
        val wait = remaining(stored)
        if (wait > 0) return VerifyResult.LockedOut(wait)
        val candidate = derive(pin, unhex(stored.salt), stored.iterations)
        val ok = MessageDigest.isEqual(candidate, unhex(stored.hash))
        return synchronized(lock) {
            val current = read() ?: return VerifyResult.NotSet
            if (ok) {
                if (current.failures != 0 || current.lockoutUntil != 0L) write(current.copy(failures = 0, lockoutUntil = 0L))
                VerifyResult.Ok
            } else {
                val failures = current.failures + 1
                val lockout = policy.lockoutFor(failures)
                write(current.copy(failures = failures, lockoutUntil = if (lockout > 0) elapsed() + lockout else 0L))
                VerifyResult.Wrong(failures, lockout)
            }
        }
    }

    private fun remaining(s: Stored): Long {
        if (s.lockoutUntil == 0L) return 0L
        val now = elapsed()
        val maxWait = policy.lockoutFor(s.failures)
        val left = s.lockoutUntil - now
        // After a reboot the monotonic clock restarts; never wait longer than the policy allows.
        return when {
            left <= 0 -> 0L
            left > maxWait -> {
                write(s.copy(lockoutUntil = now + maxWait))
                maxWait
            }
            else -> left
        }
    }

    private fun read(): Stored? = try {
        if (!atomic.exists()) null
        else {
            val o = JSONObject(atomic.read().toString(Charsets.UTF_8))
            Stored(
                iterations = o.getInt("iterations"),
                salt = o.getString("salt"),
                hash = o.getString("hash"),
                failures = o.optInt("failures", 0),
                lockoutUntil = o.optLong("lockoutUntil", 0L),
            )
        }
    } catch (_: Exception) {
        null
    }

    private fun write(s: Stored) {
        val o = JSONObject()
            .put("version", 1)
            .put("algorithm", ALGORITHM)
            .put("iterations", s.iterations)
            .put("salt", s.salt)
            .put("hash", s.hash)
            .put("failures", s.failures)
            .put("lockoutUntil", s.lockoutUntil)
        atomic.write(o.toString().toByteArray(Charsets.UTF_8))
    }

    companion object {
        const val ALGORITHM = "PBKDF2WithHmacSHA256"
        /** Centralized cost parameter; measured on the test devices (see BUILD_REPORT). */
        const val DEFAULT_ITERATIONS = 120_000

        fun derive(pin: String, salt: ByteArray, iterations: Int): ByteArray {
            val spec = PBEKeySpec(pin.toCharArray(), salt, iterations, 256)
            try {
                return SecretKeyFactory.getInstance(ALGORITHM).generateSecret(spec).encoded
            } finally {
                spec.clearPassword()
            }
        }

        private fun unhex(s: String): ByteArray = ByteArray(s.length / 2) { i ->
            ((Character.digit(s[i * 2], 16) shl 4) or Character.digit(s[i * 2 + 1], 16)).toByte()
        }
    }
}

/** In-memory parent authentication; never persisted, never exposed to web content. */
class ParentAuth(private val elapsed: () -> Long, private val idleTimeoutMs: Long = 3 * 60_000L) {
    @Volatile private var grantedAt: Long = -1L

    fun grant() {
        grantedAt = elapsed()
    }

    fun revoke() {
        grantedAt = -1L
    }

    fun isValid(): Boolean = grantedAt >= 0 && elapsed() - grantedAt < idleTimeoutMs

    /** Extends the idle window on parent interaction. */
    fun touch() {
        if (isValid()) grantedAt = elapsed()
    }
}
