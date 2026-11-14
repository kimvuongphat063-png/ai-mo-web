// QA helper: runs the host speech shim (app/src/main/assets/host/speech-v1.js) in Node with a
// fake window and a real MessageChannel standing in for the app, and checks the Web Speech
// semantics games rely on. The authoritative tests run in real WebViews (SpeechBridgeTest);
// this one is fast feedback while editing the shim.
//   node tools/qa/speech_shim_test.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const SHIM = readFileSync(fileURLToPath(new URL('../../app/src/main/assets/host/speech-v1.js', import.meta.url)), 'utf8');
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

function makePage() {
  const listeners = {};
  const win = {
    setTimeout, clearTimeout, JSON, Date, Object, Array, Number, String, TypeError, Error,
    document: { documentElement: { lang: 'vi' } },
    addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); },
    dispatch(type, ev) { ev.stopImmediatePropagation = () => { ev.__stopped = true; }; for (const fn of listeners[type] || []) { if (ev.__stopped) break; fn(ev); } },
  };
  win.window = win;
  vm.runInNewContext(SHIM, win);
  return win;
}

/** The app side: records messages, answers like the native broker would. */
function connect(win, source = null) {
  const ch = new MessageChannel();
  const app = { port: ch.port1, got: [] };
  ch.port1.onmessage = (e) => {
    // WebView 69 mangles Latin-1-only strings on a port: everything sent must be ASCII.
    assert.match(e.data, /^[\x20-\x7e]*$/, 'ASCII-only message');
    app.got.push(JSON.parse(e.data));
  };
  app.send = (m) => ch.port1.postMessage(JSON.stringify(m));
  win.dispatch('message', { data: 'kgp-speech-v1', ports: [ch.port2], source });
  return app;
}

const VOICES = [
  { voiceURI: 'vi-vn-x-fake-local', name: 'Tiếng Việt · fake', lang: 'vi-VN', localService: true, default: true },
  { voiceURI: 'en-us-x-fake-local', name: 'English · fake', lang: 'en-US', localService: true, default: false },
];

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('installs the standard globals with no voices', async () => {
  const w = makePage();
  assert.equal(w.__kgpSpeechV1, true);
  assert.equal(typeof w.speechSynthesis.speak, 'function');
  assert.equal(typeof w.SpeechSynthesisUtterance, 'function');
  assert.equal(w.speechSynthesis.getVoices().length, 0); // (array of the page realm)
  assert.equal(w.speechSynthesis.speaking, false);
  assert.throws(() => w.speechSynthesis.speak({ text: 'x' }), TypeError);
  assert.throws(() => w.SpeechSynthesisUtterance('x'), TypeError);
  // A game may wrap speak (May Ke Chuyen does).
  const orig = w.speechSynthesis.speak.bind(w.speechSynthesis);
  let wrapped = 0;
  w.speechSynthesis.speak = (u) => { wrapped++; return orig(u); };
  w.speechSynthesis.speak(new w.SpeechSynthesisUtterance('a'));
  assert.equal(wrapped, 1);
});

test('only a port posted without a source window is accepted', async () => {
  const w = makePage();
  const fake = connect(w, w);
  await tick(20);
  assert.equal(fake.got.length, 0, 'page-posted port ignored');
  const app = connect(w);
  await tick(20);
  assert.deepEqual(app.got[0], { op: 'hello', v: 1 });
});

test('voices arrive with voiceschanged; speak/start/end like a browser', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  let changed = 0;
  ss.addEventListener('voiceschanged', () => changed++);
  ss.onvoiceschanged = () => changed++;
  const app = connect(w);
  await tick(10);
  app.send({ t: 'voices', voices: VOICES });
  await tick(20);
  assert.equal(changed, 2);
  const vs = ss.getVoices();
  assert.equal(vs.length, 2);
  assert.equal(vs[0].lang, 'vi-VN');
  assert.equal(vs[0].localService, true);
  assert.equal(vs[0].default, true);
  assert.ok(vs[0] instanceof w.SpeechSynthesisVoice);
  // Same list again: no event.
  app.send({ t: 'voices', voices: VOICES });
  await tick(20);
  assert.equal(changed, 2);

  const u = new w.SpeechSynthesisUtterance('Xin chào');
  u.voice = vs[0]; u.lang = vs[0].lang; u.rate = 0.9; u.pitch = 1.08;
  const ev = [];
  u.onstart = () => ev.push('start:' + ss.speaking + ss.pending);
  u.onend = (e) => ev.push('end:' + ss.speaking + ':' + e.utterance.text);
  u.onerror = () => ev.push('error');
  ss.speak(u);
  assert.equal(ss.pending, true, 'pending at once');
  assert.equal(ss.speaking, false);
  await tick(20);
  const msg = app.got.find((m) => m.op === 'speak');
  assert.deepEqual(Object.keys(msg).sort(), ['id', 'lang', 'op', 'pitch', 'rate', 'text', 'voice', 'volume']);
  assert.equal(msg.text, 'Xin chào');
  assert.equal(msg.voice, 'vi-vn-x-fake-local');
  assert.equal(msg.rate, 0.9);
  app.send({ t: 'start', id: msg.id });
  await tick(10);
  assert.equal(ss.speaking, true);
  app.send({ t: 'end', id: msg.id });
  app.send({ t: 'error', id: msg.id, error: 'interrupted' }); // a second terminal event is ignored
  await tick(10);
  assert.deepEqual(ev, ['start:truefalse', 'end:false:Xin chào']);
});

