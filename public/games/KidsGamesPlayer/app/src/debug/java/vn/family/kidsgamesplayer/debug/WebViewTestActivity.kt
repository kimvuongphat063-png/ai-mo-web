package vn.family.kidsgamesplayer.debug

import android.app.Activity
import android.os.Bundle
import android.widget.FrameLayout

/** Debug-only empty host window for WebView instrumentation tests (not in release builds). */
class WebViewTestActivity : Activity() {
    lateinit var container: FrameLayout
        private set

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        container = FrameLayout(this)
        setContentView(container)
    }
}
