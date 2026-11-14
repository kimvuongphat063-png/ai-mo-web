/*
 * Tô màu Gi & Shi — pick a picture, pick a color, tap an area: it fills up to the black lines
 * (scanline flood fill on a Uint32Array). Undo, eraser, done (frame + cheering).
 * Saved as a list of taps [x, y, color] per picture, replayed when the picture opens.
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var N_PICS = 6;
  var PAL = ['#F44336', '#FF9800', '#FFEB3B', '#8BC34A', '#2E9E4F', '#4FC3F7',
    '#1E63D6', '#9C27B0', '#FF80AB', '#FFD3B6', '#8D6E63', '#607D8B'];
  var ERASER = 12;
  var PIC = { x: 196, y: 52, s: 616 };   // picture box on screen
  var MAX_OPS = 400;

  function to32(hex) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
  }
  var COL32 = PAL.map(to32);
  COL32.push(0xFFFFFFFF);

  // ------------------------------------------------------------------ save
  var ops = [];
  var finished = [];
  for (var i = 0; i < N_PICS; i++) { ops.push([]); finished.push(0); }
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved) {
    for (i = 0; i < N_PICS; i++) {
      if (saved.ops && saved.ops[i] && saved.ops[i].length) ops[i] = saved.ops[i].slice(0, MAX_OPS * 3);
      finished[i] = saved.finished && saved.finished[i] ? 1 : 0;
    }
  }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, ops: ops, finished: finished }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ picture buffers
  var pi = 0;               // current picture
  var size = 0;             // source pixels (square)
  var off = null;           // offscreen canvas with the colored picture
  var octx = null;
  var img = null;           // ImageData of off
  var pix = null;           // Uint32Array view on img
  var mask = null;          // 1 = black line pixel
  var undo = [];            // {target, spans: Int32Array} (LIFO)
  var ready = false;
  var lastFillMs = 0;
  var maxFillMs = 0;
  var thumbs = [];          // small colored thumbnails made this session

  function build() {
    var im = K.img('coloring_' + (pi + 1));
    if (!im) return false;
    size = im.naturalWidth;
    off = document.createElement('canvas');   // fresh canvas: one pixel readback per canvas
    off.width = off.height = size;
    octx = off.getContext('2d');
    octx.fillStyle = '#ffffff';
    octx.fillRect(0, 0, size, size);
    octx.drawImage(im, 0, 0);
    img = octx.getImageData(0, 0, size, size);
    pix = new Uint32Array(img.data.buffer);
    mask = new Uint8Array(size * size);
    var d = img.data;
    for (var k = 0, n = size * size; k < n; k++) {
      var lum = d[k * 4] + d[k * 4 + 1] + d[k * 4 + 2];
      if (lum < 384) { mask[k] = 1; pix[k] = 0xFF000000; } else pix[k] = 0xFFFFFFFF;
    }
    undo = [];
    var list = ops[pi];
    var t0 = Date.now();
    for (k = 0; k + 2 < list.length; k += 3) fill(list[k], list[k + 1], list[k + 2], false);
    octx.putImageData(img, 0, 0);
    lastFillMs = list.length ? (Date.now() - t0) / (list.length / 3) : 0;
    ready = true;
    return true;
  }

  /** Nearest non-line pixel around (x, y) (taps often land on a line). */
  function seed(x, y) {
    x = Math.round(x);
    y = Math.round(y);
    for (var r = 0; r <= 8; r++) {
      for (var dy = -r; dy <= r; dy++) {
        for (var dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
          var xx = x + dx;
          var yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
          if (!mask[yy * size + xx]) return yy * size + xx;
        }
      }
    }
    return -1;
  }

  /**
   * Scanline flood fill; records filled spans for undo. Returns pixels changed.
   * Line pixels are pure black and no fill color is black, so "same color as the seed" already
   * stops at the lines (no mask lookup in the inner loops).
   */
  function fill(x, y, ci, record) {
    var s0 = seed(x, y);
    if (s0 < 0) return 0;
    var col = COL32[ci];
    var target = pix[s0];
    if (target === col) return 0;
    var Wd = size;
    var p = pix;
    var spans = [];
    var stack = [s0];
    var count = 0;
    var x0 = size, x1 = 0, y0 = size, y1 = 0;
    while (stack.length) {
      var idx = stack.pop();
      if (p[idx] !== target) continue;
      var yy = (idx / Wd) | 0;
      var row = yy * Wd;
      var l = idx;
      while (l > row && p[l - 1] === target) l--;
      var r = idx;
      var end = row + Wd - 1;
      while (r < end && p[r + 1] === target) r++;
      spans.push(l, r - l + 1);
      count += r - l + 1;
      if (l - row < x0) x0 = l - row;
      if (r - row > x1) x1 = r - row;
      if (yy < y0) y0 = yy;
      if (yy > y1) y1 = yy;
      var k;
      if (yy > 0) {
        var up = false;
        for (k = l - Wd; k <= r - Wd; k++) {
          var okU = p[k] === target;
          if (okU && !up) stack.push(k);
          up = okU;
        }
      }
      if (yy < size - 1) {
        var dn = false;
        for (k = l + Wd; k <= r + Wd; k++) {
          var okD = p[k] === target;
          if (okD && !dn) stack.push(k);
          dn = okD;
        }
      }
      for (k = l; k <= r; k++) p[k] = col;
    }
    if (record) {
      undo.push({ target: target, spans: new Int32Array(spans), box: [x0, y0, x1, y1] });
      if (undo.length > MAX_OPS) undo.shift();
      octx.putImageData(img, 0, 0, x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    }
    return count;
  }

  function doUndo() {
    var u = undo.pop();
    if (!u) { K.sfx.boing(); return; }
    var sp = u.spans;
    for (var k = 0; k < sp.length; k += 2) {
      for (var j = sp[k], e = sp[k] + sp[k + 1]; j < e; j++) pix[j] = u.target;
    }
    var b = u.box;
    octx.putImageData(img, 0, 0, b[0], b[1], b[2] - b[0] + 1, b[3] - b[1] + 1);
    ops[pi].splice(ops[pi].length - 3, 3);
    save();
    K.sfx.whoosh();
  }

  // ------------------------------------------------------------------ paint screen
  var sel = 0;
  var framed = 0;
  var lastTap = null;

  function openPic(k) {
    pi = (k + N_PICS) % N_PICS;
    ready = false;
    framed = 0;
    lastTap = null;
    K.go('paint');
  }
  function makeThumb() {
    if (!ready) return;
    var t = document.createElement('canvas');
    t.width = t.height = 220;
    t.getContext('2d').drawImage(off, 0, 0, 220, 220);
    thumbs[pi] = t;
  }

  var palPos = [];
  for (i = 0; i < 12; i++) palPos.push({ x: 902 + (i % 3) * 130, y: 128 + Math.floor(i / 3) * 128 });

  var menuBtn = K.button({ x: 98, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { makeThumb(); K.go('pick'); } });
  var undoBtn = K.button({ x: 98, y: 248, r: 50, icon: 'undo', color: '#F29E38', onTap: function () { if (ready) doUndo(); } });
  var eraserBtn = K.button({ x: 98, y: 404, r: 50, icon: 'eraser', color: '#9AA8BE', onTap: function () { sel = ERASER; } });
  var doneBtn = K.button({ x: 98, y: 600, r: 56, icon: 'check', color: '#2E9E4F', pulse: false, onTap: function () {
    if (!ready) return;
    finished[pi] = 1;
    save();
    makeThumb();
    framed = 0.001;
    K.fx.burst(PIC.x + PIC.s / 2, PIC.y + PIC.s / 2, 30, { kind: 'star' });
    K.showDone({
      title: K.pick(['Đẹp quá!', 'Giỏi quá!', 'Tuyệt vời!']),
      left: 'gi_clap', right: 'shi_clap',
      onReplay: function () { K.hideDone(); framed = 0; },
      onNext: function () { openPic(pi + 1); },
      onMenu: function () { K.go('pick'); }
    });
  } });

  K.screen('paint', {
    buttons: function () {
      eraserBtn.selected = sel === ERASER;
      doneBtn.pulse = ops[pi].length >= 15;
      return [menuBtn, undoBtn, eraserBtn, doneBtn];
    },
    enter: function () { build(); },
    leave: function () { makeThumb(); },
    down: function (p) {
      if (!ready) return;
      for (var k = 0; k < 12; k++) {
        if (K.dist(p.x, p.y, palPos[k].x, palPos[k].y) < 62) {
          sel = k;
          K.sfx.note(K.SCALE[k % 8] * 2, { vol: 0.1, len: 0.3 });
          return;
        }
      }
      if (p.x >= PIC.x && p.x < PIC.x + PIC.s && p.y >= PIC.y && p.y < PIC.y + PIC.s) {
        var ix = Math.floor((p.x - PIC.x) / PIC.s * size);
        var iy = Math.floor((p.y - PIC.y) / PIC.s * size);
        var t0 = (window.performance && performance.now) ? performance.now() : Date.now();
        var n = fill(ix, iy, sel, true);
        var t1 = (window.performance && performance.now) ? performance.now() : Date.now();
        lastFillMs = t1 - t0;
        if (lastFillMs > maxFillMs) maxFillMs = lastFillMs;
        if (n > 0) {
          if (ops[pi].length < MAX_OPS * 3) ops[pi].push(ix, iy, sel);
          save();
          K.sfx.good((ops[pi].length / 3) % 8);
          K.fx.burst(p.x, p.y, 6, { kind: 'spark', color: sel === ERASER ? '#ffffff' : PAL[sel], min: 60, max: 160, rmin: 8, rmax: 14 });
          lastTap = { x: p.x, y: p.y };
        } else {
          K.sfx.boing();
        }
      }
    },
    pause: function () { save(); },
    update: function (dt) {
      if (!ready) build();
      if (framed > 0) framed += dt;
    },
    render: function (c) {
      K.bg('#FFFFFF', '#FFF1E0');
      // picture card
      K.rr(PIC.x - 14, PIC.y - 14 + 8, PIC.s + 28, PIC.s + 28, 28);
      c.fillStyle = 'rgba(60,40,20,0.15)';
      c.fill();
      K.rr(PIC.x - 14, PIC.y - 14, PIC.s + 28, PIC.s + 28, 28);
      c.fillStyle = '#ffffff';
      c.fill();
      if (ready) {
        c.imageSmoothingEnabled = true;
        c.drawImage(off, PIC.x, PIC.y, PIC.s, PIC.s);
      } else {
        K.text('…', PIC.x + PIC.s / 2, PIC.y + PIC.s / 2, 80, '#999');
      }
      if (framed > 0) {
        var a = Math.min(1, framed / 0.4);
        c.save();
        c.globalAlpha = a;
        c.lineWidth = 26;
        c.strokeStyle = '#E2A13B';
        K.rr(PIC.x - 22, PIC.y - 22, PIC.s + 44, PIC.s + 44, 24);
        c.stroke();
        c.lineWidth = 8;
        c.strokeStyle = '#FFE08A';
        K.rr(PIC.x - 22, PIC.y - 22, PIC.s + 44, PIC.s + 44, 24);
        c.stroke();
        c.restore();
      }
      // palette
      for (var k = 0; k < 12; k++) {
        var pp = palPos[k];
        var on = sel === k;
        var r = on ? 56 : 48;
        K.circle(pp.x, pp.y + 5, r, 'rgba(40,40,60,0.18)');
        K.circle(pp.x, pp.y, r, PAL[k], '#ffffff', 6);
        c.beginPath();
        c.ellipse(pp.x - r * 0.3, pp.y - r * 0.38, r * 0.3, r * 0.15, -0.5, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.fill();
        if (on) K.circle(pp.x, pp.y, r + 9, null, '#2B4C7E', 6);
      }
      // hint: tap a color, then tap a white area
      if (ready && !K.isDone() && K.idle() > 5 && ops[pi].length === 0) {
        var cyc = (K.idle() - 5) % 3;
        var from = palPos[sel === ERASER ? 0 : sel];
        var to = { x: PIC.x + PIC.s * 0.5, y: PIC.y + PIC.s * 0.15 };
        var hx, hy, pr;
        if (cyc < 0.8) { hx = from.x; hy = from.y; pr = cyc < 0.4 ? cyc / 0.4 : 1 - (cyc - 0.4) / 0.4; }
        else if (cyc < 1.8) { var f = K.easeInOut(cyc - 0.8); hx = K.lerp(from.x, to.x, f); hy = K.lerp(from.y, to.y, f); pr = 0; }
        else { hx = to.x; hy = to.y; pr = cyc < 2.2 ? (cyc - 1.8) / 0.4 : 1; }
        K.drawHand(hx + 6, hy + 12, pr, K.clamp((K.idle() - 5) / 0.3, 0, 1));
      }
    }
  });

  // ------------------------------------------------------------------ pick a picture
  var tiles = K.grid(N_PICS, 3, 262, 262, 46, 40, { x: 0, y: 0, w: W, h: H });
  var pressed = -1;
  K.screen('pick', {
    down: function (p) {
      pressed = -1;
      for (var k = 0; k < tiles.length; k++) if (K.inRect(p, tiles[k], 6)) pressed = k;
    },
    up: function (p, cancel) {
      var k = pressed;
      pressed = -1;
      if (cancel || k < 0 || !K.inRect(p, tiles[k], 16)) return;
      K.sfx.click();
      openPic(k);
    },
    render: function (c) {
      K.bg('#FFFFFF', '#FFE9CC');
      var sug = -1;
      for (var k = 0; k < N_PICS; k++) if (!finished[k]) { sug = k; break; }
      for (k = 0; k < tiles.length; k++) {
        var r = tiles[k];
        K.tile(r.x, r.y, r.w, r.h, { done: !!finished[k], suggest: k === sug, pressed: k === pressed });
        var th = thumbs[k] || K.img('coloring_' + (k + 1) + '_thumb');
        if (th) c.drawImage(th, r.x + 21, r.y + 21 + (k === pressed ? 4 : 0), 220, 220);
        if (finished[k]) K.drawStar(r.x + r.w - 14, r.y + 14, 24, { rot: 0.12 });
      }
      if (!K.isDone()) {
        K.drawImg('gi_wave', 110, H - 6, 250, { bottom: true });
        K.drawImg('shi_wave', W - 110, H - 6, 250, { bottom: true });
      }
    }
  });

  K.screen('start', K.startScreen({
    title: 'Tô màu Gi & Shi', top: '#FFFFFF', bottom: '#FFE2C4', titleColor: '#E2574C', left: 'gi_wave', right: 'shi_wave',
    deco: function (c, t) {
      for (var k = 0; k < 6; k++) {
        K.circle(380 + k * 104, 340 + Math.sin(t * 2 + k) * 8, 34, PAL[k * 2], '#ffffff', 6);
      }
    },
    onPlay: function () { K.go('pick'); }
  }));

  window.__kg.info = function () {
    return { pic: pi, ready: ready, ops: ops[pi].length / 3, undo: undo.length, sel: sel, lastFillMs: lastFillMs, maxFillMs: maxFillMs,
      size: size, pic_box: PIC, pal: palPos, finished: finished };
  };
  window.__kg.pixel = function (sx, sy) {
    if (!ready) return null;
    var ix = Math.floor((sx - PIC.x) / PIC.s * size);
    var iy = Math.floor((sy - PIC.y) / PIC.s * size);
    var v = pix[iy * size + ix];
    return [v & 255, (v >> 8) & 255, (v >> 16) & 255, mask[iy * size + ix]];
  };
  window.__kg.region = function (sx, sy) {
    // size of the region under a screen point (for tests: pick big white areas)
    if (!ready) return 0;
    var ix = Math.floor((sx - PIC.x) / PIC.s * size);
    var iy = Math.floor((sy - PIC.y) / PIC.s * size);
    return mask[iy * size + ix] ? -1 : pix[iy * size + ix];
  };
  K.preload(['coloring_1_thumb', 'coloring_2_thumb', 'coloring_3_thumb', 'coloring_4_thumb', 'coloring_5_thumb', 'coloring_6_thumb']);
  K.start('start');
})();
