package vn.family.kidsgamesplayer.catalog

/** Pure parent operations on the catalog; committed by callers through [CatalogRepository]. */
object CatalogOps {

    /**
     * "Xóa tiến trình" (bible §7.3): rotates only this game's storage origin token; the old
     * token is queued for best-effort cleanup. Content, manifest id and other games are untouched.
     */
    fun resetProgress(catalog: Catalog, internalGameId: String, newToken: String): Pair<Catalog, GameRecord?> {
        val current = catalog.byId(internalGameId) ?: return catalog to null
        require(newToken != current.storageOriginToken)
        val updated = current.copy(storageOriginToken = newToken)
        val next = catalog.replaceGame(updated).copy(
            pendingOriginCleanups = (catalog.pendingOriginCleanups + current.storageOriginToken).distinct(),
        )
        return next to updated
    }

    /** Hiding is only a catalog flag: the source folder and saved progress are untouched. */
    fun setHidden(catalog: Catalog, internalGameId: String, hidden: Boolean): Pair<Catalog, GameRecord?> {
        val current = catalog.byId(internalGameId) ?: return catalog to null
        if (current.hidden == hidden) return catalog to current
        val updated = current.copy(hidden = hidden)
        return catalog.replaceGame(updated) to updated
    }
}
