/*
 * Bắt bóng đúng màu — soap bubbles float up slowly; tap the ones that match the target card.
 * Level 1 colors (each color has its own pattern), level 2 shapes, level 3 numbers 1-5.
 * Wrong bubble: soft wobble + low note, nothing is taken away. 10 right -> celebration.
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var GOAL = 10;
  var MAX_BUBBLES = 6;
  var COLORS = [
    { name: 'red', fill: '#F0484E', motif: 'heart' },
    { name: 'blue', fill: '#2F7CF6', motif: 'star' },
    { name: 'yellow', fill: '#F7C531', motif: 'dot' },
    { name: 'green', fill: '#39B54A', motif: 'leaf' },
    { name: 'purple', fill: '#9B5DE5', motif: 'moon' },
    { name: 'orange', fill: '#FF8C1A', motif: 'flower' }
  ];
  var SHAPES = ['circle', 'square', 'triangle', 'star'];
  var LEVELS = [
    { kind: 'color', targets: [0, 1, 2, 3, 4, 5] },
    { kind: 'shape', targets: [0, 1, 2, 3] },
    { kind: 'number', targets: [1, 2, 3, 4, 5] }
  ];
  var SHAPE_COLORS = ['#F0484E', '#2F7CF6', '#39B54A', '#9B5DE5', '#FF8C1A', '#E0457B'];

  // ------------------------------------------------------------------ save
  var done = {};
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved && saved.done) done = saved.done;
  function key(l, t) { return l + '-' + t; }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, done: done }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ motifs and bubble drawing
  function motif(c, m, x, y, s, col) {
    c.fillStyle = col;
    c.strokeStyle = col;
    c.beginPath();
    if (m === 'heart') K.heartPath(c, x, y + s * 0.05, s * 1.25);
    else if (m === 'star') K.starPath(c, x, y + s * 0.04, s * 0.62, s * 0.27, 5);
    else if (m === 'dot') c.arc(x, y, s * 0.42, 0, Math.PI * 2);
    else if (m === 'leaf') {
      c.moveTo(x - s * 0.5, y + s * 0.45); c.quadraticCurveTo(x - s * 0.48, y - s * 0.5, x + s * 0.5, y - s * 0.46);
      c.quadraticCurveTo(x + s * 0.46, y + s * 0.5, x - s * 0.5, y + s * 0.45);
    } else if (m === 'moon') {
      c.arc(x, y, s * 0.48, Math.PI * 0.35, Math.PI * 1.65);
      c.arc(x + s * 0.2, y - s * 0.02, s * 0.36, Math.PI * 1.45, Math.PI * 0.55, true);
    } else if (m === 'flower') {
      for (var k = 0; k < 5; k++) {
        var a = k / 5 * Math.PI * 2 - Math.PI / 2;
        c.moveTo(x + Math.cos(a) * s * 0.3 + s * 0.2, y + Math.sin(a) * s * 0.3);
        c.arc(x + Math.cos(a) * s * 0.3, y + Math.sin(a) * s * 0.3, s * 0.2, 0, Math.PI * 2);
      }
    }
    c.fill();
    if (m === 'flower') { c.beginPath(); c.arc(x, y, s * 0.16, 0, Math.PI * 2); c.fillStyle = '#FFE066'; c.fill(); }
  }
  function shape(c, sh, x, y, s, col) {
    c.beginPath();
    if (sh === 'circle') c.arc(x, y, s * 0.46, 0, Math.PI * 2);
    else if (sh === 'square') K.rrPath(c, x - s * 0.42, y - s * 0.42, s * 0.84, s * 0.84, s * 0.08);
    else if (sh === 'triangle') { c.moveTo(x, y - s * 0.5); c.lineTo(x + s * 0.52, y + s * 0.4); c.lineTo(x - s * 0.52, y + s * 0.4); c.closePath(); }
    else K.starPath(c, x, y + s * 0.05, s * 0.56, s * 0.24, 5);
    c.fillStyle = col;
    c.fill();
    c.lineJoin = 'round';
    c.lineWidth = Math.max(3, s * 0.06);
    c.strokeStyle = '#ffffff';
    c.stroke();
  }
  function numberFace(c, n, x, y, s, col) {
    K.text(String(n), x, y - s * 0.22, s * 1.35, col, { lw: s * 0.16 });
    var dots = Math.min(n, 5);
    for (var k = 0; k < dots; k++) {
      c.beginPath();
      c.arc(x + (k - (dots - 1) / 2) * s * 0.34, y + s * 0.66, s * 0.13, 0, Math.PI * 2);
      c.fillStyle = col;
      c.fill();
    }
  }
  /** One soap bubble (or the target card content when card=true). */
  function drawContent(c, lvKind, val, x, y, r, tint) {
    if (lvKind === 'color') {
      var col = COLORS[val];
      motif(c, col.motif, x, y, r * 0.95, '#ffffff');
    } else if (lvKind === 'shape') {
      shape(c, SHAPES[val], x, y, r * 1.6, tint || '#2B4C7E');
    } else {
      numberFace(c, val, x, y - r * 0.05, r, tint || '#2B4C7E');
    }
  }
  function drawBubble(c, b) {
    var r = b.r * (1 + b.wob * 0.15 * Math.sin(b.wob * 20));
    var sx = 1 + Math.sin(K.time * 2 + b.seed) * 0.03;
    c.save();
    c.translate(b.x, b.y);
    c.scale(sx, 2 - sx);
    var g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r);
    var fill = b.kind === 'color' ? COLORS[b.val].fill : '#BFE8FF';
    g.addColorStop(0, 'rgba(255,255,255,0.95)');
    g.addColorStop(0.35, b.kind === 'color' ? fill : 'rgba(225,245,255,0.85)');
    g.addColorStop(1, b.kind === 'color' ? fill : 'rgba(160,215,250,0.9)');
    c.globalAlpha = 0.95;
    c.beginPath();
    c.arc(0, 0, r, 0, Math.PI * 2);
    c.fillStyle = g;
    c.fill();
    c.globalAlpha = 1;
    c.lineWidth = 5;
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.stroke();
    drawContent(c, b.kind, b.val, 0, 6, r * 0.62, b.tint);
    c.beginPath();
    c.ellipse(-r * 0.38, -r * 0.5, r * 0.26, r * 0.13, -0.7, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fill();
    c.restore();
  }

  // ------------------------------------------------------------------ play
  var lv = 0;
  var ti = 0;
  var target = 0;
  var bubbles = [];
  var score = 0;
  var spawnT = 0;
  var finish = 0;
  var cardBounce = 0;

  function startTarget(l, t) {
    lv = l;
    ti = t;
    target = LEVELS[lv].targets[ti];
    bubbles = [];
    score = 0;
    spawnT = 0;
    finish = 0;
    for (var k = 0; k < 3; k++) spawn(H - 120 - k * 190);
    K.go('play');
  }
  function nextTarget() {
    var t = ti + 1;
    var l = lv;
    if (t >= LEVELS[l].targets.length) { t = 0; l = (l + 1) % LEVELS.length; }
    startTarget(l, t);
  }

  function spawn(y) {
    var L = LEVELS[lv];
    var right = 0;
    for (var k = 0; k < bubbles.length; k++) if (bubbles[k].val === target) right++;
    var val;
    if (right < 2 || Math.random() < 0.45) val = target;
    else {
      do { val = K.pick(L.targets); } while (val === target);
    }
    var x;
    var tries = 0;
    do {
      x = K.rand(420, 1180);
      var clash = false;
      for (k = 0; k < bubbles.length; k++) if (Math.abs(bubbles[k].x - x) < 150 && Math.abs(bubbles[k].y - (y || H + 80)) < 170) clash = true;
      tries++;
    } while (clash && tries < 12);
    bubbles.push({ x: x, x0: x, y: y || H + 80, r: K.rand(64, 72), v: K.rand(52, 70), val: val, kind: L.kind,
      seed: Math.random() * 6, wob: 0, tint: L.kind === 'color' ? null : K.pick(SHAPE_COLORS) });
  }

  function tapBubble(p) {
    for (var k = bubbles.length - 1; k >= 0; k--) {
      var b = bubbles[k];
      if (K.dist(p.x, p.y, b.x, b.y) > b.r + 14) continue;
      if (b.val === target) {
        bubbles.splice(k, 1);
        score++;
        K.sfx.pop();
        K.sfx.good(score - 1);
        K.fx.burst(b.x, b.y, 14, { kind: 'dot', color: b.kind === 'color' ? COLORS[b.val].fill : '#8FD3FF', min: 120, max: 300, rmin: 8, rmax: 14 });
        K.fx.burst(b.x, b.y, 6, { kind: 'spark', color: '#FFE066', min: 60, max: 160 });
        K.fx.ring(b.x, b.y, '#ffffff', b.r * 0.8);
        cardBounce = 1;
        if (score === 3 || score === 7) K.cheer(score === 3 ? 'shi_clap' : 'gi_clap', 'right', 1.2, 230);
        if (score >= GOAL) {
          finish = 0.001;
          done[key(lv, ti)] = 1;
          save();
          K.cheer('shi_sparkle', 'right', 2.0, 300);
        }
      } else {
        b.wob = 1;
        K.sfx.wrong();
      }
      return;
    }
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });
  var CARD = { x: 50, y: 175, w: 240, h: 240 };

  K.screen('play', {
    buttons: [menuBtn],
    down: function (p) { if (!finish) tapBubble(p); },
    pause: function () { save(); },
    update: function (dt) {
      cardBounce = Math.max(0, cardBounce - dt * 3);
      for (var k = bubbles.length - 1; k >= 0; k--) {
        var b = bubbles[k];
        b.y -= b.v * dt * (finish ? 4 : 1);
        b.x = b.x0 + Math.sin(K.time * 0.9 + b.seed) * 26;
        b.wob = Math.max(0, b.wob - dt * 2);
        if (b.y < -b.r - 20) bubbles.splice(k, 1);
      }
      if (!finish) {
        spawnT -= dt;
        if (spawnT <= 0 && bubbles.length < MAX_BUBBLES) {
          spawn();
          spawnT = K.rand(1.0, 1.6);
        }
      } else {
        finish += dt;
        if (finish > 1.4 && !K.isDone()) {
          K.showDone({
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startTarget(lv, ti); },
            onNext: nextTarget,
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#DDF3FF', '#A9DCF7');
      c.fillStyle = 'rgba(255,255,255,0.4)';
      for (var k = 0; k < 6; k++) { c.beginPath(); c.arc(360 + k * 170, 690 + (k % 2) * 12, 70, 0, Math.PI * 2); c.fill(); }
      // progress: 10 notches
      for (k = 0; k < GOAL; k++) {
        var nx = 420 + k * 76;
        K.rr(nx, 26, 62, 36, 18);
        c.fillStyle = k < score ? '#FFC93C' : 'rgba(255,255,255,0.8)';
        c.fill();
        c.lineWidth = 3;
        c.strokeStyle = k < score ? '#E8A21A' : 'rgba(80,110,140,0.25)';
        c.stroke();
        if (k < score) K.drawStar(nx + 31, 44, 12);
      }
      for (k = 0; k < bubbles.length; k++) drawBubble(c, bubbles[k]);
      // target card (left)
      var s = 1 + Math.sin(cardBounce * Math.PI) * 0.08;
      c.save();
      c.translate(CARD.x + CARD.w / 2, CARD.y + CARD.h / 2);
      c.scale(s, s);
      K.tile(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, { color: '#ffffff', radius: 34, border: '#FFC93C' });
      c.lineWidth = 8;
      c.strokeStyle = '#FFC93C';
      K.rr(-CARD.w / 2, -CARD.h / 2, CARD.w, CARD.h, 34);
      c.stroke();
      drawBubble(c, { x: 0, y: 0, r: 88, wob: 0, seed: 1, kind: LEVELS[lv].kind, val: target, tint: '#2B4C7E' });
      c.restore();
      if (!K.isDone()) K.drawImg('gi_point', 150, H - 4, 280, { bottom: true });
      // hint: the hand points at the lowest matching bubble
      if (!finish && K.idle() > 4.5) {
        var best = null;
        for (k = 0; k < bubbles.length; k++) {
          var b = bubbles[k];
          if (b.val === target && b.y < H - 60 && (!best || b.y > best.y)) best = b;
        }
        if (best) {
          var cyc = (K.idle() - 4.5) % 1.2;
          K.drawHand(best.x + 8, best.y + 10, cyc < 0.4 ? cyc / 0.4 : (cyc < 0.7 ? 1 : 0), K.clamp((K.idle() - 4.5) / 0.3, 0, 1));
        }
      }
    }
  });

  // ------------------------------------------------------------------ menu
  var TW = 140;
  var TH = 140;
  function tileRect(l, t) {
    return { x: 230 + t * (TW + 26), y: 112 + l * (TH + 44), w: TW, h: TH };
  }
  var pressed = null;
  function suggested() {
    for (var l = 0; l < LEVELS.length; l++) {
      for (var t = 0; t < LEVELS[l].targets.length; t++) if (!done[key(l, t)]) return key(l, t);
    }
    return '';
  }
  K.screen('menu', {
    down: function (p) {
      pressed = null;
      for (var l = 0; l < LEVELS.length; l++) {
        for (var t = 0; t < LEVELS[l].targets.length; t++) if (K.inRect(p, tileRect(l, t), 10)) pressed = [l, t];
      }
    },
    up: function (p, cancel) {
      var pr = pressed;
      pressed = null;
      if (cancel || !pr || !K.inRect(p, tileRect(pr[0], pr[1]), 20)) return;
      K.sfx.click();
      startTarget(pr[0], pr[1]);
    },
    render: function (c) {
      K.bg('#DDF3FF', '#B5E2FA');
      var sug = suggested();
      for (var l = 0; l < LEVELS.length; l++) {
        // row badge: what this row is about
        var ry = 112 + l * (TH + 44) + TH / 2;
        K.circle(130, ry, 52, '#ffffff');
        if (l === 0) {
          for (var k = 0; k < 4; k++) K.circle(108 + (k % 2) * 44, ry - 22 + Math.floor(k / 2) * 44, 18, COLORS[k].fill);
        } else if (l === 1) {
          shape(c, 'triangle', 110, ry - 14, 40, '#9B5DE5');
          shape(c, 'square', 150, ry + 16, 36, '#FF8C1A');
        } else {
          K.text('123', 130, ry, 40, '#2B4C7E', { stroke: false });
        }
        for (var t = 0; t < LEVELS[l].targets.length; t++) {
          var r = tileRect(l, t);
          var isP = pressed && pressed[0] === l && pressed[1] === t;
          K.tile(r.x, r.y, r.w, r.h, { done: !!done[key(l, t)], suggest: key(l, t) === sug, pressed: isP });
          drawBubble(c, { x: r.x + r.w / 2, y: r.y + r.h / 2 + (isP ? 4 : 0), r: 52, wob: 0, seed: t, kind: LEVELS[l].kind, val: LEVELS[l].targets[t], tint: '#2B4C7E' });
        }
      }
    }
  });

  K.screen('start', K.startScreen({
    title: 'Bắt bóng đúng màu', top: '#DDF3FF', bottom: '#9FD8F7', titleColor: '#1F6FC5', left: 'gi_wave', right: 'shi_wave',
    deco: function (c, t) {
      for (var k = 0; k < 4; k++) drawBubble(c, { x: 400 + k * 160, y: 340 + Math.sin(t * 1.5 + k) * 10, r: 46, wob: 0, seed: k, kind: 'color', val: k });
    },
    onPlay: function () { K.go('menu'); }
  }));

  window.__kg.info = function () {
    return { lv: lv, ti: ti, target: target, score: score, finish: finish > 0,
      bubbles: bubbles.map(function (b) { return { x: b.x, y: b.y, val: b.val, r: b.r }; }) };
  };
  K.start('start');
})();
