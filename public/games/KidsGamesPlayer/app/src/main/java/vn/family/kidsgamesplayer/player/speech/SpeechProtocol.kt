package vn.family.kidsgamesplayer.player.speech

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import kotlin.math.floor

/**
 * Wire format of the speech channel, version 1 (DECISIONS §22). Every message is one JSON
 * string in pure ASCII (other characters as \uXXXX escapes: WebView 69 corrupts Latin-1-only
 * strings on a WebMessagePort). Page → app: hello / speak / cancel; app → page: voices /
 * start / end / error / boundary. Anything the page sends is untrusted: size-checked before
 * parsing, validated, clamped, and unknown operations are dropped.
 */
object SpeechProtocol {
    const val CHANNEL = "kgp-speech-v1"
    const val VERSION = 1
    /** 1000 characters of escaped text (6 ASCII chars each at worst) plus the other fields. */
    const val MAX_MESSAGE_CHARS = 8192
    const val MAX_TEXT_CHARS = 1000
    private const val MAX_VOICE_URI_CHARS = 256
    private val LANG = Regex("^[A-Za-z]{2,8}([-_][A-Za-z0-9]{1,8}){0,4}$")

    /** Standard SpeechSynthesisErrorEvent codes the app may send. */
    val ERRORS = setOf(
        "canceled", "interrupted", "audio-busy", "audio-hardware", "network", "synthesis-unavailable",
        "synthesis-failed", "language-unavailable", "voice-unavailable", "text-too-long", "invalid-argument", "not-allowed",
    )

    sealed interface Command {
        data class Hello(val version: Int) : Command
        data class Speak(
            val id: Int,
            val text: String,
            val lang: String,
            val voiceURI: String,
            val rate: Float,
            val pitch: Float,
            val volume: Float,
            val truncated: Boolean,
        ) : Command
        data object Cancel : Command
        data class Invalid(val reason: String) : Command
    }

    fun parse(raw: String?): Command {
        if (raw == null) return Command.Invalid("not a string")
        if (raw.length > MAX_MESSAGE_CHARS) return Command.Invalid("message too large (${raw.length} chars)")
        val o = try {
            JSONObject(raw)
        } catch (_: JSONException) {
            return Command.Invalid("not a JSON object")
        }
        return when (val op = o.opt("op")) {
            "hello" -> if (o.opt("v") == VERSION) Command.Hello(VERSION) else Command.Invalid("unsupported version")
            "cancel" -> Command.Cancel
            "speak" -> parseSpeak(o)
            is String -> Command.Invalid("unknown op " + op.take(20))
            else -> Command.Invalid("missing op")
        }
    }

    private fun parseSpeak(o: JSONObject): Command {
        val idNum = (o.opt("id") as? Number)?.toDouble() ?: return Command.Invalid("speak without id")
        if (idNum.isNaN() || idNum != floor(idNum) || idNum < 1 || idNum > Int.MAX_VALUE) return Command.Invalid("bad id")
        val rawText = when (val t = o.opt("text")) {
            null, JSONObject.NULL -> ""
            is String -> t
            else -> return Command.Invalid("text is not a string")
        }
        val (text, truncated) = cleanText(rawText)
        val lang = (o.opt("lang") as? String)?.trim()?.takeIf { LANG.matches(it) } ?: ""
        val voice = (o.opt("voice") as? String)?.takeIf { it.length <= MAX_VOICE_URI_CHARS } ?: ""
        return Command.Speak(
            id = idNum.toInt(),
            text = text,
            lang = lang,
            voiceURI = voice,
            rate = number(o.opt("rate"), 1f).coerceIn(0.25f, 3f),
            pitch = number(o.opt("pitch"), 1f).coerceIn(0.5f, 2f),
            volume = number(o.opt("volume"), 1f).coerceIn(0f, 1f),
            truncated = truncated,
        )
    }

    /**
     * Control characters become spaces (character positions stay the same, so boundary
     * offsets still match the page's text); the result is cut to [MAX_TEXT_CHARS] without
     * splitting a surrogate pair.
     */
    fun cleanText(raw: String): Pair<String, Boolean> {
        var end = raw.length
        var truncated = false
        if (end > MAX_TEXT_CHARS) {
            end = MAX_TEXT_CHARS
            if (Character.isHighSurrogate(raw[end - 1])) end--
            truncated = true
        }
        val sb = StringBuilder(end)
        for (i in 0 until end) {
            val c = raw[i]
            sb.append(if (c.code < 0x20 || c.code in 0x7F..0x9F) ' ' else c)
        }
        return sb.toString() to truncated
    }

    private fun number(v: Any?, default: Float): Float {
        val f = (v as? Number)?.toFloat() ?: return default
        return if (f.isNaN() || f.isInfinite()) default else f
    }

    // ---- app → page -------------------------------------------------------------------------

    fun voices(list: List<VoiceInfo>): String {
        val arr = JSONArray()
        list.forEach { v ->
            arr.put(
                JSONObject().put("voiceURI", v.voiceURI).put("name", v.name).put("lang", v.lang)
                    .put("localService", true).put("default", v.isDefault),
            )
        }
        return ascii(JSONObject().put("t", "voices").put("voices", arr).toString())
    }

    fun start(id: Int): String = JSONObject().put("t", "start").put("id", id).toString()

    fun end(id: Int): String = JSONObject().put("t", "end").put("id", id).toString()

    fun error(id: Int, error: String): String =
        JSONObject().put("t", "error").put("id", id).put("error", if (error in ERRORS) error else "synthesis-failed").toString()

    fun boundary(id: Int, charIndex: Int, charLength: Int): String =
        JSONObject().put("t", "boundary").put("id", id).put("name", "word").put("charIndex", charIndex).put("charLength", charLength).toString()

    /** Rewrites a JSON text so it is pure ASCII (non-ASCII only occurs inside string literals). */
    fun ascii(json: String): String {
        if (json.none { it.code > 0x7E }) return json
        val sb = StringBuilder(json.length + 32)
        for (c in json) {
            if (c.code > 0x7E) sb.append("\\u").append(HEX[c.code shr 12 and 15]).append(HEX[c.code shr 8 and 15])
                .append(HEX[c.code shr 4 and 15]).append(HEX[c.code and 15])
            else sb.append(c)
        }
        return sb.toString()
    }

    private const val HEX = "0123456789abcdef"
}
