package vn.family.kidsgamesplayer.catalog

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import org.json.JSONTokener

/** JSON (de)serialization for the catalog. Unknown fields are ignored; bad records are quarantined. */
object CatalogCodec {

    class UnreadableCatalog(message: String) : Exception(message)

    data class Decoded(val catalog: Catalog, val quarantinedNow: Int)

    fun encode(c: Catalog): String {
        val root = JSONObject()
        root.put("schemaVersion", Catalog.SCHEMA_VERSION)
        root.putOpt("selectedSourceUri", c.selectedSourceUri)
        root.putOpt("lastSuccessfulScan", c.lastSuccessfulScan)
        root.put("games", JSONArray().apply { c.games.forEach { put(encodeGame(it)) } })
        root.put("issues", JSONArray().apply { c.issues.forEach { put(encodeIssue(it)) } })
        root.put("pendingOriginCleanups", JSONArray(c.pendingOriginCleanups))
        root.put("quarantine", JSONArray(c.quarantine))
        return root.toString(1)
    }

    fun decode(text: String): Decoded {
        val root = try {
            JSONTokener(text).nextValue() as? JSONObject ?: throw UnreadableCatalog("root not object")
        } catch (e: JSONException) {
            throw UnreadableCatalog(e.message ?: "json")
        }
        val schema = root.optInt("schemaVersion", -1)
        if (schema < 1) throw UnreadableCatalog("schemaVersion=$schema")
        if (schema > Catalog.SCHEMA_VERSION) throw UnreadableCatalog("newer schema $schema")
        // Migration hook: schema 1 is current. Future migrations must keep ids, origin tokens,
        // hidden flags and the source grant (bible §7.2).
        val quarantine = ArrayList<String>()
        root.optJSONArray("quarantine")?.let { arr -> for (i in 0 until arr.length()) arr.optString(i, null)?.let(quarantine::add) }
        var quarantinedNow = 0
        val games = ArrayList<GameRecord>()
        val seenIds = HashSet<String>()
        root.optJSONArray("games")?.let { arr ->
            for (i in 0 until arr.length()) {
                val raw = arr.opt(i)
                val record = (raw as? JSONObject)?.let { runCatching { decodeGame(it) }.getOrNull() }
                if (record == null || !seenIds.add(record.internalGameId)) {
                    quarantine += raw.toString().take(64 * 1024)
                    quarantinedNow++
                } else {
                    games += record
                }
            }
        }
        val issues = ArrayList<SourceIssue>()
        root.optJSONArray("issues")?.let { arr ->
            for (i in 0 until arr.length()) (arr.opt(i) as? JSONObject)?.let { o ->
                runCatching { decodeIssue(o) }.getOrNull()?.let(issues::add)
            }
        }
        val cleanups = ArrayList<String>()
        root.optJSONArray("pendingOriginCleanups")?.let { arr ->
            for (i in 0 until arr.length()) arr.optString(i, null)?.let(cleanups::add)
        }
        return Decoded(
            Catalog(
                schemaVersion = Catalog.SCHEMA_VERSION,
                selectedSourceUri = root.optStringOrNull("selectedSourceUri"),
                lastSuccessfulScan = root.optLongOrNull("lastSuccessfulScan"),
                games = games,
                issues = issues,
                pendingOriginCleanups = cleanups,
                quarantine = quarantine.takeLast(50),
            ),
            quarantinedNow,
        )
    }

