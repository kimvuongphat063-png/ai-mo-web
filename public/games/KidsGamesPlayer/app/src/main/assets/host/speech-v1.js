/*
 * Kids Games Player — Web Speech API shim, protocol v1 (host asset, never game code).
 *
 * Served by the player at /__kgp__/speech-v1.js on the game's own origin and inserted as the
 * first script of every game HTML page. Android WebView has no speech backend, so this file
 * replaces window.speechSynthesis / SpeechSynthesisUtterance with an implementation that talks
 * to the app's offline text-to-speech over one WebMessagePort the app posts after the page has
 * loaded. The app validates and limits every message; this file only adapts the standard API.
 * Without that port, getVoices() stays [] and games keep their own silent, timed fallback.
 *
 * Written for Chromium 69 (Android 8 without WebView updates): ES5, no ?. / ?? / class fields.
 */
(function () {
  'use strict';
  var W = window;
  if (W.__kgpSpeechV1) return;

  var CHANNEL = 'kgp-speech-v1';
  var MAX_TEXT = 1000;           // the app speaks at most this many characters per utterance
  var MAX_BROWSER_TEXT = 32767;  // longer texts fail with "text-too-long", like Chrome
  var MAX_PRE_PORT = 8;          // utterances kept while the app has not connected yet
  var PRE_PORT_TIMEOUT_MS = 5000;
  var ERRORS = ['canceled', 'interrupted', 'audio-busy', 'audio-hardware', 'network', 'synthesis-unavailable',
    'synthesis-failed', 'language-unavailable', 'voice-unavailable', 'text-too-long', 'invalid-argument', 'not-allowed'];

  var later = W.setTimeout.bind(W);
  var unlater = W.clearTimeout.bind(W);
  var stringify = JSON.stringify;
  var parse = JSON.parse;
  var now = function () { return Date.now(); };

  // ---- tiny event target ----------------------------------------------------------------

  function hidden(obj, name, value) {
    Object.defineProperty(obj, name, { value: value, writable: true, configurable: true, enumerable: false });
  }

  function listenersOf(t) {
    if (!t.__kgpL) hidden(t, '__kgpL', {});
    return t.__kgpL;
  }

  function addListener(type, fn, opts) {
    if (!fn) return;
    var map = listenersOf(this);
    var list = map[type] || (map[type] = []);
    for (var i = 0; i < list.length; i++) if (list[i].fn === fn) return;
    list.push({ fn: fn, once: !!(opts && typeof opts === 'object' && opts.once) });
  }

  function removeListener(type, fn) {
    var list = listenersOf(this)[type];
    if (!list) return;
    for (var i = 0; i < list.length; i++) {
      if (list[i].fn === fn) { list.splice(i, 1); return; }
    }
  }

  function invoke(fn, self, ev) {
    try {
      if (typeof fn === 'function') fn.call(self, ev);
      else if (fn && typeof fn.handleEvent === 'function') fn.handleEvent(ev);
    } catch (e) {
      later(function () { throw e; });  // report like a browser, keep dispatching
    }
  }

  function fire(target, type, ev) {
    invoke(target['on' + type], target, ev);
    var list = listenersOf(target)[type];
    if (!list || !list.length) return;
    list = list.slice();
    for (var i = 0; i < list.length && !ev.__stop; i++) {
      if (list[i].once) removeListener.call(target, type, list[i].fn);
      invoke(list[i].fn, target, ev);
    }
  }

  function makeEvent(type, target, extra) {
    var ev = {
      type: type, target: target, currentTarget: target, srcElement: target,
      bubbles: false, cancelable: false, defaultPrevented: false, isTrusted: false, timeStamp: now(),
      preventDefault: function () {}, stopPropagation: function () {},
      stopImmediatePropagation: function () { hidden(this, '__stop', true); }
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) ev[k] = extra[k];
    return ev;
  }

  function dispatchEventImpl(ev) {
    if (!ev || typeof ev.type !== 'string') throw new TypeError("Failed to execute 'dispatchEvent': parameter 1 is not of type 'Event'.");
    fire(this, ev.type, ev);
    return true;
  }

  // ---- SpeechSynthesisVoice ---------------------------------------------------------------

  function SpeechSynthesisVoice() { throw new TypeError('Illegal constructor'); }

  function makeVoice(v) {
    var o = Object.create(SpeechSynthesisVoice.prototype);
    var props = { voiceURI: v.voiceURI, name: v.name, lang: v.lang, localService: true, 'default': v['default'] };
    for (var k in props) Object.defineProperty(o, k, { value: props[k], enumerable: true });
    return Object.freeze(o);
  }

  // ---- SpeechSynthesisUtterance ------------------------------------------------------------

  function SpeechSynthesisUtterance(text) {
    if (!(this instanceof SpeechSynthesisUtterance)) {
      throw new TypeError("Failed to construct 'SpeechSynthesisUtterance': Please use the 'new' operator.");
    }
    this.text = text === undefined ? '' : String(text);
    this.lang = '';
    this.voice = null;
    this.volume = 1;
    this.rate = 1;
    this.pitch = 1;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
    this.onpause = null;
    this.onresume = null;
    this.onmark = null;
    this.onboundary = null;
  }
  SpeechSynthesisUtterance.prototype.addEventListener = addListener;
  SpeechSynthesisUtterance.prototype.removeEventListener = removeListener;
  SpeechSynthesisUtterance.prototype.dispatchEvent = dispatchEventImpl;

  // ---- state ------------------------------------------------------------------------------

  var port = null;
  var voices = [];
  var voicesKey = '[]';
  var queue = [];      // records not started yet, in speak() order
  var current = null;  // record that reported "start"
  var paused = false;
  var nextId = 1;
  var records = {};    // id -> record still in flight
  var waitingForPort = [];

  function num(v, d) {
    var n = Number(v);
    return isFinite(n) ? n : d;
  }

  function str(v, max) {
    return typeof v === 'string' ? v.substring(0, max) : '';
  }

  function docLang() {
    var el = document.documentElement;
    return el && el.lang ? String(el.lang) : '';
  }

  /* Messages are pure ASCII JSON: WebView 69 corrupts strings whose characters all fit in
     Latin-1 (e.g. "Câu B", "con chó") on their way through a WebMessagePort, so every
     non-ASCII character is written as a \uXXXX escape. */
  var NON_ASCII = /[\u007f-￿]/g;
  function escapeChar(c) { return '\\u' + ('000' + c.charCodeAt(0).toString(16)).slice(-4); }

  function post(msg) {
    if (!port) return false;
    try { port.postMessage(stringify(msg).replace(NON_ASCII, escapeChar)); return true; } catch (e) { return false; }
  }

  function removeFrom(list, rec) {
    var i = list.indexOf(rec);
    if (i >= 0) list.splice(i, 1);
  }

  /** Terminal event for one record: exactly one "end" or "error", never both. */
  function settle(rec, type, code) {
    if (!rec || rec.done) return;
    rec.done = true;
    delete records[rec.id];
    if (rec.timer) unlater(rec.timer);
    removeFrom(queue, rec);
    removeFrom(waitingForPort, rec);
    if (current === rec) current = null;
    var extra = { utterance: rec.u, charIndex: 0, charLength: 0, name: '', elapsedTime: rec.t0 ? now() - rec.t0 : 0 };
    if (type === 'error') extra.error = code;
    fire(rec.u, type, makeEvent(type, rec.u, extra));
  }

  /** Marks records finished now (state is synchronous) and fires their errors on a later task. */
  function dropLater(list) {
    var fired = [];
    for (var i = 0; i < list.length; i++) {
      var r = list[i];
      if (r.done) continue;
      r.done = true;
      delete records[r.id];
      if (r.timer) unlater(r.timer);
      fired.push(r);
    }
    if (!fired.length) return;
    later(function () {
      for (var j = 0; j < fired.length; j++) {
        var rec = fired[j];
        var code = rec.started ? 'interrupted' : 'canceled';
        fire(rec.u, 'error', makeEvent('error', rec.u, {
          utterance: rec.u, charIndex: 0, charLength: 0, name: '', error: code,
          elapsedTime: rec.t0 ? now() - rec.t0 : 0
        }));
      }
    });
  }

  /* Every transmission gets a fresh id, so late events for an earlier attempt (before a
     pause/resume or a new channel) can never be taken for this one. */
  function transmit(rec) {
    if (rec.id) delete records[rec.id];
    rec.id = nextId++;
    rec.msg.id = rec.id;
    records[rec.id] = rec;
    rec.sent = true;
    if (!post(rec.msg)) later(function () { settle(rec, 'error', 'synthesis-failed'); });
  }

  function forget(rec) {
    if (rec.id) delete records[rec.id];
    rec.id = 0;
    rec.sent = false;
  }

  function send(rec) {
    if (port) {
      transmit(rec);
      return;
    }
    if (waitingForPort.length >= MAX_PRE_PORT) {
      later(function () { settle(rec, 'error', 'synthesis-unavailable'); });
      return;
    }
    waitingForPort.push(rec);
    rec.timer = later(function () {
      rec.timer = 0;
      if (!port) settle(rec, 'error', 'synthesis-unavailable');
    }, PRE_PORT_TIMEOUT_MS);
  }

  // ---- messages from the app ----------------------------------------------------------------

  function setVoices(list) {
    if (!Array.isArray(list)) return;
    var out = [];
    var plain = [];
    for (var i = 0; i < list.length && out.length < 64; i++) {
      var v = list[i];
      if (!v || typeof v.voiceURI !== 'string' || !v.voiceURI) continue;
      var p = {
        voiceURI: str(v.voiceURI, 256),
        name: str(v.name, 256) || str(v.voiceURI, 256),
        lang: str(v.lang, 64),
        'default': v['default'] === true
      };
      plain.push(p);
      out.push(makeVoice(p));
    }
    var key = stringify(plain);
    if (key === voicesKey) return;
    voicesKey = key;
    voices = out;
    later(function () { fire(synth, 'voiceschanged', makeEvent('voiceschanged', synth)); });
  }

  function onAppMessage(e) {
    var m;
    try { m = parse(e.data); } catch (x) { return; }
    if (!m || typeof m !== 'object') return;
    var rec = typeof m.id === 'number' ? records[m.id] : null;
    switch (m.t) {
      case 'voices':
        setVoices(m.voices);
        break;
      case 'start':
        if (!rec || rec.started) return;
        removeFrom(queue, rec);
        if (current && current !== rec) settle(current, 'error', 'interrupted');
        rec.started = true;
        rec.t0 = now();
        current = rec;
        fire(rec.u, 'start', makeEvent('start', rec.u, { utterance: rec.u, charIndex: 0, charLength: 0, name: '', elapsedTime: 0 }));
        break;
      case 'end':
        settle(rec, 'end');
        break;
      case 'error':
        settle(rec, 'error', ERRORS.indexOf(m.error) >= 0 ? m.error : 'synthesis-failed');
        break;
      case 'boundary':
        if (!rec || !rec.started) return;
        fire(rec.u, 'boundary', makeEvent('boundary', rec.u, {
          utterance: rec.u, charIndex: num(m.charIndex, 0) | 0, charLength: num(m.charLength, 0) | 0,
          name: m.name === 'sentence' ? 'sentence' : 'word', elapsedTime: rec.t0 ? now() - rec.t0 : 0
        }));
        break;
    }
  }

  function attach(p) {
    if (port) {
      // The app opened a new channel for this page: what was sent on the old one is gone.
      try { port.onmessage = null; port.close(); } catch (x) {}
      var lost = [];
      if (current) lost.push(current);
      for (var i = 0; i < queue.length; i++) if (queue[i].sent) lost.push(queue[i]);
      for (var j = 0; j < lost.length; j++) removeFrom(queue, lost[j]);
      current = null;
      dropLater(lost);
    }
    port = p;
    port.onmessage = onAppMessage;
    post({ op: 'hello', v: 1 });
    var pending = waitingForPort;
    waitingForPort = [];
    for (var k = 0; k < pending.length; k++) {
      var rec = pending[k];
      if (rec.done) continue;
      if (rec.timer) { unlater(rec.timer); rec.timer = 0; }
      if (!paused) transmit(rec);
    }
  }

  // Only a message posted by the app itself (no source window) carries the port.
  W.addEventListener('message', function (e) {
    if (e.data !== CHANNEL || !e.ports || !e.ports[0]) return;
    if (e.source !== null && e.source !== undefined) return;
    e.stopImmediatePropagation();
    attach(e.ports[0]);
  }, true);

  // ---- SpeechSynthesis --------------------------------------------------------------------

  function SpeechSynthesis() { throw new TypeError('Illegal constructor'); }

  function speak(u) {
    if (!(u instanceof SpeechSynthesisUtterance)) {
      throw new TypeError("Failed to execute 'speak' on 'SpeechSynthesis': parameter 1 is not of type 'SpeechSynthesisUtterance'.");
    }
    var text = u.text == null ? '' : String(u.text);
    var rec = { id: 0, u: u, started: false, done: false, sent: false, timer: 0, t0: 0 };
    if (text.length > MAX_BROWSER_TEXT) {
      later(function () { fire(u, 'error', makeEvent('error', u, { utterance: u, charIndex: 0, charLength: 0, name: '', elapsedTime: 0, error: 'text-too-long' })); });
      return;
    }
    var v = u.voice;
    rec.msg = {
      op: 'speak',
      id: 0,
      text: text.length > MAX_TEXT ? text.substring(0, MAX_TEXT) : text,
      lang: str(String(u.lang || (v && v.lang) || docLang() || ''), 64),
      voice: v && typeof v.voiceURI === 'string' ? str(v.voiceURI, 256) : '',
      rate: num(u.rate, 1),
      pitch: num(u.pitch, 1),
      volume: num(u.volume, 1)
    };
    queue.push(rec);
    if (!paused) send(rec);
  }

  function cancel() {
    var list = [];
    if (current) list.push(current);
    list = list.concat(queue);
    var tellApp = false;
    for (var i = 0; i < list.length; i++) if (list[i].sent && port) tellApp = true;
    queue = [];
    current = null;
    waitingForPort = [];
    dropLater(list);
    if (tellApp) post({ op: 'cancel' });
  }

  /* Android text-to-speech cannot pause: pause() stops the current utterance ("interrupted")
     and holds the rest of the queue until resume(). */
  function pause() {
    if (paused) return;
    paused = true;
    var stopped = current;
    var tellApp = !!stopped;
    current = null;
    for (var i = 0; i < queue.length; i++) {
      var rec = queue[i];
      if (rec.sent) tellApp = true;
      forget(rec);
      if (rec.timer) { unlater(rec.timer); rec.timer = 0; }
      removeFrom(waitingForPort, rec);
    }
    if (stopped) dropLater([stopped]);
    if (tellApp) post({ op: 'cancel' });
  }

  function resume() {
    if (!paused) return;
    paused = false;
    var list = queue.slice();
    for (var i = 0; i < list.length; i++) {
      if (!list[i].done && !list[i].sent) send(list[i]);
    }
  }

  function getVoices() {
    return voices.slice();
  }

  var proto = {
    speak: speak,
    cancel: cancel,
    pause: pause,
    resume: resume,
    getVoices: getVoices,
    addEventListener: addListener,
    removeEventListener: removeListener,
    dispatchEvent: dispatchEventImpl
  };
  for (var name in proto) hidden(SpeechSynthesis.prototype, name, proto[name]);
  Object.defineProperty(SpeechSynthesis.prototype, 'speaking', { get: function () { return !!current; }, configurable: true });
  Object.defineProperty(SpeechSynthesis.prototype, 'pending', { get: function () { return queue.length > 0; }, configurable: true });
  Object.defineProperty(SpeechSynthesis.prototype, 'paused', { get: function () { return paused; }, configurable: true });

  var synth = Object.create(SpeechSynthesis.prototype);
  synth.onvoiceschanged = null;

  // A page that goes away stops its speech (a new page gets a new channel).
  W.addEventListener('pagehide', function () { cancel(); });

  function install(prop, value) {
    try {
      Object.defineProperty(W, prop, { value: value, writable: true, configurable: true, enumerable: true });
    } catch (e) {
      try { W[prop] = value; } catch (x) {}
    }
  }
  install('speechSynthesis', synth);
  install('SpeechSynthesis', SpeechSynthesis);
  install('SpeechSynthesisUtterance', SpeechSynthesisUtterance);
  install('SpeechSynthesisVoice', SpeechSynthesisVoice);
  Object.defineProperty(W, '__kgpSpeechV1', { value: true });
})();
