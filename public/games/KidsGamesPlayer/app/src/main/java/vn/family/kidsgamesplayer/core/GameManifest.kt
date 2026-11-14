package vn.family.kidsgamesplayer.core

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import org.json.JSONTokener

data class InventoryEntry(val path: String, val size: Long, val sha256: String)

/**
 * Parsed `game.json` (bible §5.2–5.3). `files == null` means a basic package
 * (field missing or empty array); a non-empty list means a verified package.
 */
data class GameManifest(
    val schemaVersion: Int,
    val id: String?,
    val title: String?,
    val version: String?,
    val icon: String,
    val playerApiVersion: Int?,
    val backgroundColor: String?,
    val sortOrder: Int?,
    val files: List<InventoryEntry>?,
) {
    val isVerified: Boolean get() = files != null

    companion object {
        /** Defaults used for a folder without game.json. */
        fun basicDefaults(): GameManifest = GameManifest(
            schemaVersion = ManifestParser.SUPPORTED_SCHEMA,
            id = null, title = null, version = null, icon = "icon.png",
            playerApiVersion = null, backgroundColor = null, sortOrder = null, files = null,
        )
    }
}

sealed interface ManifestResult {
    data class Ok(val manifest: GameManifest, val warnings: List<String>) : ManifestResult
    data class Error(val code: String, val detail: String) : ManifestResult
}

object ManifestParser {
    private val BOM = Char(0xFEFF).toString()
    const val SUPPORTED_SCHEMA = 1
    const val SUPPORTED_PLAYER_API = 1
    const val MANIFEST_NAME = "game.json"
    const val BUILTIN_PREFIX = "builtin."
    private const val SORT_ORDER_LIMIT = 1_000_000
    private const val VERSION_MAX = 40

    val ID_REGEX = Regex("^[a-z0-9][a-z0-9._-]{2,95}$")
    val SHA256_REGEX = Regex("^[a-f0-9]{64}$")
    private val COLOR_REGEX = Regex("^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")

    fun parse(
        bytes: ByteArray,
        allowBuiltinNamespace: Boolean,
        limits: ImportLimits = ImportLimits.DEFAULT,
    ): ManifestResult {
        if (bytes.size > limits.maxManifestBytes) {
            return ManifestResult.Error(ErrorCodes.MANIFEST_TOO_LARGE, "${bytes.size} bytes")
        }
        val text = try {
            Charsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(bytes)).toString().removePrefix(BOM)
        } catch (_: java.nio.charset.CharacterCodingException) {
            return ManifestResult.Error(ErrorCodes.MANIFEST_INVALID_JSON, "not UTF-8")
        }
        val root = try {
            val value = JSONTokener(text).nextValue()
            value as? JSONObject ?: return ManifestResult.Error(ErrorCodes.MANIFEST_INVALID_JSON, "root is not an object")
        } catch (e: JSONException) {
            return ManifestResult.Error(ErrorCodes.MANIFEST_INVALID_JSON, e.message?.take(160) ?: "parse error")
        }
        val warnings = mutableListOf<String>()

        val schema = if (root.has("schemaVersion")) {
            integerOf(root.opt("schemaVersion"))?.toInt()
                ?: return ManifestResult.Error(ErrorCodes.MANIFEST_INVALID_FIELD, "schemaVersion")
        } else {
            warnings += "schemaVersion missing; assuming 1"
            SUPPORTED_SCHEMA
        }
        if (schema != SUPPORTED_SCHEMA) {
            return ManifestResult.Error(ErrorCodes.MANIFEST_UNSUPPORTED_SCHEMA, "schemaVersion=$schema")
        }

        val id = if (root.has("id") && !root.isNull("id")) {
            val raw = root.opt("id") as? String
                ?: return ManifestResult.Error(ErrorCodes.MANIFEST_BAD_ID, "id is not a string")
            if (!ID_REGEX.matches(raw)) return ManifestResult.Error(ErrorCodes.MANIFEST_BAD_ID, raw.take(100))
            if (raw.startsWith(BUILTIN_PREFIX) && !allowBuiltinNamespace) {
                return ManifestResult.Error(ErrorCodes.MANIFEST_RESERVED_ID, raw)
            }
            raw
        } else null

        val title = (root.opt("title") as? String)?.trim()?.takeIf { it.isNotEmpty() }?.let {
            val cps = it.codePointCount(0, it.length)
            if (cps > limits.maxTitleCodePoints) {
                warnings += "title truncated"
                it.substring(0, it.offsetByCodePoints(0, limits.maxTitleCodePoints))
            } else it
        }
        val version = (root.opt("version") as? String)?.trim()?.take(VERSION_MAX)?.takeIf { it.isNotEmpty() }

        if (root.has("entry")) {
            val entry = root.opt("entry") as? String
            if (entry != PathPolicy.ENTRY) {
                return ManifestResult.Error(ErrorCodes.MANIFEST_BAD_ENTRY, (entry ?: "non-string").take(100))
            }
        }