    fun encodeGame(g: GameRecord): JSONObject = JSONObject().apply {
        put("internalGameId", g.internalGameId)
        put("logicalKey", g.logicalKey)
        putOpt("manifestId", g.manifestId)
        putOpt("sourceDirectoryUri", g.sourceDirectoryUri)
        put("folderDisplayName", g.folderDisplayName)
        put("title", g.title)
        putOpt("versionLabel", g.versionLabel)
        putOpt("sortOrder", g.sortOrder)
        put("storageOriginToken", g.storageOriginToken)
        putOpt("activeRevision", g.activeRevision)
        putOpt("previousRevision", g.previousRevision)
        put("validationLevel", g.validationLevel.wire)
        put("sourceState", g.sourceState.wire)
        put("hidden", g.hidden)
        putOpt("lastPlayedAt", g.lastPlayedAt)
        putOpt("lastImportAt", g.lastImportAt)
        putOpt("lastErrorCode", g.lastErrorCode)
        putOpt("lastErrorDetail", g.lastErrorDetail)
        putOpt("playerApiVersion", g.playerApiVersion)
        put("importedByteCount", g.importedByteCount)
        putOpt("backgroundColor", g.backgroundColor)
        put("builtin", g.builtin)
        putOpt("iconPath", g.iconPath)
        putOpt("manifestSha256", g.manifestSha256)
    }

    fun decodeGame(o: JSONObject): GameRecord {
        val token = o.getString("storageOriginToken")
        require(vn.family.kidsgamesplayer.core.Ids.TOKEN_REGEX.matches(token)) { "bad token" }
        return GameRecord(
            internalGameId = o.getString("internalGameId").also { require(it.isNotBlank()) },
            logicalKey = o.getString("logicalKey"),
            manifestId = o.optStringOrNull("manifestId"),
            sourceDirectoryUri = o.optStringOrNull("sourceDirectoryUri"),
            folderDisplayName = o.optString("folderDisplayName", ""),
            title = o.optString("title", ""),
            versionLabel = o.optStringOrNull("versionLabel"),
            sortOrder = o.optLongOrNull("sortOrder")?.toInt(),
            storageOriginToken = token,
            activeRevision = o.optStringOrNull("activeRevision"),
            previousRevision = o.optStringOrNull("previousRevision"),
            validationLevel = ValidationLevel.fromWire(o.optStringOrNull("validationLevel")),
            sourceState = SourceState.fromWire(o.optStringOrNull("sourceState")),
            hidden = o.optBoolean("hidden", false),
            lastPlayedAt = o.optLongOrNull("lastPlayedAt"),
            lastImportAt = o.optLongOrNull("lastImportAt"),
            lastErrorCode = o.optStringOrNull("lastErrorCode"),
            lastErrorDetail = o.optStringOrNull("lastErrorDetail"),
            playerApiVersion = o.optLongOrNull("playerApiVersion")?.toInt(),
            importedByteCount = o.optLong("importedByteCount", 0L),
            backgroundColor = o.optStringOrNull("backgroundColor"),
            builtin = o.optBoolean("builtin", false),
            iconPath = o.optStringOrNull("iconPath"),
            manifestSha256 = o.optStringOrNull("manifestSha256"),
        )
    }

    private fun encodeIssue(i: SourceIssue) = JSONObject().apply {
        put("folderName", i.folderName)
        putOpt("logicalKey", i.logicalKey)
        put("code", i.code)
        put("detail", i.detail)
        put("at", i.at)
        put("attempts", i.attempts)
        put("nextRetryAt", i.nextRetryAt)
        putOpt("signature", i.signature)
    }

    private fun decodeIssue(o: JSONObject) = SourceIssue(
        folderName = o.getString("folderName"),
        logicalKey = o.optStringOrNull("logicalKey"),
        code = o.getString("code"),
        detail = o.optString("detail", ""),
        at = o.optLong("at", 0L),
        attempts = o.optInt("attempts", 0),
        nextRetryAt = o.optLong("nextRetryAt", 0L),
        signature = o.optStringOrNull("signature"),
    )

    private fun JSONObject.optStringOrNull(key: String): String? =
        if (has(key) && !isNull(key)) (opt(key) as? String) else null

    private fun JSONObject.optLongOrNull(key: String): Long? =
        if (has(key) && !isNull(key)) (opt(key) as? Number)?.toLong() else null
}
