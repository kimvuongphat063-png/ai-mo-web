/*
 * Pop-it — press or swipe over the silicone bubbles (many fingers at once). When every bubble is
 * down the board flips over: all bubbles stand up again on the other side and the child earns a star.
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var R = 37;                 // bubble radius (logical px)
  var STEP = 84;              // lattice spacing
  var CX = 640;
  var CY = 392;
  var RAINBOW = ['#FF5A5F', '#FF9F1C', '#FFD23F', '#7AC943', '#2EC4B6', '#3D8BFD', '#9B5DE5', '#FF7AB6'];

  // ------------------------------------------------------------------ board shapes (centered on 0,0)
  function ell(c, x, y, rx, ry) { c.moveTo(x + rx, y); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
  function circ(c, x, y, r) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); }
  function rect(c, x, y, w, h) { c.rect(x, y, w, h); }
  var BOARDS = [
    { id: 'circle', base: '#FFD6E7', frame: '#FF8FB8', back: '#C9F2E6', backFrame: '#5CC9A7',
      path: function (c) { circ(c, 0, 0, 272); } },
    { id: 'heart', base: '#FFD1D8', frame: '#FF6F86', back: '#FFE9B8', backFrame: '#F5B23B',
      path: function (c) { K.heartPath(c, 0, 18, 640); } },
    { id: 'star', base: '#FFF1B8', frame: '#F5B700', back: '#D9E8FF', backFrame: '#5B8DEF',
      path: function (c) { K.starPath(c, 0, 30, 322, 182, 5); } },
    { id: 'square', base: '#D8F3DC', frame: '#52B788', back: '#FFDCC8', backFrame: '#F28C5B',
      path: function (c) { K.rrPath(c, -262, -258, 524, 524, 70); } },
    { id: 'dino', base: '#DDF5C6', frame: '#6CC04A', back: '#E7DDFF', backFrame: '#8E6CEF',
      path: function (c) {
        ell(c, -40, 70, 230, 145);
        c.moveTo(50, -20); c.lineTo(140, -175); c.lineTo(285, -170); c.lineTo(215, 70); c.closePath();
        ell(c, 222, -190, 108, 76);
        c.moveTo(-230, 20); c.lineTo(-420, 190); c.lineTo(-190, 180); c.closePath();
        rect(c, -215, 150, 104, 132);
        rect(c, 40, 150, 104, 132);
      } },
    { id: 'icecream', base: '#FFE3EE', frame: '#F27BA6', back: '#E0F7FA', backFrame: '#4DB6C9',
      path: function (c) {
        c.moveTo(-178, 30); c.lineTo(178, 30); c.lineTo(0, 318); c.closePath();
        circ(c, -105, -14, 130);
        circ(c, 105, -14, 130);
        circ(c, 0, -152, 138);
      } },
    { id: 'fish', base: '#D6EEFF', frame: '#4A9FE8', back: '#FFE0C7', backFrame: '#FF8A3D',
      path: function (c) {
        ell(c, 40, 10, 270, 190);
        c.moveTo(-180, 10); c.lineTo(-380, -170); c.lineTo(-380, 190); c.closePath();
      } },
    { id: 'gi', base: '#FFE9D6', frame: '#5A3B2E', back: '#E6F4FF', backFrame: '#3E6FA8',
      path: function (c) {
        circ(c, 0, -24, 244);
        ell(c, -250, 150, 56, 90); ell(c, 250, 150, 56, 90);
        ell(c, -258, 272, 42, 54); ell(c, 258, 272, 42, 54);
      } },
    { id: 'shi', base: '#FFF0DA', frame: '#4A3A30', back: '#E7F9E9', backFrame: '#3C9A55',
      path: function (c) {
        circ(c, 0, 14, 250);
        circ(c, -262, 0, 72); circ(c, 262, 0, 72);
      } }
  ];

  // Which lattice points hold a bubble (fully inside the shape).
  var probe = document.createElement('canvas').getContext('2d');
  function layoutBubbles(b) {
    probe.beginPath();
    b.path(probe);
    var rowStep = STEP * 0.87;
    var best = null;
    // Try several lattice offsets and keep the one that fits the most bubbles (then the most centered).
    for (var oy = 0; oy < 3; oy++) {
      for (var ox = 0; ox < 4; ox++) {
        var list = [];
        var row = 0;
        var sx = 0;
        var sy = 0;
        for (var y = -340 + oy * rowStep / 3; y <= 340; y += rowStep, row++) {
          var off = (row % 2 ? STEP / 2 : 0) + ox * STEP / 4;
          for (var x = -460 + off; x <= 460; x += STEP) {
            var ok = probe.isPointInPath(x, y);
            for (var k = 0; ok && k < 12; k++) {
              var a = k / 12 * Math.PI * 2;
              ok = probe.isPointInPath(x + Math.cos(a) * (R + 9), y + Math.sin(a) * (R + 9));
            }
            if (ok) { list.push({ x: x, y: y, row: row, down: false, t: 0 }); sx += x; sy += y; }
          }
        }
        var score = list.length * 1000 - (list.length ? Math.abs(sx / list.length) + Math.abs(sy / list.length) : 0);
        if (!best || score > best.score) best = { score: score, list: list };
      }
    }
    var rows = [];
    best.list.forEach(function (p) { if (rows.indexOf(p.row) < 0) rows.push(p.row); });
    rows.sort(function (a2, b2) { return a2 - b2; });
    best.list.forEach(function (p) { p.color = rows.indexOf(p.row); });
    return best.list;
  }
  BOARDS.forEach(function (b) { b.bubbles = layoutBubbles(b); });

  // ------------------------------------------------------------------ bubble sprites (pre-rendered)
  var sprites = {};
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    function m(v) { return Math.max(0, Math.min(255, Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)))); }
    return 'rgb(' + m(r) + ',' + m(g) + ',' + m(b) + ')';
  }
  function sprite(color, down) {
    var key = color + (down ? 'd' : 'u');
    if (sprites[key]) return sprites[key];
    var S = 2;
    var size = (R + 10) * 2 * S;
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var c = cv.getContext('2d');
    c.scale(S, S);
    var m = R + 10;
    if (!down) {
      c.beginPath(); c.arc(m + 2, m + 5, R, 0, Math.PI * 2); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fill();
      var g = c.createRadialGradient(m - R * 0.35, m - R * 0.4, R * 0.1, m, m, R);
      g.addColorStop(0, shade(color, 0.55));
      g.addColorStop(0.55, color);
      g.addColorStop(1, shade(color, -0.25));
      c.beginPath(); c.arc(m, m, R, 0, Math.PI * 2); c.fillStyle = g; c.fill();
      c.beginPath(); c.ellipse(m - R * 0.32, m - R * 0.42, R * 0.34, R * 0.2, -0.6, 0, Math.PI * 2);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.fill();
    } else {
      var g2 = c.createRadialGradient(m + R * 0.3, m + R * 0.35, R * 0.1, m, m, R);
      g2.addColorStop(0, shade(color, 0.35));
      g2.addColorStop(0.6, shade(color, -0.12));
      g2.addColorStop(1, shade(color, -0.4));
      c.beginPath(); c.arc(m, m, R * 0.94, 0, Math.PI * 2); c.fillStyle = g2; c.fill();
      c.beginPath(); c.arc(m, m, R * 0.94, Math.PI * 0.9, Math.PI * 1.9);
      c.lineWidth = 6; c.strokeStyle = 'rgba(0,0,0,0.18)'; c.stroke();
      c.beginPath(); c.arc(m, m, R * 0.86, Math.PI * 0.05, Math.PI * 0.75);
      c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.stroke();
    }
    sprites[key] = cv;
    return cv;
  }

  // ------------------------------------------------------------------ save
  var flips = {};
  var countMode = false;
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved) {
    if (saved.flips) BOARDS.forEach(function (b) { flips[b.id] = saved.flips[b.id] | 0; });
    countMode = !!saved.count;
  }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, flips: flips, count: countMode }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ play
  var bi = 0;
  var board = BOARDS[0];
  var side = 0;
  var flip = 0;        // 0 = idle, >0 = flipping (seconds)
  var poppedCount = 0;
  var fingers = {};
  var celebrateAt = 0;

  function openBoard(k) {
    bi = (k + BOARDS.length) % BOARDS.length;
    board = BOARDS[bi];
    side = 0;
    flip = 0;
    celebrateAt = 0;
    resetBubbles();
    K.go('play');
  }
  function resetBubbles() {
    board.bubbles.forEach(function (b) { b.down = false; b.t = 0; });
    poppedCount = 0;
  }

  function popAt(x, y) {
    if (flip > 0) return;
    var lx = x - CX;
    var ly = y - CY;
    for (var i = 0; i < board.bubbles.length; i++) {
      var b = board.bubbles[i];
      if (b.down) continue;
      var dx = lx - b.x;
      var dy = ly - b.y;
      if (dx * dx + dy * dy <= R * R * 1.1) {
        b.down = true;
        b.t = 0.18;
        poppedCount++;
        K.sfx.pop();
        if (countMode) K.fx.float(String(poppedCount), x, y - 40, '#2B4C7E', 40);
        if (poppedCount === board.bubbles.length) startFlip();
      }
    }
  }
  function sweep(ax, ay, bx, by) {
    var d = K.dist(ax, ay, bx, by);
    var n = Math.max(1, Math.ceil(d / (R * 0.5)));
    for (var k = 1; k <= n; k++) popAt(ax + (bx - ax) * k / n, ay + (by - ay) * k / n);
  }
  function startFlip() {
    flip = 0.0001;
    fingers = {};
    K.sfx.whoosh();
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });
  var countBtn = K.button({ x: 1188, y: 88, r: 48, color: '#F29E38', onTap: function () {
    countMode = !countMode;
    save();
  }, draw: function (c, b) {
    K.text('123', 0, 2, 34, '#ffffff', { stroke: false });
    if (!countMode) {
      c.beginPath(); c.moveTo(-34, 30); c.lineTo(34, -30);
      c.lineWidth = 7; c.strokeStyle = 'rgba(255,255,255,0.9)'; c.stroke();
    }
  } });

  function drawBoard(c, b, sd, scaleX, t) {
    c.save();
    c.translate(CX, CY);
    c.scale(scaleX, 1);
    c.beginPath();
    b.path(c);
    c.lineJoin = 'round';
    c.lineWidth = 56;
    c.strokeStyle = sd ? b.backFrame : b.frame;
    c.stroke();
    // fill over the thick stroke: only the outer half of the frame stays visible (clean outline
    // even for shapes made of several overlapping parts)
    var g = c.createRadialGradient(0, -60, 40, 0, 0, 420);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.35, sd ? b.back : b.base);
    g.addColorStop(1, sd ? b.back : b.base);
    c.fillStyle = g;
    c.fill();
    var n = RAINBOW.length;
    for (var i = 0; i < b.bubbles.length; i++) {
      var p = b.bubbles[i];
      var col = RAINBOW[(sd ? n - 1 - (p.color % n) : p.color) % n];
      var img = sprite(col, p.down);
      var s = 1 + (p.t > 0 ? (p.down ? -0.12 : 0.12) * Math.sin(p.t / 0.18 * Math.PI) : 0);
      var hw = (R + 10) * s;
      c.drawImage(img, p.x - hw, p.y - hw, hw * 2, hw * 2);
    }
    c.restore();
  }

  K.screen('play', {
    buttons: [menuBtn, countBtn],
    down: function (p) {
      if (flip > 0) return;
      fingers[p.id] = { x: p.x, y: p.y };
      popAt(p.x, p.y);
    },
    move: function (p) {
      var f = fingers[p.id];
      if (!f) return;
      sweep(f.x, f.y, p.x, p.y);
      f.x = p.x;
      f.y = p.y;
    },
    up: function (p, cancel) {
      if (!cancel) this.move(p);
      delete fingers[p.id];
    },
    pause: function () { fingers = {}; save(); },
    update: function (dt) {
      board.bubbles.forEach(function (b) { if (b.t > 0) b.t = Math.max(0, b.t - dt); });
      if (flip > 0) {
        var was = flip;
        flip += dt;
        if (was < 0.35 && flip >= 0.35) {
          side = 1 - side;
          resetBubbles();
        }
        if (flip >= 0.7) {
          flip = 0;
          flips[board.id] = (flips[board.id] | 0) + 1;
          save();
          K.fx.burst(CX, CY - 120, 26, { kind: 'star' });
          K.sfx.ting();
          celebrateAt = 0.0001;
        }
      }
      if (celebrateAt > 0) {
        celebrateAt += dt;
        if (celebrateAt > 0.9 && !K.isDone()) {
          celebrateAt = 0;
          K.showDone({
            title: K.pick(['Giỏi quá!', 'Hoan hô!', 'Tuyệt vời!']),
            left: 'gi_clap', right: 'shi_cheer',
            onReplay: function () { K.hideDone(); },
            onNext: function () { openBoard(bi + 1); },
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#FDE8F0', '#FAD0E2');
      c.fillStyle = 'rgba(255,255,255,0.35)';
      for (var k = 0; k < 7; k++) { c.beginPath(); c.arc(80 + k * 190, 700 - (k % 2) * 30, 50, 0, Math.PI * 2); c.fill(); }
      var sx = flip > 0 ? Math.max(0.02, Math.abs(Math.cos(flip / 0.7 * Math.PI))) : 1;
      drawBoard(c, board, side, sx, K.time);
      if (!K.isDone()) {
        K.drawImg('gi_wave', 120, H - 6, 260, { bottom: true });
        K.drawImg('shi_wave', W - 120, H - 6, 260, { bottom: true });
      }
      var stars = flips[board.id] | 0;
      if (stars) {
        K.drawStar(1188, 190, 26);
        K.text('× ' + stars, 1188, 236, 30, '#7A4A00', { lw: 6 });
      }
      // hint: a hand swipes across one row of standing bubbles
      if (flip === 0 && K.idle() > 4.5 && poppedCount < board.bubbles.length) {
        var first = null;
        var last = null;
        for (var i = 0; i < board.bubbles.length; i++) {
          var b = board.bubbles[i];
          if (b.down) continue;
          if (!first) first = b;
          if (b.row === first.row) last = b;
        }
        if (first) {
          var cyc = (K.idle() - 4.5) % 2;
          var ph = K.easeInOut(K.clamp(cyc / 1.4, 0, 1));
          var hx = CX + first.x + (last.x - first.x) * ph;
          var hy = CY + first.y;
          K.drawHand(hx, hy, cyc < 1.4 ? 1 : 0, K.clamp((K.idle() - 4.5) / 0.3, 0, 1) * (cyc > 1.6 ? 0 : 1));
        }
      }
    }
  });

  // ------------------------------------------------------------------ menu
  var tiles = K.grid(BOARDS.length, 5, 214, 250, 28, 34, { x: 0, y: 20, w: W, h: H - 20 });
  var pressed = -1;
  K.screen('menu', {
    down: function (p) {
      pressed = -1;
      for (var k = 0; k < tiles.length; k++) if (K.inRect(p, tiles[k], 6)) pressed = k;
    },
    up: function (p, cancel) {
      var k = pressed;
      pressed = -1;
      if (cancel || k < 0 || !K.inRect(p, tiles[k], 16)) return;
      K.sfx.click();
      openBoard(k);
    },
    render: function (c) {
      K.bg('#FDE8F0', '#FAD0E2');
      var sug = -1;
      for (var k = 0; k < BOARDS.length; k++) if (!flips[BOARDS[k].id]) { sug = k; break; }
      for (k = 0; k < tiles.length; k++) {
        var r = tiles[k];
        var b = BOARDS[k];
        K.tile(r.x, r.y, r.w, r.h, { suggest: k === sug, pressed: k === pressed });
        c.save();
        c.translate(r.x + r.w / 2 - CX * 0.27, r.y + 108 - CY * 0.27);
        c.scale(0.27, 0.27);
        drawBoard(c, b, 0, 1, 0);
        c.restore();
        var n = flips[b.id] | 0;
        if (n) {
          K.drawStar(r.x + r.w / 2 - 24, r.y + r.h - 32, 20);
          K.text('× ' + n, r.x + r.w / 2 + 22, r.y + r.h - 30, 28, '#7A4A00', { lw: 5 });
        }
      }
    }
  });

  K.screen('start', K.startScreen({
    title: 'Pop-it', top: '#FDE8F0', bottom: '#F9C6DC', titleColor: '#E0457B', left: 'gi_wave', right: 'shi_wave',
    deco: function (c) {
      for (var k = 0; k < 7; k++) {
        var img = sprite(RAINBOW[k], k % 3 === 1);
        c.drawImage(img, 320 + k * 92 - 47, 300, 94, 94);
      }
    },
    onPlay: function () { K.go('menu'); }
  }));

  window.__kg.info = function () {
    return { board: board.id, bi: bi, side: side, flip: flip, total: board.bubbles.length, popped: poppedCount, countMode: countMode,
      bubbles: board.bubbles.map(function (b) { return [CX + b.x, CY + b.y, b.down ? 1 : 0]; }), counts: BOARDS.map(function (b) { return b.bubbles.length; }) };
  };
  K.start('start');
})();
