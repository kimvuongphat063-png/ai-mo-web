package vn.family.kidsgamesplayer.source

import android.content.res.AssetManager
import java.io.FileNotFoundException
import java.io.IOException
import java.io.InputStream

/**
 * Built-in demo games packed into the APK under assets/builtin/. They are imported into
 * snapshots by the same importer as external games — there is no privileged demo path.
 */
class AssetSourceRoot(private val assets: AssetManager, private val base: String = "builtin") : SourceRoot {
    override val rootId: String get() = "builtin"
    override val isBuiltin: Boolean get() = true

    override fun listGameFolders(): List<SourceNode> =
        AssetNode(assets, base, base.substringAfterLast('/'), true).children().filter { it.isDirectory }
}

private class AssetNode(
    private val assets: AssetManager,
    private val path: String,
    override val name: String,
    override val isDirectory: Boolean,
) : SourceNode {
    override val declaredSize: Long get() = -1L
    override val lastModified: Long get() = 0L
    override val location: String get() = "asset:///$path"

    override fun children(): List<SourceNode> {
        val names = assets.list(path) ?: throw IOException("cannot list $path")
        return names.sorted().map { child ->
            val childPath = "$path/$child"
            AssetNode(assets, childPath, child, isAssetDirectory(childPath))
        }
    }

    private fun isAssetDirectory(p: String): Boolean = try {
        assets.open(p).close()
        false
    } catch (_: FileNotFoundException) {
        true
    }

    override fun openStream(): InputStream = assets.open(path, AssetManager.ACCESS_STREAMING)
}
