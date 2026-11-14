package vn.family.kidsgamesplayer.ui

import android.os.SystemClock
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import java.text.Collator
import java.util.Locale
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import vn.family.kidsgamesplayer.AppGraph
import vn.family.kidsgamesplayer.R
import vn.family.kidsgamesplayer.catalog.Catalog
import vn.family.kidsgamesplayer.catalog.GameRecord
import vn.family.kidsgamesplayer.importer.ScanKind

/** Child menu: big icons, short titles, no technical data (bible §4.2). */
class MenuScreen(
    inflater: LayoutInflater,
    parent: ViewGroup,
    private val graph: AppGraph,
    private val scope: CoroutineScope,
    private val onOpenGame: (GameRecord) -> Unit,
    private val onParentRequested: () -> Unit,
    private val onParentHint: () -> Unit,
) {
    val view: View = inflater.inflate(R.layout.screen_menu, parent, false)
    private val grid: RecyclerView = view.findViewById(R.id.grid)
    private val empty: View = view.findViewById(R.id.empty_state)
    private val hint: TextView = view.findViewById(R.id.menu_hint)
    private val parentButton: HoldButton = view.findViewById(R.id.parent_button)
    private val iconLoader = IconLoader(graph.revisions, scope)
    private val adapter = GameAdapter()
    private val layoutManager = GridLayoutManager(view.context, 4)
    private var observeJob: Job? = null
    private var pollJob: Job? = null
    private var lastShallowRequest = 0L
    private var iconSizePx = 0
    private var lastClickAt = 0L

    init {
        grid.layoutManager = layoutManager
        grid.adapter = adapter
        grid.itemAnimator = null
        parentButton.setCompoundDrawablesRelativeWithIntrinsicBounds(R.drawable.ic_lock, 0, 0, 0)
        parentButton.onActivated = onParentRequested
        parentButton.onShortPress = onParentHint
        grid.addOnLayoutChangeListener { _, l, _, r, _, ol, _, or, _ -> if (r - l != or - ol) updateColumns() }
    }

    private fun updateColumns() {
        val width = grid.width - grid.paddingStart - grid.paddingEnd
        if (width <= 0) return
        val density = view.resources.displayMetrics.density
        val minCard = view.resources.getDimensionPixelSize(R.dimen.card_min_width)
        val span = (width / minCard).coerceIn(2, 6)
        val cell = width / span
        val icon = (cell - (16 + 20) * density).toInt()
        val maxIcon = view.resources.getDimensionPixelSize(R.dimen.card_icon_max)
        val newIcon = icon.coerceIn((72 * density).toInt(), maxIcon)
        if (span != layoutManager.spanCount || newIcon != iconSizePx) {
            layoutManager.spanCount = span
            iconSizePx = newIcon
            adapter.notifyItemRangeChanged(0, adapter.itemCount)
        }
    }

    fun onShow() {
        hint.visibility = View.GONE
        observeJob?.cancel()
        observeJob = scope.launch {
            graph.catalog.state.collectLatest { render(it) }
        }
        requestShallowScan()
    }

    fun onHide() {
        observeJob?.cancel()
        observeJob = null
        stopPolling()
    }

    /** Called while the menu is visible and the activity is resumed. */
    fun startPolling() {
        if (pollJob?.isActive == true) return
        pollJob = scope.launch {
            while (true) {
                delay(10_000)
                // Do not start a new discovery while the previous one is still running.
                if (!graph.scanner.isRunning) graph.scanner.request(ScanKind.SHALLOW)
            }
        }
    }

    fun stopPolling() {
        pollJob?.cancel()
        pollJob = null
    }

    private fun requestShallowScan() {
        val now = SystemClock.elapsedRealtime()
        if (now - lastShallowRequest < 3_000) return
        lastShallowRequest = now
        graph.scanner.request(ScanKind.SHALLOW)
    }

    fun showBackHint() {
        hint.visibility = View.VISIBLE
        hint.removeCallbacks(hideHint)
        hint.postDelayed(hideHint, 3_000)
    }

    private val hideHint = Runnable { hint.visibility = View.GONE }

    private fun render(catalog: Catalog) {
        val games = visibleGames(catalog)
        adapter.submitList(games)
        empty.visibility = if (games.isEmpty()) View.VISIBLE else View.GONE
        grid.visibility = if (games.isEmpty()) View.INVISIBLE else View.VISIBLE
        if (iconSizePx == 0) grid.post { updateColumns() }
    }

    private inner class GameAdapter : ListAdapter<GameRecord, GameHolder>(DIFF) {
        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): GameHolder =
            GameHolder(LayoutInflater.from(parent.context).inflate(R.layout.item_game, parent, false))

        override fun onBindViewHolder(holder: GameHolder, position: Int) = holder.bind(getItem(position))
    }

    private inner class GameHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val icon: ImageView = itemView.findViewById(R.id.game_icon)
        private val title: TextView = itemView.findViewById(R.id.game_title)

        fun bind(record: GameRecord) {
            val size = if (iconSizePx > 0) iconSizePx else (120 * itemView.resources.displayMetrics.density).toInt()
            icon.layoutParams = icon.layoutParams.apply {
                width = size
                height = size
            }
            title.text = record.title
            itemView.contentDescription = record.title
            iconLoader.load(record, size, icon)
            itemView.setOnClickListener {
                // Double-tap guard only; a second session is also impossible because the
                // activity ignores game launches outside the menu and the player serializes open.
                val now = SystemClock.elapsedRealtime()
                if (now - lastClickAt < 350) return@setOnClickListener
                lastClickAt = now
                onOpenGame(record)
            }
        }
    }

    companion object {
        /**
         * Built-in demos whose copy exists in the parent's folder (builtin.x vs family.x etc.)
         * are left out of the child menu so the same game is not shown twice.
         */
        fun shadowedDemos(games: List<GameRecord>): Set<String> {
            val externalSuffixes = games.filter { !it.builtin }.mapNotNull { it.manifestId?.substringAfter('.') }.toSet()
            return games.filter { it.builtin && it.manifestId?.substringAfter('.') in externalSuffixes }
                .map { it.internalGameId }.toSet()
        }

        private val DIFF = object : DiffUtil.ItemCallback<GameRecord>() {
            override fun areItemsTheSame(a: GameRecord, b: GameRecord) = a.internalGameId == b.internalGameId
            override fun areContentsTheSame(a: GameRecord, b: GameRecord) =
                a.title == b.title && a.activeRevision == b.activeRevision && a.iconPath == b.iconPath
        }

        fun visibleGames(catalog: Catalog): List<GameRecord> {
            val collator = Collator.getInstance(Locale.forLanguageTag("vi-VN"))
            val playable = catalog.games.filter { it.playable && !it.hidden }
            val shadowed = shadowedDemos(playable)
            return playable
                .filter { it.internalGameId !in shadowed }
                .sortedWith(
                    compareBy<GameRecord> { it.sortOrder == null }
                        .thenBy { it.sortOrder ?: 0 }
                        .thenComparator { a, b -> collator.compare(a.title, b.title) },
                )
        }
    }
}
