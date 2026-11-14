package vn.family.kidsgamesplayer.player.speech

import android.os.Handler
import android.os.Looper
import android.webkit.WebMessage
import android.webkit.WebMessagePort
import android.webkit.WebView
import androidx.core.net.toUri

/**
 * One speech channel = one game page. Built on the framework WebMessageChannel (API 23+, so
 * it works on WebView 69 too): the app keeps port 0 and posts port 1 to the page's origin
 * once the page has loaded; the shim picks it up. This is the only page → app path in the
 * player, and it carries nothing but [SpeechProtocol] messages, all checked by [SpeechBroker].
 * There is no addJavascriptInterface. Messages arrive on the main thread; after [close] they
 * are ignored and the port is closed.
 */
class SpeechChannel private constructor(
    private val port: WebMessagePort,
    brokerFactory: (send: (String) -> Unit) -> SpeechBroker,
) {
    val broker: SpeechBroker = brokerFactory { json -> post(json) }
    var closed = false
        private set

    private fun receive(message: WebMessage?) {
        if (closed || message == null) return
        // The page may only talk; ports it tries to hand over are closed unread.
        message.ports?.forEach { runCatching { it.close() } }
        broker.onMessage(message.data)
    }

    private fun post(json: String) {
        if (closed) return
        runCatching { port.postMessage(WebMessage(json)) }
    }

    fun close() {
        if (closed) return
        closed = true
        broker.close()
        runCatching { port.close() }
    }

    companion object {
        /** Opens a channel to the page currently loaded in [webView] at [origin]; null if the WebView refuses. */
        fun open(
            webView: WebView,
            origin: String,
            brokerFactory: (send: (String) -> Unit) -> SpeechBroker,
            onFailure: (String) -> Unit,
        ): SpeechChannel? {
            val ports = try {
                webView.createWebMessageChannel()
            } catch (e: RuntimeException) {
                onFailure("createWebMessageChannel: ${e.javaClass.simpleName}")
                return null
            }
            val channel = SpeechChannel(ports[0], brokerFactory)
            ports[0].setWebMessageCallback(
                object : WebMessagePort.WebMessageCallback() {
                    override fun onMessage(port: WebMessagePort, message: WebMessage?) = channel.receive(message)
                },
                Handler(Looper.getMainLooper()),
            )
            try {
                webView.postWebMessage(WebMessage(SpeechProtocol.CHANNEL, arrayOf(ports[1])), origin.toUri())
            } catch (e: RuntimeException) {
                onFailure("postWebMessage: ${e.javaClass.simpleName}")
                channel.close()
                runCatching { ports[1].close() }
                return null
            }
            return channel
        }
    }
}
