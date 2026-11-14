# (Re)starts the WebView Shell (system WebView 69 on the API 26 emulator) and forwards its
# DevTools socket to tcp:9334 for _tools/run_test.mjs (KG_REMOTE=9334).
export MSYS_NO_PATHCONV=1
ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe"
SER=${SER:-emulator-5556}
"$ADB" -s $SER shell am force-stop org.chromium.webview_shell
"$ADB" -s $SER shell am start -n org.chromium.webview_shell/.WebViewBrowserActivity -d about:blank >/dev/null
sleep 4
PID=$("$ADB" -s $SER shell pidof org.chromium.webview_shell | tr -d '\r')
"$ADB" -s $SER forward --remove tcp:9334 2>/dev/null
"$ADB" -s $SER forward tcp:9334 localabstract:webview_devtools_remote_$PID
echo "webview_shell pid $PID forwarded to tcp:9334"
