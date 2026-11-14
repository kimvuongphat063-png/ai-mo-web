package vn.family.kidsgamesplayer.catalog

import java.io.IOException
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock

/**
 * Single writer for the catalog. Every mutation runs under one Mutex and is committed to
 * disk before the in-memory state changes (bible §7.2: AtomicFile has no thread locking).
 */
class CatalogRepository(private val store: CatalogStore) {
    private val mutex = Mutex()
    private val _state = MutableStateFlow(Catalog.EMPTY)
    val state: StateFlow<Catalog> = _state.asStateFlow()

    enum class Health { NOT_LOADED, OK, RECOVERED_FROM_BACKUP, UNREADABLE }

    @Volatile var health: Health = Health.NOT_LOADED
        private set
    @Volatile var lastLoadDetail: String? = null
        private set

    val current: Catalog get() = _state.value

    suspend fun load(): Health = mutex.withLock {
        when (val r = store.load()) {
            CatalogStore.LoadResult.Missing -> {
                _state.value = Catalog.EMPTY
                health = Health.OK
            }
            is CatalogStore.LoadResult.Loaded -> {
                _state.value = r.catalog
                health = if (r.fromBackup) Health.RECOVERED_FROM_BACKUP else Health.OK
                lastLoadDetail = if (r.quarantined > 0) "quarantined=${r.quarantined}" else null
            }
            is CatalogStore.LoadResult.Unreadable -> {
                health = Health.UNREADABLE
                lastLoadDetail = r.detail
            }
        }
        health
    }

    /**
     * Applies [transform] atomically. Returning the same instance skips the disk write.
     * Throws IOException if the commit fails; in that case the in-memory state is unchanged.
     */
    @Throws(IOException::class)
    suspend fun <T> update(transform: (Catalog) -> Pair<Catalog, T>): T = mutex.withLock {
        check(health != Health.UNREADABLE && health != Health.NOT_LOADED) { "catalog not usable: $health" }
        val before = _state.value
        val (after, result) = transform(before)
        if (after !== before) {
            store.write(after)
            _state.value = after
        }
        result
    }

    /** Replaces an unreadable catalog with one rebuilt from per-game identity files. */
    @Throws(IOException::class)
    suspend fun replaceAfterRecovery(rebuilt: Catalog) = mutex.withLock {
        store.write(rebuilt)
        _state.value = rebuilt
        health = Health.OK
        lastLoadDetail = "rebuilt"
    }
}