test('cancel: state at once, errors later, app told, late events ignored', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  const app = connect(w);
  await tick(10);
  const a = new w.SpeechSynthesisUtterance('một');
  const b = new w.SpeechSynthesisUtterance('hai');
  const ev = [];
  for (const [n, u] of [['a', a], ['b', b]]) {
    u.onend = () => ev.push(n + ':end');
    u.onerror = (e) => ev.push(n + ':' + e.error);
  }
  ss.speak(a); ss.speak(b);
  await tick(10);
  const ids = app.got.filter((m) => m.op === 'speak').map((m) => m.id);
  app.send({ t: 'start', id: ids[0] });
  await tick(10);
  ss.cancel();
  assert.equal(ss.speaking, false);
  assert.equal(ss.pending, false);
  assert.deepEqual(ev, [], 'errors are not synchronous');
  await tick(10);
  assert.deepEqual(ev, ['a:interrupted', 'b:canceled']);
  assert.ok(app.got.some((m) => m.op === 'cancel'));
  app.send({ t: 'end', id: ids[0] });
  app.send({ t: 'start', id: ids[1] });
  await tick(10);
  assert.deepEqual(ev, ['a:interrupted', 'b:canceled']);
  assert.equal(ss.speaking, false);
});

test('family-A pattern: speaking||pending -> cancel -> speak after 90 ms', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  const app = connect(w);
  await tick(10);
  app.send({ t: 'voices', voices: VOICES });
  await tick(10);
  const voice = ss.getVoices().filter((v) => /^vi([-_]|$)/i.test(v.lang))[0];
  const ended = [];
  function say(text) {
    const u = new w.SpeechSynthesisUtterance(text);
    u.voice = voice; u.lang = voice.lang; u.rate = 0.9; u.pitch = 1.08; u.volume = 1;
    u.onend = () => ended.push(text); u.onerror = () => ended.push('x:' + text);
    if (ss.speaking || ss.pending) { ss.cancel(); setTimeout(() => ss.speak(u), 90); } else ss.speak(u);
  }
  say('Câu một');
  await tick(10);
  say('Câu hai');
  await tick(150);
  const speaks = app.got.filter((m) => m.op === 'speak');
  assert.equal(speaks.length, 2);
  assert.equal(speaks[1].text, 'Câu hai');
  assert.ok(app.got.findIndex((m) => m.op === 'cancel') < app.got.lastIndexOf(speaks[1]));
  app.send({ t: 'start', id: speaks[1].id });
  app.send({ t: 'end', id: speaks[1].id });
  await tick(10);
  assert.deepEqual(ended, ['x:Câu một', 'Câu hai']);
});

test('pause stops the current utterance and holds the rest until resume', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  const app = connect(w);
  await tick(10);
  const a = new w.SpeechSynthesisUtterance('a');
  const b = new w.SpeechSynthesisUtterance('b');
  const ev = [];
  a.onerror = (e) => ev.push('a:' + e.error);
  b.onstart = () => ev.push('b:start');
  b.onend = () => ev.push('b:end');
  ss.speak(a); ss.speak(b);
  await tick(10);
  const [ia, ib] = app.got.filter((m) => m.op === 'speak').map((m) => m.id);
  app.send({ t: 'start', id: ia });
  await tick(10);
  ss.pause();
  assert.equal(ss.paused, true);
  assert.equal(ss.speaking, false);
  assert.equal(ss.pending, true);
  app.send({ t: 'start', id: ib }); // sent by the app before it saw the cancel: ignored
  await tick(10);
  assert.deepEqual(ev, ['a:interrupted']);
  ss.resume();
  await tick(10);
  const resent = app.got.filter((m) => m.op === 'speak').pop();
  assert.equal(resent.text, 'b');
  assert.notEqual(resent.id, ib, 'fresh id on re-send');
  app.send({ t: 'start', id: resent.id });
  app.send({ t: 'end', id: resent.id });
  await tick(10);
  assert.deepEqual(ev, ['a:interrupted', 'b:start', 'b:end']);
});

