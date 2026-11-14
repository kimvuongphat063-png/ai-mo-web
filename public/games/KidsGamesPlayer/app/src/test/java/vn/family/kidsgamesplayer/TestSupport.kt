package vn.family.kidsgamesplayer

import org.json.JSONArray
import org.json.JSONObject
import vn.family.kidsgamesplayer.core.Hashing
import java.io.File
import java.nio.file.Files

/** Builds game folders on disk with real bytes and real hashes for unit tests. */
class GameFolderBuilder(val dir: File) {
    init {
        dir.mkdirs()
    }

    fun file(path: String, content: String): GameFolderBuilder = bytes(path, content.toByteArray(Charsets.UTF_8))

    fun bytes(path: String, content: ByteArray): GameFolderBuilder {
        val f = File(dir, path)
        f.parentFile?.mkdirs()
        f.writeBytes(content)
        return this
    }

    fun delete(path: String): GameFolderBuilder {
        File(dir, path).delete()
        return this
    }

    /** Writes game.json; with [inventory] true, lists every current file (except game.json) with real hashes. */
    fun manifest(id: String?, title: String = "Test", version: String = "1.0.0", inventory: Boolean, extra: (JSONObject) -> Unit = {}): GameFolderBuilder {
        val o = JSONObject().put("schemaVersion", 1).put("title", title).put("version", version)
            .put("entry", "index.html").put("icon", "icon.png").put("playerApiVersion", 1)
        if (id != null) o.put("id", id)
        if (inventory) {
            val arr = JSONArray()
            dir.walkTopDown().filter { it.isFile && it.name != "game.json" }.sortedBy { it.path }.forEach { f ->
                val rel = f.relativeTo(dir).invariantSeparatorsPath
                val b = f.readBytes()
                arr.put(JSONObject().put("path", rel).put("size", b.size).put("sha256", Hashing.sha256Hex(b)))
            }
            o.put("files", arr)
        }
        extra(o)
        File(dir, "game.json").writeText(o.toString(1), Charsets.UTF_8)
        return this
    }

    companion object {
        val PNG_1X1: ByteArray = java.util.Base64.getDecoder().decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        )

        fun simpleGame(dir: File, html: String = "<!doctype html><title>t</title><script src=\"game.js\"></script>"): GameFolderBuilder =
            GameFolderBuilder(dir).file("index.html", html).file("game.js", "console.log(1)").bytes("icon.png", PNG_1X1)
    }
}

fun tempDir(prefix: String = "kgp"): File = Files.createTempDirectory(prefix).toFile()
