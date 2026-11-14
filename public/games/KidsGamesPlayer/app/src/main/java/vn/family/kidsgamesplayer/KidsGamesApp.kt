package vn.family.kidsgamesplayer

import android.app.Application
import android.content.Context
import android.graphics.BitmapFactory
import android.os.SystemClock
import android.os.storage.StorageManager
import android.webkit.WebView
import androidx.core.net.toUri
import java.io.File
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import vn.family.kidsgamesplayer.catalog.CatalogRepository
import vn.family.kidsgamesplayer.catalog.CatalogStore
import vn.family.kidsgamesplayer.catalog.SettingsStore
import vn.family.kidsgamesplayer.core.Diagnostics
import vn.family.kidsgamesplayer.core.ImportLimits
import vn.family.kidsgamesplayer.importer.AppPaths
import vn.family.kidsgamesplayer.importer.GameImporter
import vn.family.kidsgamesplayer.importer.IconInspector
import vn.family.kidsgamesplayer.importer.RevisionStore
import vn.family.kidsgamesplayer.importer.ScanCoordinator
import vn.family.kidsgamesplayer.importer.ScanKind
import vn.family.kidsgamesplayer.importer.fileUsableSpace
import vn.family.kidsgamesplayer.parent.PinManager
import vn.family.kidsgamesplayer.player.GameWebViewFactory
import vn.family.kidsgamesplayer.player.RequestRouter
import vn.family.kidsgamesplayer.player.speech.SpeechHub
import vn.family.kidsgamesplayer.source.AssetSourceRoot
import vn.family.kidsgamesplayer.source.SafSourceRoot
import vn.family.kidsgamesplayer.source.SourceGrantManager

class KidsGamesApp : Application() {
    lateinit var graph: AppGraph
        private set

    override fun onCreate() {
        super.onCreate()
        // Remote web debugging only exists in debug builds.
        runCatching { WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG) }
        graph = AppGraph(this)
        graph.start()
    }
}

val Context.graph: AppGraph get() = (applicationContext as KidsGamesApp).graph

/** Process-wide object graph built with plain constructor injection. */
class AppGraph(private val context: Context) {
    val appScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    val limits = ImportLimits.DEFAULT
    val paths = AppPaths(context.filesDir)
    val diagnostics = Diagnostics(File(paths.diagnosticsDir, "events.log"))
    val catalog = CatalogRepository(CatalogStore(paths.catalogDir))
    val settings = SettingsStore(paths.settingsDir)
    val revisions = RevisionStore(paths)
    val grants = SourceGrantManager(context.contentResolver)
    val pins = PinManager(File(paths.settingsDir, "parent_pin.json"), SystemClock::elapsedRealtime)
    val router = RequestRouter(limits)
    /** Offline voice for games' Web Speech calls (DECISIONS §22); started when the menu opens. */
    val speech = SpeechHub(context, diagnostics)

    val importer = GameImporter(
        revisions = revisions,
        iconInspector = IconInspector { file ->
            val opts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
            BitmapFactory.decodeFile(file.path, opts)
            if (opts.outWidth > 0 && opts.outHeight > 0) opts.outWidth to opts.outHeight else null
        },
        limits = limits,
        freeSpace = { dir ->
            // Counts clearable cache too (bible §6.6 reserve is still enforced on top).
            runCatching {
                val sm = context.getSystemService(StorageManager::class.java)
                sm.getAllocatableBytes(sm.getUuidForPath(dir))
            }.getOrElse { fileUsableSpace(dir) }
        },
    )

    val scanner = ScanCoordinator(
        scope = appScope,
        io = Dispatchers.IO,
        repo = catalog,
        importer = importer,
        revisions = revisions,
        builtinRoot = AssetSourceRoot(context.assets),
        sourceRootFactory = { uri -> SafSourceRoot(context.contentResolver, uri.toUri()) },
        hasGrant = { uri -> grants.hasPersistedRead(uri.toUri()) },
        diagnostics = diagnostics,
        limits = limits,
    )

    enum class Startup { LOADING, READY, CATALOG_UNREADABLE }

    private val _startup = MutableStateFlow(Startup.LOADING)
    val startup: StateFlow<Startup> = _startup.asStateFlow()

    private var lastAutoFullScan = 0L

    fun start() {
        runCatching { GameWebViewFactory.lockDownServiceWorkers() }
            .onFailure { diagnostics.log("webview", "service worker lockdown failed: ${it.javaClass.simpleName}") }
        appScope.launch(Dispatchers.IO) {
            when (catalog.load()) {
                CatalogRepository.Health.UNREADABLE -> {
                    diagnostics.log("catalog", "unreadable: ${catalog.lastLoadDetail}")
                    _startup.value = Startup.CATALOG_UNREADABLE
                }
                CatalogRepository.Health.RECOVERED_FROM_BACKUP -> {
                    diagnostics.log("catalog", "recovered from backup copy")
                    afterCatalogReady()
                }
                else -> afterCatalogReady()
            }
        }
    }

    private suspend fun afterCatalogReady() {
        scanner.verifyOnStart()
        _startup.value = Startup.READY
        requestAutoFullScan(force = true)
    }

    /** Full content scan with a cooldown (cold start, return to foreground). */
    fun requestAutoFullScan(force: Boolean = false) {
        if (_startup.value != Startup.READY) return
        val now = SystemClock.elapsedRealtime()
        if (!force && now - lastAutoFullScan < 60_000L) {
            scanner.request(ScanKind.SHALLOW)
            return
        }
        lastAutoFullScan = now
        scanner.request(ScanKind.FULL)
    }

    suspend fun rebuildCatalog() {
        val rebuilt = scanner.rebuildFromDisk()
        catalog.replaceAfterRecovery(rebuilt)
        diagnostics.log("catalog", "rebuilt with ${rebuilt.games.size} games")
        afterCatalogReady()
    }
}
