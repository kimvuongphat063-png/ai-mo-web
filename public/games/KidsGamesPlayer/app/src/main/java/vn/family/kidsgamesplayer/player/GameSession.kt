package vn.family.kidsgamesplayer.player

import java.io.File
import vn.family.kidsgamesplayer.core.Ids
import vn.family.kidsgamesplayer.core.InventoryEntry

/**
 * Immutable description of one play session (bible §8.2). Clients and handlers only ever
 * read this object, so a request still in flight for a previous game can never be served
 * from the next game's files.
 */
data class GameSession(
    val generation: Long,
    val internalGameId: String,
    val title: String,
    val revisionHash: String,
    val root: File,
    val storageOriginToken: String,
    /** Allowlist of servable files keyed by NFC relative path. */
    val files: Map<String, InventoryEntry>,
    /** Game declared playerApiVersion 1 (template/SDK contract). */
    val sdkGame: Boolean,
) {
    val host: String = Ids.hostForToken(storageOriginToken)
    val origin: String = "https://$host"
    val entryUrl: String = "$origin/index.html"
}
