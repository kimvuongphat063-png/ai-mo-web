// Minimal Chrome DevTools Protocol driver for testing the games in headless Chrome.
// Real (trusted) touch input via Input.dispatchTouchEvent, screenshots, console capture.
// Used by _tools/run_test.mjs. Node >= 22 (global WebSocket/fetch). No npm packages.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { sleep };

export async function launchChrome({ exe, port, profile }) {
  mkdirSync(profile, { recursive: true });
  const proc = spawn(exe, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars', 'about:blank'
  ], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (r.ok) return proc;
    } catch (e) { /* not up yet */ }
    await sleep(100);
  }
  throw new Error('chrome did not start');
}

export class Page {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
    this.logs = [];
    ws.onmessage = (ev) => {
      const m = JSON.parse(ev.data);
      if (m.id && this.pending.has(m.id)) {
        const { ok, no } = this.pending.get(m.id);
        this.pending.delete(m.id);
        if (m.error) no(new Error(m.error.message)); else ok(m.result);
      } else if (m.method) {
        (this.handlers.get(m.method) || []).forEach((f) => f(m.params));
      }
    };
  }

  /** Attaches to the first existing page (Android WebView exposes pages but cannot create targets). */
  static async attach(port) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const attached = (x) => { try { return JSON.parse(x.description).attached; } catch (e) { return false; } };
    const t = list.find((x) => x.type === 'page' && attached(x)) || list.find((x) => x.type === 'page');
    return Page.connect(t.webSocketDebuggerUrl);
  }

  static async open(port) {
    const r = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' });
    const t = await r.json();
    return Page.connect(t.webSocketDebuggerUrl);
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
    const p = new Page(ws);
    await p.send('Page.enable');
    await p.send('Runtime.enable');
    await p.send('Log.enable');
    p.on('Runtime.consoleAPICalled', (e) => p.logs.push(`[console.${e.type}] ` + e.args.map((a) => a.value !== undefined ? a.value : a.description).join(' ')));
    p.on('Runtime.exceptionThrown', (e) => p.logs.push('[exception] ' + (e.exceptionDetails.exception ? e.exceptionDetails.exception.description : e.exceptionDetails.text)));
    p.on('Log.entryAdded', (e) => {
      if (e.entry.level !== 'error' && e.entry.level !== 'warning') return;
      // The desktop browser asks for /favicon.ico by itself (the player WebView does not): not a game error.
      if (/favicon\.ico$/.test(e.entry.url || '')) { p.ignored = (p.ignored || 0) + 1; return; }
      p.logs.push(`[log.${e.entry.level}] ${e.entry.text} ${e.entry.url || ''}`);
    });
    return p;
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, no) => this.pending.set(id, { ok, no }));
  }

  on(method, fn) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(fn);
  }

  async goto(url) {
    const loaded = new Promise((ok) => { const f = () => ok(); this.on('Page.loadEventFired', f); });
    await this.send('Page.navigate', { url });
    await Promise.race([loaded, sleep(20000)]);
    await sleep(300);
    this.rect = null;
  }

  async eval(expr) {
    const r = await this.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('eval: ' + (r.exceptionDetails.exception ? r.exceptionDetails.exception.description : r.exceptionDetails.text));
    return r.result.value;
  }

  async size(w, h, dpr = 1) {
    if (this.remote) { this.rect = null; return; }   // WebView 69: device metrics emulation is broken
    await this.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true });
    try { await this.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); } catch (e) { /* real touch screen */ }
    await sleep(250);
    this.rect = null;
  }

  async shot(path) {
    await sleep(60);
    const r = await this.send('Page.captureScreenshot', { format: 'jpeg', quality: 82 });
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, Buffer.from(r.data, 'base64'));
  }

  /** Logical (1280x720) -> CSS px of the page. */
  async css(x, y) {
    if (!this.rect) this.rect = await this.eval('(function(){var r=document.getElementById("game").getBoundingClientRect();return {l:r.left,t:r.top,w:r.width,h:r.height};})()');
    const r = this.rect;
    return { x: r.l + x * r.w / 1280, y: r.t + y * r.h / 720 };
  }

  async touch(type, pts) {
    if (this.remote) {
      // WebView 69 never answers Input.dispatchTouchEvent: drive the first finger with the mouse
      // (the games use pointer events, so the same handlers run); extra fingers are not possible.
      if (type === 'touchEnd' || type === 'touchCancel') {
        const l = this.lastMouse || { x: 0, y: 0 };
        await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: l.x, y: l.y, button: 'left', clickCount: 1 });
        return;
      }
      const c = await this.css(pts[0].x, pts[0].y);
      this.lastMouse = c;
      await this.send('Input.dispatchMouseEvent', { type: type === 'touchStart' ? 'mousePressed' : 'mouseMoved', x: c.x, y: c.y, button: 'left', buttons: 1, clickCount: 1 });
      return;
    }
    const touchPoints = [];
    for (const p of pts) {
      const c = await this.css(p.x, p.y);
      touchPoints.push({ x: c.x, y: c.y, id: p.id || 1, radiusX: 6, radiusY: 6, force: 1 });
    }
    await this.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' || type === 'touchCancel' ? [] : touchPoints });
  }

  async tap(x, y, hold = 60) {
    await this.touch('touchStart', [{ x, y }]);
    await sleep(hold);
    await this.touch('touchEnd', []);
    await sleep(80);
  }

  /** Finger drag through logical points [[x,y],...]. */
  async drag(pts, stepMs = 12) {
    await this.touch('touchStart', [{ x: pts[0][0], y: pts[0][1] }]);
    for (let i = 1; i < pts.length; i++) {
      await sleep(stepMs);
      await this.touch('touchMove', [{ x: pts[i][0], y: pts[i][1] }]);
    }
    await sleep(stepMs);
    await this.touch('touchEnd', []);
    await sleep(60);
  }

  async close() { try { this.ws.close(); } catch (e) { /* ignore */ } }
}

export function saveJson(path, obj) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(obj, null, 2));
}
