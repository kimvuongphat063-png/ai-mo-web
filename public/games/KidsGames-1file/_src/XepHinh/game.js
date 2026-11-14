/*
 * Xếp hình Gi & Shi — drag the picture pieces from both sides into the frame (a faint picture
 * shows where they go). A piece snaps in within ~60 px of its place; otherwise it slides home.
 * Levels: 2x2, 3x2, 3x3 (rounded rectangle pieces).
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var N_PICS = 6;
  var GRIDS = [[2, 2], [3, 2], [3, 3]];
  var BOARD = { x: 400, y: 150, s: 480 };
  var SNAP = 60;

  // ------------------------------------------------------------------ save
  var done = {};
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved && saved.done) done = saved.done;
  function key(p, l) { return p + '-' + l; }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, done: done }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ play
  var pi = 0;
  var li = 0;
  var pieces = [];   // {c, r, w, h, tx, ty, hx, hy, x, y, placed, back, flash}
  var drag = null;
  var finish = 0;

  function homes(n, pw, ph) {
    var out = [];
    var cols = pw >= 200 ? [[200], [1080]] : [[132, 296], [984, 1148]];
    var rows = ph >= 200 ? [272, 532] : [228, 402, 576];
    for (var s = 0; s < 2; s++) {
      for (var r = 0; r < rows.length; r++) {
        for (var c = 0; c < cols[s].length; c++) out.push({ x: cols[s][c], y: rows[r] });
      }
    }
    return K.shuffle(out).slice(0, n);
  }

  function startLevel(p, l) {
    pi = p;
    li = l;
    var g = GRIDS[li];
    var pw = BOARD.s / g[0];
    var ph = BOARD.s / g[1];
    var hs = homes(g[0] * g[1], pw, ph);
    pieces = [];
    var k = 0;
    for (var r = 0; r < g[1]; r++) {
      for (var c = 0; c < g[0]; c++) {
        var h = hs[k++];
        pieces.push({ c: c, r: r, w: pw, h: ph, tx: BOARD.x + c * pw + pw / 2, ty: BOARD.y + r * ph + ph / 2,
          hx: h.x + K.rand(-6, 6), hy: h.y + K.rand(-6, 6), x: 0, y: 0, placed: false, back: 0, flash: 0 });
      }
    }
    K.shuffle(pieces);
    pieces.forEach(function (q) { q.x = q.hx; q.y = q.hy; });
    drag = null;
    finish = 0;
    K.go('play');
  }
  function nextLevel() {
    var l = li + 1;
    var p = pi;
    if (l >= GRIDS.length) { l = 0; p = (p + 1) % N_PICS; }
    startLevel(p, l);
  }

  function release(cancel) {
    if (!drag) return;
    var q = pieces[drag.k];
    drag = null;
    if (!cancel && K.dist(q.x, q.y, q.tx, q.ty) <= SNAP) {
      q.placed = true;
      q.x = q.tx;
      q.y = q.ty;
      q.flash = 1;
      K.sfx.snap();
      K.fx.burst(q.tx, q.ty, 10, { kind: 'spark', min: 80, max: 200 });
      // placed pieces go to the bottom of the stack
      pieces.unshift(pieces.splice(pieces.indexOf(q), 1)[0]);
      if (pieces.every(function (x) { return x.placed; })) {
        finish = 0.001;
        done[key(pi, li)] = 1;
        save();
        K.sfx.sparkle();
        K.fx.confetti(40);
        K.cheer('shi_cheer', 'right', 2.2, 280);
      }
    } else {
      q.back = 1;
      if (!cancel && K.dist(q.x, q.y, BOARD.x + BOARD.s / 2, BOARD.y + BOARD.s / 2) < BOARD.s / 2) K.sfx.boing();
    }
  }

  function drawPiece(c, im, q, lift) {
    var sw = im.naturalWidth / GRIDS[li][0];
    var sh = im.naturalHeight / GRIDS[li][1];
    var x = q.x - q.w / 2;
    var y = q.y - q.h / 2;
    var rad = Math.min(16, q.w * 0.08);
    if (lift) {
      K.rr(x + 6, y + 12, q.w, q.h, rad);
      c.fillStyle = 'rgba(30,40,60,0.28)';
      c.fill();
    } else if (!q.placed) {
      K.rr(x + 3, y + 5, q.w, q.h, rad);
      c.fillStyle = 'rgba(30,40,60,0.18)';
      c.fill();
    }
    c.save();
    K.rr(x, y, q.w, q.h, q.placed ? 2 : rad);
    c.clip();
    c.drawImage(im, q.c * sw, q.r * sh, sw, sh, x, y, q.w, q.h);
    c.restore();
    if (!q.placed) {
      K.rr(x, y, q.w, q.h, rad);
      c.lineWidth = 4;
      c.strokeStyle = '#ffffff';
      c.stroke();
    }
    if (q.flash > 0) {
      c.save();
      c.globalAlpha = q.flash * 0.6;
      c.fillStyle = '#ffffff';
      c.fillRect(x, y, q.w, q.h);
      c.restore();
    }
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });

  K.screen('play', {
    buttons: [menuBtn],
    down: function (p) {
      if (drag || finish) return;
      for (var k = pieces.length - 1; k >= 0; k--) {
        var q = pieces[k];
        if (q.placed) continue;
        if (Math.abs(p.x - q.x) <= q.w / 2 + 10 && Math.abs(p.y - q.y) <= q.h / 2 + 10) {
          pieces.push(pieces.splice(k, 1)[0]);
          drag = { k: pieces.length - 1, id: p.id, dx: q.x - p.x, dy: q.y - p.y };
          q.back = 0;
          K.sfx.click();
          return;
        }
      }
    },
    move: function (p) {
      if (!drag || p.id !== drag.id) return;
      var q = pieces[drag.k];
      q.x = K.clamp(p.x + drag.dx, q.w / 2, W - q.w / 2);
      q.y = K.clamp(p.y + drag.dy, q.h / 2, H - q.h / 2);
    },
    up: function (p, cancel) {
      if (!drag || p.id !== drag.id) return;
      if (!cancel) this.move(p);
      release(cancel);
    },
    pause: function () { release(true); save(); },
    update: function (dt) {
      for (var k = 0; k < pieces.length; k++) {
        var q = pieces[k];
        q.flash = Math.max(0, q.flash - dt * 2.5);
        if (q.back > 0) {
          q.x += (q.hx - q.x) * Math.min(1, dt * 8);
          q.y += (q.hy - q.y) * Math.min(1, dt * 8);
          if (K.dist(q.x, q.y, q.hx, q.hy) < 1) { q.x = q.hx; q.y = q.hy; q.back = 0; }
        }
      }
      if (finish > 0) {
        finish += dt;
        if (finish > 2.0 && !K.isDone()) {
          K.showDone({
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startLevel(pi, li); },
            onNext: nextLevel,
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#E6F7F1', '#C3EBDD');
      K.dots(GRIDS.length, li + (finish ? 1 : 0), 640, 40, 11, '#2EB872', li);
      var im = K.img('scene_' + (pi + 1));
      // frame + faint guide picture (25%)
      K.rr(BOARD.x - 16, BOARD.y - 16 + 8, BOARD.s + 32, BOARD.s + 32, 26);
      c.fillStyle = 'rgba(30,60,50,0.18)';
      c.fill();
      K.rr(BOARD.x - 16, BOARD.y - 16, BOARD.s + 32, BOARD.s + 32, 26);
      c.fillStyle = '#ffffff';
      c.fill();
      if (!im) { K.text('…', 640, 390, 80, '#999'); return; }
      c.save();
      c.globalAlpha = 0.25;
      c.drawImage(im, BOARD.x, BOARD.y, BOARD.s, BOARD.s);
      c.restore();
      var g = GRIDS[li];
      c.strokeStyle = 'rgba(255,255,255,0.9)';
      c.lineWidth = 3;
      c.setLineDash([10, 10]);
      for (var k = 1; k < g[0]; k++) { c.beginPath(); c.moveTo(BOARD.x + k * BOARD.s / g[0], BOARD.y); c.lineTo(BOARD.x + k * BOARD.s / g[0], BOARD.y + BOARD.s); c.stroke(); }
      for (k = 1; k < g[1]; k++) { c.beginPath(); c.moveTo(BOARD.x, BOARD.y + k * BOARD.s / g[1]); c.lineTo(BOARD.x + BOARD.s, BOARD.y + k * BOARD.s / g[1]); c.stroke(); }
      c.setLineDash([]);
      for (k = 0; k < pieces.length; k++) drawPiece(c, im, pieces[k], drag && drag.k === k);
      if (finish > 0) {
        c.save();
        c.globalAlpha = K.clamp(finish / 0.5, 0, 1);
        c.drawImage(im, BOARD.x, BOARD.y, BOARD.s, BOARD.s);
        c.restore();
      }
      // hint: a hand brings one loose piece to its place
      if (!finish && !drag && K.idle() > 5) {
        var q = null;
        for (k = pieces.length - 1; k >= 0; k--) if (!pieces[k].placed) { q = pieces[k]; break; }
        if (q) {
          var cyc = (K.idle() - 5) % 2.6;
          var ph = K.easeInOut(K.clamp((cyc - 0.4) / 1.5, 0, 1));
          var hx = K.lerp(q.x, q.tx, ph);
          var hy = K.lerp(q.y, q.ty, ph);
          K.rr(hx - q.w / 2, hy - q.h / 2, q.w, q.h, 10);
          c.lineWidth = 6;
          c.strokeStyle = 'rgba(255,205,46,' + (0.9 * K.clamp((K.idle() - 5) / 0.3, 0, 1)).toFixed(2) + ')';
          c.stroke();
          K.drawHand(hx + 12, hy + 20, cyc < 2.1 ? 1 : 0, K.clamp((K.idle() - 5) / 0.3, 0, 1));
        }
      }
    }
  });

  // ------------------------------------------------------------------ menu: rows = 4, 6, 9 pieces
  function tileRect(p, l) { return { x: 76 + p * 192, y: 104 + l * 178, w: 170, h: 156 }; }
  var pressed = null;
  K.screen('menu', {
    down: function (p) {
      pressed = null;
      for (var a = 0; a < N_PICS; a++) for (var l = 0; l < GRIDS.length; l++) if (K.inRect(p, tileRect(a, l), 10)) pressed = [a, l];
    },
    up: function (p, cancel) {
      var pr = pressed;
      pressed = null;
      if (cancel || !pr || !K.inRect(p, tileRect(pr[0], pr[1]), 20)) return;
      K.sfx.click();
      startLevel(pr[0], pr[1]);
    },
    render: function (c) {
      K.bg('#E6F7F1', '#BFE9DA');
      var sug = null;
      for (var l = 0; l < GRIDS.length && !sug; l++) for (var a = 0; a < N_PICS; a++) if (!done[key(a, l)]) { sug = key(a, l); break; }
      for (l = 0; l < GRIDS.length; l++) {
        for (a = 0; a < N_PICS; a++) {
          var r = tileRect(a, l);
          var isP = pressed && pressed[0] === a && pressed[1] === l;
          K.tile(r.x, r.y, r.w, r.h, { done: !!done[key(a, l)], suggest: key(a, l) === sug, pressed: isP });
          var th = K.img('scene_' + (a + 1) + '_thumb');
          var s = 130;
          var x = r.x + (r.w - s) / 2;
          var y = r.y + (r.h - s) / 2 + (isP ? 4 : 0);
          if (th) {
            c.save();
            K.rr(x, y, s, s, 12);
            c.clip();
            c.drawImage(th, x, y, s, s);
            c.restore();
          }
          var g = GRIDS[l];
          c.strokeStyle = '#ffffff';
          c.lineWidth = 4;
          for (var k = 1; k < g[0]; k++) { c.beginPath(); c.moveTo(x + k * s / g[0], y); c.lineTo(x + k * s / g[0], y + s); c.stroke(); }
          for (k = 1; k < g[1]; k++) { c.beginPath(); c.moveTo(x, y + k * s / g[1]); c.lineTo(x + s, y + k * s / g[1]); c.stroke(); }
          if (done[key(a, l)]) K.drawStar(r.x + r.w - 14, r.y + 14, 24, { rot: 0.12 });
        }
      }
    }
  });

  K.screen('start', K.startScreen({
    title: 'Xếp hình Gi & Shi', top: '#E6F7F1', bottom: '#B8E6D6', titleColor: '#1E8E6A', left: 'gi_wave', right: 'shi_wave',
    deco: function (c, t) {
      var th = K.img('scene_3_thumb');
      if (!th) return;
      var half = th.naturalWidth / 2;
      var spots = [[435, 470, -0.18, 0, 0], [845, 480, 0.14, 1, 1]];
      for (var k = 0; k < spots.length; k++) {
        var sp = spots[k];
        c.save();
        c.translate(sp[0], sp[1] + Math.sin(t * 2 + k) * 6);
        c.rotate(sp[2]);
        K.rr(-62, -58, 130, 130, 14); c.fillStyle = 'rgba(30,60,50,0.2)'; c.fill();
        K.rr(-65, -65, 130, 130, 14);
        c.save(); c.clip();
        c.drawImage(th, sp[3] * half, sp[4] * half, half, half, -65, -65, 130, 130);
        c.restore();
        K.rr(-65, -65, 130, 130, 14); c.lineWidth = 5; c.strokeStyle = '#ffffff'; c.stroke();
        c.restore();
      }
    },
    onPlay: function () { K.go('menu'); }
  }));

  window.__kg.info = function () {
    return { pi: pi, li: li, finish: finish > 0, ready: !!K.img('scene_' + (pi + 1)),
      pieces: pieces.map(function (q) { return { x: q.x, y: q.y, tx: q.tx, ty: q.ty, placed: q.placed, w: q.w, h: q.h }; }) };
  };
  var thumbs = [];
  for (var t = 1; t <= N_PICS; t++) thumbs.push('scene_' + t + '_thumb');
  K.preload(thumbs);
  K.start('start');
})();
