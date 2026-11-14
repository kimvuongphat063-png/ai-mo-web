package vn.family.kidsgamesplayer.source

import android.content.ContentResolver
import android.content.Intent
import android.net.Uri
import androidx.core.net.toUri

/** Persisted SAF read grants (bible §6.1). Only read access is requested and kept. */
class SourceGrantManager(private val resolver: ContentResolver) {

    enum class GrantState { NONE_SELECTED, GRANTED, LOST }

    fun state(selected: String?): GrantState {
        if (selected == null) return GrantState.NONE_SELECTED
        return if (hasPersistedRead(selected.toUri())) GrantState.GRANTED else GrantState.LOST
    }

    fun hasPersistedRead(uri: Uri): Boolean =
        resolver.persistedUriPermissions.any { it.uri == uri && it.isReadPermission }

    /**
     * Takes a persistable read grant; returns false when the provider does not offer one.
     * The result flags are not trusted alone: the grant must show up in persistedUriPermissions.
     */
    fun takeRead(uri: Uri): Boolean {
        return try {
            resolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
            hasPersistedRead(uri)
        } catch (_: SecurityException) {
            false
        }
    }

    fun release(uri: Uri) {
        try {
            resolver.releasePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION)
        } catch (_: SecurityException) {
            // Already gone.
        }
    }
}
