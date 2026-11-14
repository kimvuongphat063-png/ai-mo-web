/*
 * Tô chữ cái — trace the 29 Vietnamese print letters stroke by stroke (UPPER and lower case).
 * Marks (˘ ^ horn, bar of Đ) are separate strokes traced after the main shape.
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var SCALE = 3.8;                         // glyph units -> px (cap height 100 units = 380 px)
  var LETTER_H = 100 * SCALE;
  var ROAD = Math.round(LETTER_H * 0.17);  // guide width ~17% of the letter height
  var TOL = Math.max(30, Math.round(LETTER_H * 0.12));
  var CRAYONS = ['#FF6B4A', '#FF9F1C', '#2EB872', '#3D8BFD', '#9B5DE5', '#FF5DA2', '#00A6A6'];
  var AREA = { x: 330, y: 64, w: 560, h: 630 };
  // Optional picture + word (only words that are correct, familiar and drawable).
  var WORDS = {
    'B': ['ball', 'bóng'], 'C': ['fish', 'cá'], 'D': ['watermelon', 'dưa hấu'], 'H': ['flower', 'hoa'],
    'K': ['icecream', 'kem'], 'L': ['leaf', 'lá'], 'M': ['cat', 'mèo'], 'N': ['house', 'nhà'],
    'O': ['bee', 'ong'], 'Ô': ['umbrella', 'ô'], 'R': ['turtle', 'rùa'], 'S': ['star', 'sao'],
    'T': ['apple', 'táo'], 'V': ['elephant', 'voi'], 'X': ['car', 'xe']
  };

  // ------------------------------------------------------------------ save
  var N = GLYPHS.UPPER.length;
  var doneUp = [];
  var doneLo = [];
  var mode = 'up';
  for (var i = 0; i < N; i++) { doneUp.push(0); doneLo.push(0); }
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved) {
    for (i = 0; i < N; i++) {
      doneUp[i] = saved.up && saved.up[i] ? 1 : 0;
      doneLo[i] = saved.lo && saved.lo[i] ? 1 : 0;
    }
    if (saved.mode === 'lo') mode = 'lo';
  }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, up: doneUp, lo: doneLo, mode: mode }); }
  KidsSDK.onSave(save);
  function doneList() { return mode === 'up' ? doneUp : doneLo; }
  function letters() { return mode === 'up' ? GLYPHS.UPPER : GLYPHS.LOWER; }
  function suggested() {
    var d = doneList();
    for (var k = 0; k < d.length; k++) if (!d[k]) return k;
    return -1;
  }

  // ------------------------------------------------------------------ trace screen
  var idx = 0;
  var tr = null;
  var finished = 0;      // seconds since the letter was finished (0 = not yet)
  var center = { x: 0, y: 0 };
  var color = CRAYONS[0];

  function startLetter(k) {
    idx = (k + N) % N;
    var ch = letters()[idx];
    color = CRAYONS[idx % CRAYONS.length];
    var strokes = T.fit(T.compile(GLYPHS.get(ch), 2), SCALE, AREA);
    var b = T.bbox(strokes);
    center = { x: (b.x0 + b.x1) / 2, y: (b.y0 + b.y1) / 2 };
    finished = 0;
    tr = new T.Tracer(strokes, {
      width: ROAD, tol: TOL, color: color,
      onStroke: function (si, last) {
        K.sfx.ting();
        var st = strokes[si];
        var e = st.pts.length - 2;
        K.fx.burst(st.pts[e], st.pts[e + 1], 8, { kind: 'spark', min: 80, max: 200, rmin: 8, rmax: 14 });
        if (!last) K.cheer(idx % 2 ? 'gi_clap' : 'shi_clap', 'right', 1.0, 240);
      },
      onDone: function () {
        finished = 0.001;
        doneList()[idx] = 1;
        save();
        K.sfx.sparkle();
        K.fx.burst(center.x, center.y, 30, { kind: 'star' });
        K.cheer(idx % 2 ? 'shi_clap' : 'gi_clap', 'left', 2.4, 300);
      }
    });
    K.go('trace');
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('grid'); } });

  function drawCard(c) {
    var ch = letters()[idx];
    var w = WORDS[GLYPHS.UPPER[idx]];
    var x = 950;
    var y = 150;
    K.rr(x, y + 8, 250, 300, 30); c.fillStyle = 'rgba(40,60,90,0.15)'; c.fill();
    K.rr(x, y, 250, 300, 30); c.fillStyle = '#ffffff'; c.fill();
    if (finished > 0 && w) {
      var s = K.easeOutBack(finished / 0.5);
      ART.draw(c, w[0], x + 125, y + 112, 150 * s, { t: K.time });
      K.text(ch + ' – ' + w[1], x + 125, y + 250, w[1].length > 4 ? 40 : 50, '#2B4C7E', { lw: 8 });
    } else {
      GLYPHS.draw(c, ch, x + 125, y + 150, mode === 'up' ? 170 : 150, color);
    }
  }

  K.screen('trace', {
    buttons: [menuBtn],
    down: function (p) { tr.down(p); },
    move: function (p) { tr.move(p); },
    up: function (p, cancel) { tr.up(p, cancel); },
    pause: function () { save(); },
    update: function (dt) {
      tr.update(dt);
      if (finished > 0) {
        finished += dt;
        if (finished > 2.0 && !K.isDone()) {
          K.showDone({
            title: K.pick(['Giỏi quá!', 'Tuyệt vời!', 'Hoan hô!']),
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startLetter(idx); },
            onNext: function () { startLetter(idx + 1); },
            onMenu: function () { K.go('grid'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#E7F4FF', '#CBE6FF');
      c.fillStyle = 'rgba(255,255,255,0.5)';
      K.rr(AREA.x - 10, AREA.y - 6, AREA.w + 20, AREA.h + 6, 40);
      c.fill();
      K.dots(tr.s.length, tr.done ? tr.s.length : tr.cur, 640, 40, 11, color, tr.done ? -1 : tr.cur);
      c.save();
      if (finished > 0) {
        var b = 1 + Math.sin(Math.min(finished, 0.7) / 0.7 * Math.PI) * 0.12;
        c.translate(center.x, center.y - Math.sin(Math.min(finished, 0.7) / 0.7 * Math.PI) * 30);
        c.scale(b, b);
        c.translate(-center.x, -center.y);
      }
      tr.render(c);
      c.restore();
      drawCard(c);
      if (!finished) K.drawImg(idx % 2 ? 'shi_wave' : 'gi_wave', 170, H - 16, 300, { bottom: true });
      tr.renderHint(c, K.idle(), 4.5);
    }
  });

  // ------------------------------------------------------------------ letter grid
  var tiles = K.grid(32, 8, 122, 110, 22, 24, { x: 0, y: 0, w: W, h: H });
  var pill = { x: tiles[30].x, y: tiles[30].y, w: tiles[31].x + tiles[31].w - tiles[30].x, h: 110 };
  var pressed = -1;

  K.screen('grid', {
    down: function (p) {
      pressed = -1;
      for (var k = 0; k < N; k++) if (K.inRect(p, tiles[k], 8)) pressed = k;
      if (K.inRect(p, pill, 8)) pressed = p.x < pill.x + pill.w / 2 ? 100 : 101;
    },
    up: function (p, cancel) {
      var k = pressed;
      pressed = -1;
      if (cancel || k < 0) return;
      if (k >= 100) {
        if (!K.inRect(p, pill, 20)) return;
        var m = k === 100 ? 'up' : 'lo';
        if (m !== mode) { mode = m; save(); K.sfx.good(4); }
        return;
      }
      if (!K.inRect(p, tiles[k], 20)) return;
      K.sfx.click();
      startLetter(k);
    },
    render: function (c) {
      K.bg('#E7F4FF', '#C9E4FF');
      var L = letters();
      var d = doneList();
      var sug = suggested();
      for (var k = 0; k < N; k++) {
        var r = tiles[k];
        K.tile(r.x, r.y, r.w, r.h, { done: !!d[k], suggest: k === sug, pressed: k === pressed });
        GLYPHS.draw(c, L[k], r.x + r.w / 2, r.y + r.h / 2 + (k === pressed ? 4 : 0), mode === 'up' ? 56 : 50,
          d[k] ? CRAYONS[k % CRAYONS.length] : '#2B4C7E');
      }
      // UPPER / lower switch: two big cards "A" and "a"
      K.rr(pill.x - 6, pill.y - 6, pill.w + 12, pill.h + 12, 34);
      c.fillStyle = '#5B8DEF';
      c.fill();
      for (var h = 0; h < 2; h++) {
        var on = (h === 0) === (mode === 'up');
        var hx = pill.x + h * pill.w / 2 + 4;
        K.rr(hx, pill.y + 4, pill.w / 2 - 8, pill.h - 8, 28);
        c.fillStyle = on ? '#FFCD2E' : 'rgba(255,255,255,0.9)';
        c.fill();
        GLYPHS.draw(c, h ? 'a' : 'A', hx + (pill.w / 2 - 8) / 2, pill.y + pill.h / 2, 58, on ? '#7A4A00' : '#9AA8BE');
      }
    }
  });

  // ------------------------------------------------------------------ start + debug
  K.screen('start', K.startScreen({
    title: 'Tô chữ cái', top: '#E7F4FF', bottom: '#B9DCFF', titleColor: '#2F6FD6',
    left: 'gi_wave', right: 'shi_wave',
    deco: function (c, t) {
      var abc = ['A', 'Ă', 'Â', 'B', 'C', 'Đ'];
      for (var k = 0; k < abc.length; k++) {
        GLYPHS.draw(c, abc[k], 330 + k * 124, 336 + Math.sin(t * 2 + k) * 8, 52, '#ffffff', 20);
        GLYPHS.draw(c, abc[k], 330 + k * 124, 336 + Math.sin(t * 2 + k) * 8, 52, CRAYONS[k % CRAYONS.length]);
      }
    },
    onPlay: function () { K.go('grid'); }
  }));

  var debugCase = 'up';
  K.screen('debug', {
    down: function () { debugCase = debugCase === 'up' ? 'lo' : 'up'; },
    render: function (c) {
      K.bg('#ffffff');
      var L = debugCase === 'up' ? GLYPHS.UPPER : GLYPHS.LOWER;
      var cells = K.grid(L.length, 8, 156, 176, 2, 2, { x: 0, y: 0, w: W, h: H });
      for (var k = 0; k < L.length; k++) {
        var r = cells[k];
        c.strokeStyle = '#e3e3e3';
        c.lineWidth = 1;
        c.strokeRect(r.x, r.y, r.w, r.h);
        var st = T.compile(GLYPHS.get(L[k]), 2);
        T.debugDraw(c, T.fit(st, 0.9, { x: r.x, y: r.y + 14, w: r.w, h: r.h - 14 }), { t: L[k], x: r.x + 14, y: r.y + 14 });
      }
      K.text(debugCase === 'up' ? 'IN HOA (chạm để đổi)' : 'thường (chạm để đổi)', 1110, 690, 22, '#555', { lw: 4 });
    }
  });

  window.__kg.info = function () {
    return { mode: mode, idx: idx, ch: letters()[idx], done: tr ? tr.done : false, cur: tr ? tr.cur : 0,
      strokes: tr ? tr.s.map(function (s) { return { pts: s.pts, dot: s.dot }; }) : [] };
  };
  K.start(location.hash.indexOf('debug') >= 0 ? 'debug' : 'start');
})();
