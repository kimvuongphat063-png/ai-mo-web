package vn.family.kidsgamesplayer.catalog

import java.io.File
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject
import vn.family.kidsgamesplayer.core.AndroidAtomicBytesFile
import vn.family.kidsgamesplayer.core.AtomicBytesFile

data class AppSettings(
    val soundEnabled: Boolean = true,
    val reverseLandscape: Boolean = false,
    val setupDismissed: Boolean = false,
    /** Games may read text aloud through the player's voice (1.1.0; absent in older files = on). */
    val speechEnabled: Boolean = true,
)

/** Small parent-controlled settings, persisted as JSON with AtomicFile. Thread-confined to callers. */
class SettingsStore(dir: File, factory: AtomicBytesFile.Factory = AndroidAtomicBytesFile.FACTORY) {
    private val file = factory.create(File(dir.apply { mkdirs() }, "settings.json"))
    private val lock = Any()
    private val _state = MutableStateFlow(read())
    val state: StateFlow<AppSettings> = _state.asStateFlow()

    private fun read(): AppSettings = try {
        val o = JSONObject(file.read().toString(Charsets.UTF_8))
        AppSettings(
            soundEnabled = o.optBoolean("soundEnabled", true),
            reverseLandscape = o.optBoolean("reverseLandscape", false),
            setupDismissed = o.optBoolean("setupDismissed", false),
            speechEnabled = o.optBoolean("speechEnabled", true),
        )
    } catch (_: Exception) {
        AppSettings()
    }

    fun update(transform: (AppSettings) -> AppSettings) = synchronized(lock) {
        val next = transform(_state.value)
        if (next == _state.value) return
        val o = JSONObject()
            .put("soundEnabled", next.soundEnabled)
            .put("reverseLandscape", next.reverseLandscape)
            .put("setupDismissed", next.setupDismissed)
            .put("speechEnabled", next.speechEnabled)
        file.write(o.toString().toByteArray(Charsets.UTF_8))
        _state.value = next
    }
}
