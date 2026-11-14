// QA helper (debug builds only): evaluates an expression in the game page through the WebView
// DevTools socket, e.g. to read the AudioContext state and the SDK mute flags.
//   adb forward tcp:9333 localabstract:webview_devtools_remote_<pid>
//   node tools/qa/webview_probe.mjs 9333 "JSON.stringify({a:KidsSDK.isActive()})"
// Release builds disable WebView debugging, so this cannot attach to them.
const port = process.argv[2] || '9333';
const expression = process.argv[3] || 'location.href';

const pages = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
const page = pages.find((p) => /^https:\/\/g-[a-f0-9]{32}\.invalid\//.test(p.url));
if (!page) {
  console.log(JSON.stringify({ error: 'no game page', pages: pages.map((p) => p.url) }));
  process.exit(2);
}
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
const result = await new Promise((resolve) => {
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id === 1) resolve(msg.result);
  };
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression, returnByValue: true, awaitPromise: true } }));
});
console.log(JSON.stringify({ url: page.url, value: result.result && result.result.value }));
ws.close();
