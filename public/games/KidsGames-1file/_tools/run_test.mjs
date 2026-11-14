// Runs one game's scripted test in headless Chrome against tools/preview_game.py (player CSP).
//   node _tools/run_test.mjs ToChu
// Writes _build/tests/<Game>.json (steps, checks, console) and _screens/<Game>_*.jpg.
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchChrome, Page, sleep, saveJson } from './cdp.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const game = process.argv[2];
const PORTS = { ToNet: 8771, ToChu: 8772, ToSo: 8773, PopIt: 8774, BongBongMau: 8775, ToMau: 8776, NoiDiem: 8777, GhepBong: 8778, XepHinh: 8779, DanGo: 8780 };
const port = PORTS[game] + (process.env.KG_REMOTE ? 100 : 300); // separate from manual preview ports
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(existsSync);
const PROFILE = process.env.KG_PROFILE || join(process.env.TEMP || '.', 'kg-chrome-profile');

// KG_REMOTE=<port>: attach to an Android WebView page forwarded with adb (emulator reaches the
// host preview server at 10.0.2.2). Otherwise a headless desktop Chrome is started.
const REMOTE = process.env.KG_REMOTE ? Number(process.env.KG_REMOTE) : 0;
const TAG = REMOTE ? 'api26' : '';
const server = spawn('python', [join(ROOT, '..', 'KidsGamesPlayer', 'tools', 'preview_game.py'), join(ROOT, game), '--port', String(port)], { stdio: 'ignore' });
const chrome = REMOTE ? null : await launchChrome({ exe: CHROME, port: 9333, profile: PROFILE });
if (REMOTE) {
  // the emulator reaches the host preview server through an adb reverse tunnel (slirp NAT cut
  // larger responses: net::ERR_CONTENT_LENGTH_MISMATCH)
  const adb = join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
  spawnSync(adb, ['-s', process.env.ANDROID_SERIAL || 'emulator-5556', 'reverse', `tcp:${port}`, `tcp:${port}`]);
}
const page = REMOTE ? await Page.attach(REMOTE) : await Page.open(9333);
page.remote = !!REMOTE;
const url = `http://127.0.0.1:${port}/index.html`;
if (REMOTE) await sleep(500);
const browser = REMOTE ? 'Android 8.0 emulator WebView ' + (await page.eval('navigator.userAgent')) : CHROME;

