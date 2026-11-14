package vn.family.kidsgamesplayer.ui

import android.content.Context
import android.os.Build
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import vn.family.kidsgamesplayer.AppGraph
import vn.family.kidsgamesplayer.BuildConfig
import vn.family.kidsgamesplayer.catalog.ValidationLevel
import vn.family.kidsgamesplayer.parent.PinningController
import vn.family.kidsgamesplayer.source.SourceGrantManager

/**
 * Parent-only diagnostics text (bible §14.2). Contains no PIN, hash, salt, keystore data or
 * game source code; untrusted game text has already been sanitized by [Diagnostics].
 */
object DiagnosticsReport {
    private val FEATURES = listOf(
        "MUTE_AUDIO" to WebViewFeature.MUTE_AUDIO,
        "SERVICE_WORKER_BASIC_USAGE" to WebViewFeature.SERVICE_WORKER_BASIC_USAGE,
        "WEB_VIEW_RENDERER_CLIENT_BASIC_USAGE" to WebViewFeature.WEB_VIEW_RENDERER_CLIENT_BASIC_USAGE,
        "WEB_VIEW_RENDERER_TERMINATE" to WebViewFeature.WEB_VIEW_RENDERER_TERMINATE,
        "DELETE_BROWSING_DATA" to WebViewFeature.DELETE_BROWSING_DATA,
        "SAFE_BROWSING_ENABLE" to WebViewFeature.SAFE_BROWSING_ENABLE,
    )

    fun build(context: Context, graph: AppGraph, pinning: PinningController.OsState?): String {
        val sb = StringBuilder()
        sb.append("App: ${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE}) ${if (BuildConfig.DEBUG) "debug" else "release"}\n")
        sb.append("Android API: ${Build.VERSION.SDK_INT} · ${Build.MANUFACTURER} ${Build.MODEL}\n")
        val pkg = runCatching { WebViewCompat.getCurrentWebViewPackage(context) }.getOrNull()
        sb.append("WebView: ${pkg?.packageName ?: "không xác định"} ${pkg?.versionName ?: ""}\n")
        val features = FEATURES.joinToString(", ") { (name, f) ->
            "$name=" + if (runCatching { WebViewFeature.isFeatureSupported(f) }.getOrDefault(false)) "có" else "không"
        }
        sb.append("Tính năng WebView: $features\n")
        val catalog = graph.catalog.current
        val grant = graph.grants.state(catalog.selectedSourceUri)
        sb.append("Nguồn: ${catalog.selectedSourceUri ?: "chưa chọn"} · quyền: ${grantLabel(grant)}\n")
        sb.append("Catalog: ${graph.catalog.health}${graph.catalog.lastLoadDetail?.let { " ($it)" } ?: ""}\n")
        val games = catalog.games
        sb.append("Số game: ${games.size} (ẩn ${games.count { it.hidden }}, verified ${games.count { it.validationLevel == ValidationLevel.VERIFIED }}, basic ${games.count { it.validationLevel == ValidationLevel.BASIC }})\n")
        sb.append("Ghim (OS): ${pinning ?: "?"}\n")
        sb.append("Quét: ${graph.scanner.status.value.lastSummary ?: "-"}\n")
        val sp = graph.speech.status.value
        val st = graph.speech.stats
        val vi = sp.voices.filter { it.isVietnamese }
        sb.append("Giọng đọc: ${sp.state.name.lowercase()} · bộ đọc ${sp.engineLabel ?: "-"} · ${sp.voices.size} giọng offline")
        sb.append(" · tiếng Việt: ${vi.joinToString { it.voiceURI }.ifEmpty { "không có" }}")
        sb.append(" · bật trong game: ${if (graph.settings.state.value.speechEnabled) "có" else "không"}\n")
        sb.append("Giọng đọc (phiên này): đã đọc ${st.spoken}, im lặng theo chính sách ${st.silent}, từ chối ${st.rejected}, ")
        sb.append("cắt bớt ${st.truncated}, tin bỏ qua ${st.invalid}, lỗi bộ đọc ${st.engineErrors}")
        st.lastEngineError?.let { sb.append(" (gần nhất: $it)") }
        sp.lastError?.let { sb.append(" · lỗi khởi tạo: $it") }
        sb.append(" · khởi tạo ${st.initMs} ms · trễ đọc gần nhất ${st.lastLatencyMs} ms, trung bình ${st.averageLatencyMs} ms (${st.latencySamples} lần)\n")
        sb.append("\nGame:\n")
        games.forEach { g ->
            sb.append("· ${g.title} [${g.manifestId ?: g.logicalKey}] rev ${g.activeRevision?.take(12) ?: "-"} ${g.validationLevel.wire} ${g.sourceState.wire}")
            g.lastErrorCode?.let { sb.append(" lỗi=$it") }
            sb.append('\n')
        }
        if (catalog.issues.isNotEmpty()) {
            sb.append("\nThư mục lỗi:\n")
            catalog.issues.forEach { sb.append("· ${it.folderName}: ${it.code} ${it.detail.take(120)} (lần ${it.attempts})\n") }
        }
        sb.append("\nSự kiện gần đây:\n")
        graph.diagnostics.recent(limit = 25).forEach { sb.append(graph.diagnostics.format(it)).append('\n') }
        return sb.toString()
    }

    private fun grantLabel(g: SourceGrantManager.GrantState) = when (g) {
        SourceGrantManager.GrantState.NONE_SELECTED -> "chưa chọn"
        SourceGrantManager.GrantState.GRANTED -> "còn"
        SourceGrantManager.GrantState.LOST -> "mất"
    }
}
