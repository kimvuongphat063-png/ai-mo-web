/*
 * Kids Games Player SDK — apiVersion 1.
 *
 * Load this file BEFORE any gameplay or audio script. It has no dependencies and never
 * touches the network. It only manages: session state (active / muted), an audio registry,
 * save helpers, a paused-aware game loop and viewport helpers. Gameplay belongs to the game.
 *
 * Inside the Android player (hostname g-<32 hex>.invalid) the SDK starts INACTIVE and MUTED
 * and stays silent until the first host state arrives. In a normal browser (local preview)
 * it runs in "standalone" mode and asks for one tap when the browser blocks audio.
 * Recognising the hostname is only a compatibility hint, never an authorization.
 */
(function (global) {
  'use strict';

  var API_VERSION = 1;
  var HOST_RE = /^g-[a-f0-9]{32}\.invalid$/;
  var REASONS = ['start', 'resume', 'parent', 'background', 'home', 'restart', 'sound_changed'];
  var SAVE_KEY = 'kgp.save.v1';
  var SAVE_LIMIT_CHARS = 1024 * 1024;

  var hostMode = HOST_RE.test(String(global.location && global.location.hostname));
  var state = {
    hostActive: !hostMode,
    hostMuted: hostMode,
    pageVisible: !global.document.hidden,
    lastSeq: -1,
    lastReason: hostMode ? 'waiting' : 'standalone'
  };
  var activeListeners = [];
  var saveListeners = [];

  function isActive() {
    return state.hostActive && state.pageVisible;
  }

  function isMuted() {
    return state.hostMuted || !isActive();
  }

  function safeCall(fn, a, b) {
    try {
      fn(a, b);
    } catch (e) {
      if (global.console) global.console.error('KidsSDK listener error', e);
    }
  }

  // ---------------------------------------------------------------- audio registry
  var ctx = null;
  var master = null;
  var media = [];
  var tapOverlay = null;

  function audioContext() {
    if (ctx) return ctx;
    var AC = global.AudioContext || global.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = isMuted() ? 0 : 1;
    master.connect(ctx.destination);
    if (!isActive() && ctx.state === 'running') ctx.suspend();
    return ctx;
  }

  /** Every Web Audio source of the game must connect to this node. */
  function output() {
    audioContext();
    return master;
  }

  function registerMedia(el) {
    el.muted = isMuted();
    media.push({ el: el, resumeOnActive: false });
    return el;
  }

  function createAudio(src, options) {
    var el = new global.Audio();
    el.preload = 'auto';
    el.loop = !!(options && options.loop);
    if (options && typeof options.volume === 'number') el.volume = options.volume;
    el.src = src;
    return registerMedia(el);
  }

  /** Plays a registered media element; returns a Promise<boolean>. Never plays while inactive. */
  function playMedia(el) {
    if (!isActive()) return Promise.resolve(false);
    el.muted = isMuted();
    try {
      if (!el.loop) el.currentTime = 0;
    } catch (e) { /* not seekable yet */ }
    var p;
    try {
      p = el.play();
    } catch (e) {
      showTapToPlay();
      return Promise.resolve(false);
    }
    if (p && typeof p.then === 'function') {
      return p.then(function () { return true; }, function () {
        showTapToPlay();
        return false;
      });
    }
    return Promise.resolve(true);
  }

  function decode(arrayBuffer) {
    var c = audioContext();
    if (!c) return Promise.reject(new Error('no audio'));
    return new Promise(function (resolve, reject) {
      var r = c.decodeAudioData(arrayBuffer, resolve, reject);
      if (r && typeof r.then === 'function') r.then(resolve, reject);
    });
  }

  /** Loads a local sound file into an AudioBuffer (fetch + decode). */
  function loadBuffer(url) {
    return global.fetch(url).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + url);
      return res.arrayBuffer();
    }).then(decode);
  }

  function ensureRunning() {
    if (!ctx || !isActive()) return;
    if (ctx.state !== 'running') {
      var check = function () {
        if (isActive() && ctx.state !== 'running') showTapToPlay();
      };
      try {
        ctx.resume().then(check, check);
      } catch (e) { check(); }
      global.setTimeout(check, 500);
    }
  }

  /** Plays a decoded buffer through the master gain. Silently ignored while inactive. */
  function playBuffer(buffer, options) {
    if (!buffer || !isActive()) return null;
    var c = audioContext();
    if (!c) return null;
    ensureRunning();
    var src = c.createBufferSource();
    src.buffer = buffer;
    if (options && options.rate) src.playbackRate.value = options.rate;
    var gain = c.createGain();
    gain.gain.value = options && typeof options.volume === 'number' ? options.volume : 1;
    src.connect(gain);
    gain.connect(master);
    src.start();
    return src;
  }

  /** Small synthesized tone for feedback sounds without files. */
  function tone(freq, duration, options) {
    if (!isActive()) return;
    var c = audioContext();
    if (!c) return;
    ensureRunning();
    var o = c.createOscillator();
    var g = c.createGain();
    var t = c.currentTime;
    var vol = options && typeof options.volume === 'number' ? options.volume : 0.2;
    o.type = (options && options.type) || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (options && options.slideTo) o.frequency.exponentialRampToValueAtTime(options.slideTo, t + duration);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + duration + 0.02);
  }

  function applyAudio() {
    var muted = isMuted();
    if (master && ctx) {
      try {
        master.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);
      } catch (e) {
        master.gain.value = muted ? 0 : 1;
      }
    }
    var i;
    for (i = 0; i < media.length; i++) media[i].el.muted = muted;
    if (!isActive()) {
      if (ctx && ctx.state === 'running') ctx.suspend();
      for (i = 0; i < media.length; i++) {
        var m = media[i];
        if (!m.el.paused) {
          // Only looping music resumes later; one-shot effects are not replayed.
          m.resumeOnActive = m.el.loop;
          m.el.pause();
        }
      }
      hideTapToPlay();
    } else {
      ensureRunning();
      for (i = 0; i < media.length; i++) {
        if (media[i].resumeOnActive) {
          media[i].resumeOnActive = false;
          playMedia(media[i].el);
        }
      }
    }
  }

  // ---------------------------------------------------------------- tap-to-play fallback
  function showTapToPlay() {
    if (tapOverlay || !isActive() || !global.document.body) return;
    var d = global.document.createElement('div');
    d.setAttribute('data-kgp', 'tap-to-play');
    d.style.cssText = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;display:flex;flex-direction:column;' +
      'align-items:center;justify-content:center;background:rgba(16,32,31,0.55);touch-action:none;' +
      'font-family:system-ui,sans-serif;color:#fff;user-select:none;-webkit-user-select:none;';
    d.innerHTML = '<div style="width:140px;height:140px;border-radius:50%;background:#227C78;display:flex;' +
      'align-items:center;justify-content:center;box-shadow:0 8px 24px rgba(0,0,0,.3)">' +
      '<div style="width:0;height:0;border-left:52px solid #fff;border-top:32px solid transparent;' +
      'border-bottom:32px solid transparent;margin-left:14px"></div></div>' +
      '<div style="margin-top:18px;font-size:28px;font-weight:700">Chạm để chơi</div>';
    d.addEventListener('pointerup', function (ev) {
      ev.preventDefault();
      var c = audioContext();
      if (c && c.state !== 'running') {
        try { c.resume(); } catch (e) { /* ignore */ }
      }
      for (var i = 0; i < media.length; i++) {
        if (media[i].resumeOnActive || (media[i].el.loop && media[i].el.paused)) {
          media[i].resumeOnActive = false;
          playMedia(media[i].el);
        }
      }
      hideTapToPlay();
    });
    global.document.body.appendChild(d);
    tapOverlay = d;
  }

  function hideTapToPlay() {
    if (tapOverlay && tapOverlay.parentNode) tapOverlay.parentNode.removeChild(tapOverlay);
    tapOverlay = null;
  }

  // ---------------------------------------------------------------- lifecycle
  function emitSave(reason) {
    for (var i = 0; i < saveListeners.length; i++) safeCall(saveListeners[i], reason);
  }

  function update(nextHostActive, nextHostMuted, nextVisible, reason, requestSave) {
    var wasActive = isActive();
    state.hostActive = nextHostActive;
    state.hostMuted = nextHostMuted;
    state.pageVisible = nextVisible;
    state.lastReason = reason;
    var nowActive = isActive();
    // Mute first, then notify the game so it can pause and checkpoint.
    applyAudio();
    if (wasActive !== nowActive) {
      for (var i = 0; i < activeListeners.length; i++) safeCall(activeListeners[i], nowActive, reason);
    }
    if (requestSave || (wasActive && !nowActive)) emitSave(reason);
  }

  global.KidsPlayerGame = {
    apiVersion: API_VERSION,
    onHostState: function (s) {
      if (!s || typeof s !== 'object') return;
      if (s.apiVersion !== API_VERSION || typeof s.seq !== 'number') return;
      if (s.seq <= state.lastSeq) return;
      if (REASONS.indexOf(s.reason) < 0) return;
      state.lastSeq = s.seq;
      update(s.active === true, s.muted !== false, state.pageVisible, s.reason, s.requestSave === true);
    }
  };

  global.document.addEventListener('visibilitychange', function () {
    update(state.hostActive, state.hostMuted, !global.document.hidden, global.document.hidden ? 'background' : 'resume', global.document.hidden);
  });
  global.addEventListener('pagehide', function () {
    emitSave('pagehide');
  });

  // ---------------------------------------------------------------- save helpers
  var save = {
    /**
     * Returns the saved object, or null. Saves with an older saveSchemaVersion are passed
     * through migrate(old) when provided; newer or broken data is ignored, never fatal.
     */
    read: function (schemaVersion, migrate) {
      try {
        var raw = global.localStorage.getItem(SAVE_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || typeof data !== 'object' || typeof data.saveSchemaVersion !== 'number') return null;
        if (data.saveSchemaVersion === schemaVersion) return data;
        if (data.saveSchemaVersion < schemaVersion && typeof migrate === 'function') {
          var migrated = migrate(data);
          if (migrated && migrated.saveSchemaVersion === schemaVersion) return migrated;
        }
        return null;
      } catch (e) {
        return null;
      }
    },
    /** Writes a small JSON checkpoint. Returns false (never throws) on quota/serialization errors. */
    write: function (obj) {
      try {
        if (!obj || typeof obj.saveSchemaVersion !== 'number') throw new Error('saveSchemaVersion required');
        var text = JSON.stringify(obj);
        if (text.length > SAVE_LIMIT_CHARS) throw new Error('save too large');
        global.localStorage.setItem(SAVE_KEY, text);
        return true;
      } catch (e) {
        if (global.console) global.console.warn('KidsSDK save failed: ' + e.message);
        return false;
      }
    },
    clear: function () {
      try { global.localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
    }
  };

  // ---------------------------------------------------------------- loop
  /**
   * requestAnimationFrame loop. update(dt) is skipped while inactive and dt is clamped
   * (max 50 ms) so a resume never produces a big physics jump. render() runs every frame.
   */
  function loop(updateFn, renderFn) {
    var last = null;
    function frame(t) {
      if (isActive()) {
        if (last !== null) {
          var dt = Math.min((t - last) / 1000, 0.05);
          if (dt > 0) updateFn(dt);
        }
        last = t;
      } else {
        last = null;
      }
      if (renderFn) renderFn();
      global.requestAnimationFrame(frame);
    }
    global.requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- viewport
  /**
   * Fits a canvas with a fixed logical size (default 1280x720) into the window, keeping the
   * aspect ratio (letterbox) and capping the device pixel ratio. Returns helpers to map
   * pointer coordinates into logical units.
   */
  function fitCanvas(canvas, logicalWidth, logicalHeight, maxDpr) {
    var W = logicalWidth || 1280;
    var H = logicalHeight || 720;
    var cap = maxDpr || 2;
    var view = { scale: 1, dpr: 1, ctx: canvas.getContext('2d') };
    function resize() {
      var vw = global.innerWidth;
      var vh = global.innerHeight;
      var scale = Math.min(vw / W, vh / H);
      var dpr = Math.min(global.devicePixelRatio || 1, cap);
      canvas.style.width = Math.floor(W * scale) + 'px';
      canvas.style.height = Math.floor(H * scale) + 'px';
      canvas.width = Math.max(1, Math.floor(W * scale * dpr));
      canvas.height = Math.max(1, Math.floor(H * scale * dpr));
      view.scale = scale;
      view.dpr = dpr;
      view.ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    }
    view.toLogical = function (clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      return { x: (clientX - r.left) * W / r.width, y: (clientY - r.top) * H / r.height };
    };
    view.resize = resize;
    global.addEventListener('resize', resize);
    resize();
    return view;
  }

  /** Same idea for DOM games: scales a fixed-size stage element with CSS transform. */
  function fitStage(stage, logicalWidth, logicalHeight) {
    var W = logicalWidth || 1280;
    var H = logicalHeight || 720;
    var view = { scale: 1 };
    function resize() {
      var scale = Math.min(global.innerWidth / W, global.innerHeight / H);
      stage.style.width = W + 'px';
      stage.style.height = H + 'px';
      stage.style.transformOrigin = '0 0';
      stage.style.transform = 'translate(' + Math.floor((global.innerWidth - W * scale) / 2) + 'px,' +
        Math.floor((global.innerHeight - H * scale) / 2) + 'px) scale(' + scale + ')';
      view.scale = scale;
    }
    view.toLogical = function (clientX, clientY) {
      var r = stage.getBoundingClientRect();
      return { x: (clientX - r.left) * W / r.width, y: (clientY - r.top) * H / r.height };
    };
    view.resize = resize;
    global.addEventListener('resize', resize);
    resize();
    return view;
  }

  global.KidsSDK = {
    apiVersion: API_VERSION,
    mode: hostMode ? 'host' : 'standalone',
    isActive: isActive,
    isMuted: isMuted,
    lastReason: function () { return state.lastReason; },
    onActiveChange: function (cb) { activeListeners.push(cb); },
    onSave: function (cb) { saveListeners.push(cb); },
    audio: {
      context: audioContext,
      output: output,
      createAudio: createAudio,
      registerMedia: registerMedia,
      play: playMedia,
      loadBuffer: loadBuffer,
      playBuffer: playBuffer,
      tone: tone
    },
    save: save,
    loop: loop,
    fitCanvas: fitCanvas,
    fitStage: fitStage,
    showTapToPlay: showTapToPlay
  };
})(window);
