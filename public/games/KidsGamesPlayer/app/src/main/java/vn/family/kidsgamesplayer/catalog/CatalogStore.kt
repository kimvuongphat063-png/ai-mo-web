package vn.family.kidsgamesplayer.catalog

import java.io.File
import java.io.IOException
import vn.family.kidsgamesplayer.core.AndroidAtomicBytesFile
import vn.family.kidsgamesplayer.core.AtomicBytesFile

/**
 * Persists the catalog with AtomicFile. Before each commit the current good file is copied
 * to catalog.prev.json, giving one known-good fallback. AtomicFile does not lock across
 * threads; callers must go through [CatalogRepository] which serializes writes with a Mutex.
 */
class CatalogStore(
    private val dir: File,
    factory: AtomicBytesFile.Factory = AndroidAtomicBytesFile.FACTORY,
) {
    private val main = factory.create(File(dir, "catalog.json"))
    private val prev = factory.create(File(dir, "catalog.prev.json"))

    sealed interface LoadResult {
        data object Missing : LoadResult
        data class Loaded(val catalog: Catalog, val fromBackup: Boolean, val quarantined: Int) : LoadResult
        data class Unreadable(val detail: String) : LoadResult
    }

    fun load(): LoadResult {
        val mainResult = readOne(main)
        if (mainResult is LoadResult.Loaded) return mainResult
        val prevResult = readOne(prev)
        if (prevResult is LoadResult.Loaded) return prevResult.copy(fromBackup = true)
        return if (mainResult is LoadResult.Missing && prevResult is LoadResult.Missing) {
            LoadResult.Missing
        } else {
            LoadResult.Unreadable((mainResult as? LoadResult.Unreadable)?.detail ?: "unreadable")
        }
    }

    private fun readOne(file: AtomicBytesFile): LoadResult {
        if (!file.exists()) return LoadResult.Missing
        return try {
            val text = file.read().toString(Charsets.UTF_8)
            val decoded = CatalogCodec.decode(text)
            LoadResult.Loaded(decoded.catalog, fromBackup = false, quarantined = decoded.quarantinedNow)
        } catch (e: IOException) {
            LoadResult.Unreadable("io: ${e.message}")
        } catch (e: CatalogCodec.UnreadableCatalog) {
            LoadResult.Unreadable(e.message ?: "unreadable")
        }
    }

    @Throws(IOException::class)
    fun write(catalog: Catalog) {
        dir.mkdirs()
        if (main.exists()) {
            val current = try { main.read() } catch (_: IOException) { null }
            if (current != null && runCatching { CatalogCodec.decode(current.toString(Charsets.UTF_8)) }.isSuccess) {
                prev.write(current)
            }
        }
        main.write(CatalogCodec.encode(catalog).toByteArray(Charsets.UTF_8))
    }
}