const indexSha256 = createHash('sha256').update(readFileSync(join(ROOT, game, 'index.html'))).digest('hex');
const report = { game, url, browser, indexSha256, date: new Date().toISOString(), steps: [], checks: {}, console: [] };
const ctx = {
  page, url, sleep,
  step(msg) { report.steps.push(msg); console.log('  - ' + msg); },
  remote: !!REMOTE,
  check(name, ok, note) {
    if (REMOTE && /^\d+x\d+:/.test(name)) name = name.replace(/^\d+x\d+:/, 'natural WebView viewport (no size emulation):');
    report.checks[name] = { ok: !!ok, note: note || '' };
    console.log(`  [${ok ? 'PASS' : 'FAIL'}] ${name}${note ? ' — ' + note : ''}`);
  },
  notRun(name, why) { report.checks[name] = { ok: true, notRun: true, note: 'NOT_RUN: ' + why }; console.log(`  [NOT_RUN] ${name} — ${why}`); },
  shot: (name) => {
    if (!REMOTE) return page.shot(join(ROOT, '_screens', `${game}_${name}.jpg`));
    // WebView 69 does not answer Page.captureScreenshot: take the device screen with adb instead
    const adb = join(process.env.LOCALAPPDATA, 'Android', 'Sdk', 'platform-tools', 'adb.exe');
    const r = spawnSync(adb, ['-s', process.env.ANDROID_SERIAL || 'emulator-5556', 'exec-out', 'screencap', '-p'], { maxBuffer: 64 * 1024 * 1024 });
    writeFileSync(join(ROOT, '_screens', 'android', `${game}_${TAG}_${name}.png`), r.stdout);
    return sleep(10);
  },
  info: () => page.eval('window.__kg.info ? window.__kg.info() : null'),
  screen: () => page.eval('__kg.screen()'),
  isDone: () => page.eval('__kg.done()'),
  /** Clears the game's save, reloads and waits a moment. */
  async fresh(size = [1280, 720]) {
    await page.size(size[0], size[1]);
    // clear on a page of the same origin that does NOT run the game: a running game saves its
    // in-memory state again on pagehide (KidsSDK.onSave), which would undo a clear done there.
    await page.goto(url.replace('index.html', 'icon.png'));
    await page.eval('localStorage.clear(); "cleared"');
    await page.goto(url);
  },
  /** Opens index.html#debug (stroke-order sheet) and saves a screenshot. */
  async debugShot(name = 'debug', tap = false) {
    await page.goto(url + '?sheet=1#debug');
    await sleep(REMOTE ? 1500 : 500);
    await ctx.shot(name);
    if (tap) { await page.tap(640, 360); await sleep(REMOTE ? 1200 : 400); await ctx.shot(name + '_2'); }
  },
  /** Taps the first visible kit button with this icon. */
  async button(icon) {
    const b = await page.eval(`(__kg.buttons().filter(function(b){return b.icon===${JSON.stringify(icon)};})[0]||null)`);
    if (!b) throw new Error('no button ' + icon);
    await page.tap(b.x, b.y);
    await sleep(350);
  },
  /** Generic pause checks through the real SDK paths (visibility + host protocol). */
  async pauseChecks() {
    const r = await page.eval(`(async function(){
      function vis(v){Object.defineProperty(document,'hidden',{configurable:true,get:function(){return !v;}});document.dispatchEvent(new Event('visibilitychange'));}
      var out = {}; var c = KidsSDK.audio.context();
      var t0 = K.time; vis(false); await new Promise(function(r){setTimeout(r,700);});
      out.hidden = {active: KidsSDK.isActive(), muted: KidsSDK.isMuted(), frozen: K.time === t0, audio: c && c.state};
      vis(true); await new Promise(function(r){setTimeout(r,400);});
      out.visible = {active: KidsSDK.isActive(), advanced: K.time > t0, screen: __kg.screen()};
      KidsPlayerGame.onHostState({apiVersion:1, seq:1, active:false, muted:true, reason:'parent', requestSave:true});
      var t1 = K.time; await new Promise(function(r){setTimeout(r,500);});
      out.host = {active: KidsSDK.isActive(), frozen: K.time === t1, muted: KidsSDK.isMuted()};
      KidsPlayerGame.onHostState({apiVersion:1, seq:2, active:true, muted:false, reason:'resume'});
      await new Promise(function(r){setTimeout(r,300);});
      out.resumed = {active: KidsSDK.isActive(), advanced: K.time > t1, screen: __kg.screen()};
      delete document.hidden;
      return out; })()`);
    const ok = !r.hidden.active && r.hidden.muted && r.hidden.frozen && r.visible.active && r.visible.advanced &&
      !r.host.active && r.host.frozen && r.resumed.active && r.resumed.advanced;
    ctx.check('pause/resume (visibility + host state)', ok, JSON.stringify(r));
    return r;
  }
};

let failed = false;
try {
  await page.size(1280, 720);
  const mod = await import(pathToFileURL(join(HERE, 'tests', game + '.mjs')).href);
  await mod.run(ctx);
} catch (e) {
  failed = true;
  report.error = String(e && e.stack || e);
  console.log('ERROR', e);
}
report.console = page.logs.slice();
report.ignoredFaviconRequests = page.ignored || 0;
ctx.check('console clean (no errors/warnings/exceptions)', page.logs.length === 0, page.logs.slice(0, 8).join(' | '));
saveJson(join(ROOT, '_build', 'tests', game + (TAG ? '.' + TAG : '') + '.json'), report);
const bad = Object.entries(report.checks).filter(([, v]) => !v.ok).map(([k]) => k);
console.log(bad.length || failed ? `FAILED: ${bad.join(', ')} ${report.error || ''}` : 'ALL CHECKS PASSED');
await page.close();
if (chrome) chrome.kill();
server.kill();
process.exit(bad.length || failed ? 1 : 0);
