/*
 * Đàn gõ cầu vồng — 8 rainbow xylophone bars (Đô Rê Mi Pha Son La Si Đô), many fingers at once,
 * slide across bars for a glissando. "Follow the light": the next bar of a public-domain folk
 * melody glows; tapping another bar still plays it and the light simply waits.
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var COLORS = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#7AC943', '#2EC4B6', '#3D8BFD', '#7B61FF', '#FF5DA2'];
  var NAMES = ['Đô', 'Rê', 'Mi', 'Pha', 'Son', 'La', 'Si', 'Đô'];
  // Public-domain melodies on C4..C5 (indices 0..7). Only icons are shown, never lyrics.
  var SONGS = [
    { id: 'twinkle', icon: 'star', notes: [0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0, 4, 4, 3, 3, 2, 2, 1, 4, 4, 3, 3, 2, 2, 1, 0, 0, 4, 4, 5, 5, 4, 3, 3, 2, 2, 1, 1, 0] },
    { id: 'jacques', icon: 'bell', notes: [0, 1, 2, 0, 0, 1, 2, 0, 2, 3, 4, 2, 3, 4, 4, 5, 4, 3, 2, 0, 4, 5, 4, 3, 2, 0, 7, 4, 7, 7, 4, 7] },
    { id: 'rowboat', icon: 'boat', notes: [0, 0, 0, 1, 2, 2, 1, 2, 3, 4, 7, 7, 7, 4, 4, 4, 2, 2, 2, 0, 0, 0, 4, 3, 2, 1, 0] },
    { id: 'farm', icon: 'pig', notes: [0, 0, 0, 4, 5, 5, 4, 2, 2, 1, 1, 0, 0, 0, 0, 4, 5, 5, 4, 2, 2, 1, 1, 0] },
    { id: 'joy', icon: 'music', notes: [2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 2, 1, 1, 2, 2, 3, 4, 4, 3, 2, 1, 0, 0, 1, 2, 1, 0, 0] }
  ];

  // ------------------------------------------------------------------ keys
  var KEYS = [];
  for (var i = 0; i < 8; i++) {
    var h = 400 - i * 17;
    KEYS.push({ i: i, x: 168 + i * 128, y: 452 + i * 4, w: 108, h: h, a: (i - 3.5) * 0.035, vib: 0, glow: 0 });
  }
  function keyAt(px, py) {
    for (var k = KEYS.length - 1; k >= 0; k--) {
      var q = KEYS[k];
      var dx = px - q.x;
      var dy = py - q.y;
      var lx = dx * Math.cos(q.a) + dy * Math.sin(q.a);
      var ly = -dx * Math.sin(q.a) + dy * Math.cos(q.a);
      if (Math.abs(lx) <= q.w / 2 + 8 && Math.abs(ly) <= q.h / 2 + 8) return k;
    }
    return -1;
  }

  // ------------------------------------------------------------------ save
  var songsDone = {};
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved && saved.songs) songsDone = saved.songs;
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, songs: songsDone }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ shared play state
  var mode = 'free';
  var song = null;
  var si = 0;
  var pos = 0;           // next note to play in follow mode
  var finish = 0;
  var fingers = {};      // pointer id -> key index (for glissando)
  var hop = 0;
  var played = 0;

  function strike(k) {
    var q = KEYS[k];
    q.vib = 1;
    q.glow = 1;
    hop = 1;
    played++;
    K.sfx.note(K.SCALE[k], { vol: 0.16, len: 1.2 });
    var top = q.y - q.h / 2;
    K.fx.note(q.x + Math.sin(q.a) * q.h / 2, top - 10, COLORS[k]);
    if (mode === 'follow' && !finish && k === song.notes[pos]) {
      pos++;
      if (pos >= song.notes.length) {
        finish = 0.001;
        songsDone[song.id] = 1;
        save();
        K.fx.burst(640, 260, 30, { kind: 'star' });
        K.cheer('shi_sparkle', 'left', 2.0, 280);
      }
    }
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });

  function startFree() { mode = 'free'; song = null; finish = 0; fingers = {}; K.go('play'); }
  function startSong(k) { mode = 'follow'; si = (k + SONGS.length) % SONGS.length; song = SONGS[si]; pos = 0; finish = 0; fingers = {}; K.go('play'); }

  function drawKey(c, q, lit) {
    c.save();
    c.translate(q.x, q.y);
    c.rotate(q.a + Math.sin(q.vib * 40) * 0.03 * q.vib);
    var s = 1 - q.vib * 0.03;
    c.scale(s, s);
    if (lit) {
      var a = 0.45 + 0.3 * Math.sin(K.time * 6);
      K.rr(-q.w / 2 - 16, -q.h / 2 - 16, q.w + 32, q.h + 32, 40);
      c.fillStyle = 'rgba(255,240,120,' + a.toFixed(2) + ')';
      c.fill();
    }
    K.rr(-q.w / 2, -q.h / 2 + 8, q.w, q.h, 28);
    c.fillStyle = 'rgba(40,30,20,0.25)';
    c.fill();
    var g = c.createLinearGradient(-q.w / 2, 0, q.w / 2, 0);
    g.addColorStop(0, COLORS[q.i]);
    g.addColorStop(0.5, COLORS[q.i]);
    g.addColorStop(1, 'rgba(0,0,0,0.12)');
    K.rr(-q.w / 2, -q.h / 2, q.w, q.h, 28);
    c.fillStyle = COLORS[q.i];
    c.fill();
    c.fillStyle = g;
    c.fill();
    c.lineWidth = 5;
    c.strokeStyle = '#ffffff';
    c.stroke();
    if (q.glow > 0) {
      K.rr(-q.w / 2, -q.h / 2, q.w, q.h, 28);
      c.fillStyle = 'rgba(255,255,255,' + (q.glow * 0.5).toFixed(2) + ')';
      c.fill();
    }
    c.beginPath();
    c.ellipse(-q.w * 0.18, -q.h * 0.22, q.w * 0.12, q.h * 0.18, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.fill();
    K.circle(0, -q.h / 2 + 30, 9, '#E9E2D6', 'rgba(0,0,0,0.25)', 2);
    K.circle(0, q.h / 2 - 30, 9, '#E9E2D6', 'rgba(0,0,0,0.25)', 2);
    K.text(NAMES[q.i], 0, q.h / 2 - 72, 30, '#ffffff', { stroke: 'rgba(0,0,0,0.25)', lw: 5 });
    c.restore();
  }

  function drawBell(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s / 100, s / 100);
    c.beginPath();
    c.moveTo(-40, 30); c.quadraticCurveTo(-36, -40, 0, -44); c.quadraticCurveTo(36, -40, 40, 30); c.lineTo(48, 40); c.lineTo(-48, 40); c.closePath();
    c.fillStyle = '#FFC93C'; c.fill();
    c.lineWidth = 5; c.strokeStyle = '#C98A10'; c.stroke();
    c.beginPath(); c.arc(0, 46, 11, 0, Math.PI * 2); c.fillStyle = '#C98A10'; c.fill();
    c.beginPath(); c.arc(0, -50, 8, 0, Math.PI * 2); c.lineWidth = 5; c.stroke();
    c.restore();
  }
  function songIcon(c, s, x, y, size) {
    if (s.icon === 'bell') drawBell(c, x, y, size);
    else if (s.icon === 'music') K.icon('music', x, y, size, '#7B61FF');
    else ART.draw(c, s.icon, x, y, size);
  }

  K.screen('play', {
    buttons: [menuBtn],
    down: function (p) {
      var k = keyAt(p.x, p.y);
      fingers[p.id] = k;
      if (k >= 0) strike(k);
    },
    move: function (p) {
      if (!(p.id in fingers)) return;
      var k = keyAt(p.x, p.y);
      if (k >= 0 && k !== fingers[p.id]) strike(k);
      fingers[p.id] = k;
    },
    up: function (p) { delete fingers[p.id]; },
    pause: function () { fingers = {}; save(); },
    update: function (dt) {
      for (var k = 0; k < KEYS.length; k++) {
        KEYS[k].vib = Math.max(0, KEYS[k].vib - dt * 2.2);
        KEYS[k].glow = Math.max(0, KEYS[k].glow - dt * 4);
      }
      hop = Math.max(0, hop - dt * 3);
      if (finish > 0) {
        finish += dt;
        if (finish > 1.6 && !K.isDone()) {
          K.showDone({
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startSong(si); },
            onNext: function () { startSong(si + 1); },
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#FFF8E7', '#FFE7B5');
      // two wooden rails behind the bars
      c.save();
      c.lineCap = 'round';
      c.lineWidth = 26;
      c.strokeStyle = '#B07A45';
      c.beginPath(); c.moveTo(110, 300); c.lineTo(1170, 360); c.stroke();
      c.beginPath(); c.moveTo(110, 610); c.lineTo(1170, 560); c.stroke();
      c.restore();
      var target = mode === 'follow' && !finish ? song.notes[pos] : -1;
      for (var k = 0; k < KEYS.length; k++) drawKey(c, KEYS[k], k === target);
      // mascots dance along
      var b = Math.abs(Math.sin(hop * Math.PI)) * 22;
      if (!K.isDone()) {
        K.drawImg('gi_wave', 1065, 232 - b, 210, { bottom: true });
        K.drawImg('shi_wave', 1195, 232 - Math.abs(Math.sin((hop + 0.3) * Math.PI)) * 18, 210, { bottom: true });
      }
      if (mode === 'follow') {
        // the melody as colored dots: done notes small, the next one big
        songIcon(c, song, 220, 92, 80);
        var n = song.notes.length;
        var from = Math.max(0, Math.min(pos - 3, n - 12));
        for (var j = 0; j < 12 && from + j < n; j++) {
          var idx = from + j;
          var x = 310 + j * 52;
          var r = idx === pos ? 20 : 14;
          K.circle(x, 92, r, idx < pos ? 'rgba(160,160,170,0.5)' : COLORS[song.notes[idx]], '#ffffff', 4);
        }
        K.rr(300, 140, 600, 14, 7);
        c.fillStyle = 'rgba(255,255,255,0.8)';
        c.fill();
        K.rr(300, 140, 600 * pos / n, 14, 7);
        c.fillStyle = '#2EB872';
        c.fill();
        if (!finish && K.idle() > 4.5) {
          var q = KEYS[target];
          var cyc = (K.idle() - 4.5) % 1.4;
          K.drawHand(q.x + 6, q.y + 40, cyc < 0.5 ? cyc / 0.5 : (cyc < 0.8 ? 1 : 0), K.clamp((K.idle() - 4.5) / 0.3, 0, 1));
        }
      }
    }
  });

  // ------------------------------------------------------------------ menu
  var FREE = { x: 90, y: 150, w: 400, h: 420 };
  function songRect(k) { return { x: 560 + (k % 3) * 230, y: 150 + Math.floor(k / 3) * 220, w: 200, h: 190 }; }
  var pressed = null;
  K.screen('menu', {
    down: function (p) {
      pressed = K.inRect(p, FREE, 10) ? 'free' : null;
      for (var k = 0; k < SONGS.length; k++) if (K.inRect(p, songRect(k), 10)) pressed = k;
    },
    up: function (p, cancel) {
      var pr = pressed;
      pressed = null;
      if (cancel || pr === null) return;
      if (pr === 'free') { if (K.inRect(p, FREE, 20)) { K.sfx.click(); startFree(); } return; }
      if (!K.inRect(p, songRect(pr), 20)) return;
      K.sfx.click();
      startSong(pr);
    },
    render: function (c) {
      K.bg('#FFF8E7', '#FFE2A8');
      K.tile(FREE.x, FREE.y, FREE.w, FREE.h, { pressed: pressed === 'free', color: '#ffffff' });
      for (var k = 0; k < 8; k++) {
        c.save();
        c.translate(FREE.x + 70 + k * 37, FREE.y + 200 + k * 2);
        K.rr(-15, -(120 - k * 6), 30, (240 - k * 12), 12);
        c.fillStyle = COLORS[k];
        c.fill();
        c.restore();
      }
      K.drawHand(FREE.x + 250, FREE.y + 300, 0.6, 1, 1.1);
      var sug = -1;
      for (k = 0; k < SONGS.length; k++) if (!songsDone[SONGS[k].id]) { sug = k; break; }
      for (k = 0; k < SONGS.length; k++) {
        var r = songRect(k);
        K.tile(r.x, r.y, r.w, r.h, { done: !!songsDone[SONGS[k].id], suggest: k === sug, pressed: pressed === k });
        songIcon(c, SONGS[k], r.x + r.w / 2, r.y + 80 + (pressed === k ? 4 : 0), 104);
        for (var d = 0; d < 5; d++) K.circle(r.x + r.w / 2 - 48 + d * 24, r.y + r.h - 32, 8, COLORS[SONGS[k].notes[d]]);
      }
      K.drawImg('shi_sparkle', 1120, H - 4, 290, { bottom: true });
    }
  });

  K.screen('start', K.startScreen({
    title: 'Đàn gõ cầu vồng', top: '#FFF8E7', bottom: '#FFDC9A', titleColor: '#E2574C', left: 'gi_wave', right: 'shi_sparkle',
    deco: function (c, t) {
      for (var k = 0; k < 8; k++) {
        c.save();
        c.translate(395 + k * 70, 340 + Math.sin(t * 3 + k * 0.6) * 6);
        K.rr(-26, -(70 - k * 4), 52, 140 - k * 8, 16);
        c.fillStyle = COLORS[k];
        c.fill();
        c.restore();
      }
    },
    onPlay: function () { K.go('menu'); }
  }));

  window.__kg.info = function () {
    return { mode: mode, song: song ? song.id : null, si: si, pos: pos, len: song ? song.notes.length : 0, next: song && !finish ? song.notes[pos] : -1,
      finish: finish > 0, played: played, keys: KEYS.map(function (q) { return [q.x, q.y]; }), songsDone: songsDone };
  };
  K.start('start');
})();