        val icon = if (root.has("icon")) {
            val raw = root.opt("icon") as? String
                ?: return ManifestResult.Error(ErrorCodes.MANIFEST_INVALID_FIELD, "icon")
            when (val r = PathPolicy.validateRelative(raw, limits.maxDirectoryDepth)) {
                is PathPolicy.Result.Ok -> r.path
                is PathPolicy.Result.Rejected -> return ManifestResult.Error(ErrorCodes.MANIFEST_BAD_PATH, "icon: ${r.reason}")
            }
        } else "icon.png"

        if (root.has("orientation") && root.opt("orientation") != "landscape") {
            warnings += "orientation ignored; v1 is landscape only"
        }

        val playerApi = if (root.has("playerApiVersion")) {
            val v = integerOf(root.opt("playerApiVersion"))?.toInt()
                ?: return ManifestResult.Error(ErrorCodes.MANIFEST_INVALID_FIELD, "playerApiVersion")
            if (v < 1 || v > SUPPORTED_PLAYER_API) {
                return ManifestResult.Error(ErrorCodes.MANIFEST_UNSUPPORTED_PLAYER_API, "playerApiVersion=$v")
            }
            v
        } else null

        val color = (root.opt("backgroundColor") as? String)?.trim()?.let {
            if (COLOR_REGEX.matches(it)) normalizeColor(it) else {
                warnings += "backgroundColor ignored"
                null
            }
        }

        val sortOrder = if (root.has("sortOrder")) {
            val v = integerOf(root.opt("sortOrder"))
            if (v == null || v < -SORT_ORDER_LIMIT || v > SORT_ORDER_LIMIT) {
                warnings += "sortOrder ignored"
                null
            } else v.toInt()
        } else null

        val files: List<InventoryEntry>? = if (root.has("files") && !root.isNull("files")) {
            val arr = root.opt("files") as? JSONArray
                ?: return ManifestResult.Error(ErrorCodes.MANIFEST_BAD_FILES, "files is not an array")
            if (arr.length() == 0) null else {
                when (val parsed = parseInventory(arr, limits)) {
                    is InventoryParse.Ok -> parsed.entries
                    is InventoryParse.Bad -> return ManifestResult.Error(ErrorCodes.MANIFEST_BAD_FILES, parsed.detail)
                }
            }
        } else null
        if (files == null) warnings += "no inventory; basic validation"

        return ManifestResult.Ok(
            GameManifest(schema, id, title, version, icon, playerApi, color, sortOrder, files),
            warnings,
        )
    }

    private sealed interface InventoryParse {
        data class Ok(val entries: List<InventoryEntry>) : InventoryParse
        data class Bad(val detail: String) : InventoryParse
    }

    private fun parseInventory(arr: JSONArray, limits: ImportLimits): InventoryParse {
        if (arr.length() > limits.maxFilesPerGame) return InventoryParse.Bad("too many files: ${arr.length()}")
        val out = ArrayList<InventoryEntry>(arr.length())
        val seen = HashSet<String>()
        for (i in 0 until arr.length()) {
            val o = arr.opt(i) as? JSONObject ?: return InventoryParse.Bad("files[$i] is not an object")
            val rawPath = o.opt("path") as? String ?: return InventoryParse.Bad("files[$i].path")
            val path = when (val r = PathPolicy.validateRelative(rawPath, limits.maxDirectoryDepth)) {
                is PathPolicy.Result.Ok -> r.path
                is PathPolicy.Result.Rejected -> return InventoryParse.Bad("files[$i].path: ${r.reason}")
            }
            if (path == MANIFEST_NAME) return InventoryParse.Bad("inventory must not list game.json")
            if (!MimeTypes.isSupported(path)) return InventoryParse.Bad("unsupported type: ${path.take(120)}")
            val size = integerOf(o.opt("size"))
            if (size == null || size < 0) return InventoryParse.Bad("files[$i].size")
            if (size > limits.maxBytesPerFile) return InventoryParse.Bad("file too large: ${path.take(120)}")
            val sha = o.opt("sha256") as? String
            if (sha == null || !SHA256_REGEX.matches(sha)) return InventoryParse.Bad("files[$i].sha256")
            if (!seen.add(PathPolicy.collisionKey(path))) return InventoryParse.Bad("duplicate path: ${path.take(120)}")
            out += InventoryEntry(path, size, sha)
        }
        if (out.none { it.path == PathPolicy.ENTRY }) return InventoryParse.Bad("inventory lacks index.html")
        return InventoryParse.Ok(out)
    }

    /** Accepts only JSON integers (no fractions, booleans or strings). */
    private fun integerOf(value: Any?): Long? = when (value) {
        is Int -> value.toLong()
        is Long -> value
        is Short -> value.toLong()
        is Byte -> value.toLong()
        is Double -> if (value % 1.0 == 0.0 && value >= Long.MIN_VALUE.toDouble() && value <= Long.MAX_VALUE.toDouble()) value.toLong() else null
        is Float -> if (value % 1.0f == 0.0f) value.toLong() else null
        is java.math.BigInteger -> if (value.bitLength() < 63) value.toLong() else null
        is java.math.BigDecimal -> try { value.longValueExact() } catch (_: ArithmeticException) { null }
        else -> null
    }

    fun normalizeColor(c: String): String =
        if (c.length == 4) "#" + c.substring(1).map { "$it$it" }.joinToString("").uppercase()
        else c.uppercase()
}