test('errors, boundary, document language and limits', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  const app = connect(w);
  await tick(10);
  const u = new w.SpeechSynthesisUtterance('Bé ơi chơi nào');
  const got = [];
  u.addEventListener('boundary', (e) => got.push('b' + e.charIndex + '/' + e.charLength + e.name));
  u.addEventListener('error', (e) => got.push(e.error));
  ss.speak(u);
  await tick(10);
  const m = app.got.filter((x) => x.op === 'speak').pop();
  assert.equal(m.lang, 'vi', 'document language when the utterance has none');
  app.send({ t: 'start', id: m.id });
  app.send({ t: 'boundary', id: m.id, charIndex: 3, charLength: 2, name: 'word' });
  app.send({ t: 'error', id: m.id, error: 'language-unavailable' });
  await tick(10);
  assert.deepEqual(got, ['b3/2word', 'language-unavailable']);
  // Unknown codes become synthesis-failed.
  const v = new w.SpeechSynthesisUtterance('x');
  let code = '';
  v.onerror = (e) => { code = e.error; };
  ss.speak(v);
  await tick(10);
  app.send({ t: 'error', id: app.got.filter((x) => x.op === 'speak').pop().id, error: '<script>' });
  await tick(10);
  assert.equal(code, 'synthesis-failed');
  // Long texts: cut to 1000 for the app; beyond 32767 an immediate text-too-long.
  ss.speak(new w.SpeechSynthesisUtterance('a'.repeat(1500)));
  await tick(10);
  assert.equal(app.got.filter((x) => x.op === 'speak').pop().text.length, 1000);
  const huge = new w.SpeechSynthesisUtterance('a'.repeat(40000));
  let hugeErr = '';
  huge.onerror = (e) => { hugeErr = e.error; };
  ss.speak(huge);
  await tick(10);
  assert.equal(hugeErr, 'text-too-long');
});

test('before the port: queued, flushed after hello; never connected: synthesis-unavailable', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  const early = new w.SpeechSynthesisUtterance('sớm');
  ss.speak(early);
  assert.equal(ss.pending, true);
  await tick(20);
  const app = connect(w);
  await tick(20);
  assert.equal(app.got[0].op, 'hello');
  assert.equal(app.got[1].op, 'speak');
  assert.equal(app.got[1].text, 'sớm');

  const lonely = makePage();
  const u = new lonely.SpeechSynthesisUtterance('không ai nghe');
  let err = '';
  u.onerror = (e) => { err = e.error; };
  lonely.speechSynthesis.speak(u);
  await tick(5300);
  assert.equal(err, 'synthesis-unavailable');
  assert.equal(lonely.speechSynthesis.pending, false);
});

test('a new channel for the same page drops what was sent on the old one', async () => {
  const w = makePage();
  const ss = w.speechSynthesis;
  const first = connect(w);
  await tick(10);
  const u = new w.SpeechSynthesisUtterance('cũ');
  let err = '';
  u.onerror = (e) => { err = e.error; };
  ss.speak(u);
  await tick(10);
  first.send({ t: 'start', id: first.got.filter((m) => m.op === 'speak')[0].id });
  await tick(10);
  const second = connect(w);
  await tick(20);
  assert.equal(err, 'interrupted');
  assert.equal(second.got[0].op, 'hello');
  ss.speak(new w.SpeechSynthesisUtterance('mới'));
  await tick(10);
  assert.equal(second.got.filter((m) => m.op === 'speak').length, 1);
  assert.equal(first.got.filter((m) => m.op === 'speak').length, 1);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    await fn();
    console.log('PASS ' + name);
  } catch (e) {
    failed++;
    console.log('FAIL ' + name + '\n    ' + String(e && e.stack || e).split('\n').slice(0, 4).join('\n    '));
  }
}
console.log(`TOTAL ${tests.length} FAILED ${failed}`);
process.exit(failed ? 1 : 0);
