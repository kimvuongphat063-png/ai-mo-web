/*
 * K — shared kit for the one-file Kids Games (canvas, logical 1280x720).
 * Screens, big round buttons, celebration overlay, particles, Gi & Shi images, hint hand,
 * synthesized sounds. Everything respects KidsSDK: no update/sound while inactive.
 * ES2017 at most (Android 8 WebView = Chromium 69): no optional chaining, no class fields.
 */
var K = (function () {
  'use strict';

  var W = 1280;
  var H = 720;
  var FONT = 'system-ui, Roboto, "Segoe UI", sans-serif';
  var canvas = document.getElementById('game');
  var view = KidsSDK.fitCanvas(canvas, W, H, 2);
  var ctx = view.ctx;

  var K = { W: W, H: H, ctx: ctx, canvas: canvas, view: view, time: 0, FONT: FONT, bgColor: '#ffffff' };
  var screens = {};
  var cur = null;
  var curName = '';
  var dirty = true;
  var lastInput = 0;
  var fade = 0;
  var pointers = {};
  var done = null;
  var cheers = [];
  var parts = [];

  // ------------------------------------------------------------------ math helpers
  K.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  K.lerp = function (a, b, t) { return a + (b - a) * t; };
  K.rand = function (a, b) { return a + Math.random() * (b - a); };
  K.randInt = function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); };
  K.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };
  K.shuffle = function (a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  K.dist = function (ax, ay, bx, by) { var dx = ax - bx; var dy = ay - by; return Math.sqrt(dx * dx + dy * dy); };
  K.easeOutBack = function (t) {
    t = K.clamp(t, 0, 1);
    var c1 = 1.70158; var c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };
  K.easeOut = function (t) { t = K.clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); };
  K.easeInOut = function (t) { t = K.clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
  K.markDirty = function () { dirty = true; };

  // ------------------------------------------------------------------ images (Gi & Shi ...)
  var imgCache = {};
  /** Returns a decoded Image for ASSETS[name] (decoded lazily, on first use), or null. */
  K.img = function (name) {
    if (!name) return null;
    if (typeof name !== 'string') return name;
    var im = imgCache[name];
    if (!im) {
      var src = window.ASSETS && window.ASSETS[name];
      if (!src) return null;
      im = new Image();
      im.onload = function () { dirty = true; };
      im.src = src;
      imgCache[name] = im;
    }
    return im.complete && im.naturalWidth ? im : null;
  };
  K.preload = function (names) { for (var i = 0; i < names.length; i++) K.img(names[i]); };

  /** Draws an image by height. o: {alpha, rot, flip, sx, sy, bottom (cy is the bottom edge)}. */
  K.drawImg = function (name, cx, cy, h, o) {
    var im = K.img(name);
    if (!im) return;
    o = o || {};
    var w = im.naturalWidth * h / im.naturalHeight;
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(cx, o.bottom ? cy - h / 2 : cy);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale((o.flip ? -1 : 1) * (o.sx || 1), o.sy || 1);
    ctx.drawImage(im, -w / 2, -h / 2, w, h);
    ctx.restore();
  };

  // ------------------------------------------------------------------ drawing helpers
  K.font = function (size, weight) { return (weight || 800) + ' ' + Math.round(size) + 'px ' + FONT; };

  K.text = function (s, x, y, size, color, o) {
    o = o || {};
    ctx.save();
    ctx.font = K.font(size, o.weight);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'middle';
    if (o.stroke !== false) {
      ctx.lineJoin = 'round';
      ctx.lineWidth = o.lw || Math.max(4, size / 5);
      ctx.strokeStyle = o.stroke || '#ffffff';
      ctx.strokeText(s, x, y);
    }
    ctx.fillStyle = color || '#2B4C7E';
    ctx.fillText(s, x, y);
    ctx.restore();
  };

  /** Rounded rectangle path built with arcTo (works on Chromium 69). */
  K.rrPath = function (c, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  };
  K.rr = function (x, y, w, h, r) { ctx.beginPath(); K.rrPath(ctx, x, y, w, h, r); };

  K.starPath = function (c, cx, cy, R, r, n, rot) {
    n = n || 5;
    rot = rot === undefined ? -Math.PI / 2 : rot;
    c.moveTo(cx + Math.cos(rot) * R, cy + Math.sin(rot) * R);
    for (var i = 1; i < n * 2; i++) {
      var a = rot + i * Math.PI / n;
      var rr = i % 2 ? r : R;
      c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    c.closePath();
  };

  /** Heart centered on (cx, cy), about s wide. */
  K.heartPath = function (c, cx, cy, s) {
    var k = s / 100;
    c.moveTo(cx, cy + 38 * k);
    c.bezierCurveTo(cx - 62 * k, cy - 2 * k, cx - 50 * k, cy - 52 * k, cx - 24 * k, cy - 46 * k);
    c.bezierCurveTo(cx - 10 * k, cy - 43 * k, cx - 2 * k, cy - 32 * k, cx, cy - 26 * k);
    c.bezierCurveTo(cx + 2 * k, cy - 32 * k, cx + 10 * k, cy - 43 * k, cx + 24 * k, cy - 46 * k);
    c.bezierCurveTo(cx + 50 * k, cy - 52 * k, cx + 62 * k, cy - 2 * k, cx, cy + 38 * k);
    c.closePath();
  };

  K.circle = function (x, y, r, fill, stroke, lw) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 4; ctx.strokeStyle = stroke; ctx.stroke(); }
  };

  /** Soft vertical gradient background over the whole stage. */
  K.bg = function (top, bottom) {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom || top);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  K.cloud = function (x, y, s, color) {
    ctx.fillStyle = color || 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 34 * s, 0, Math.PI * 2);
    ctx.arc(x + 40 * s, y - 16 * s, 42 * s, 0, Math.PI * 2);
    ctx.arc(x + 84 * s, y, 32 * s, 0, Math.PI * 2);
    ctx.rect(x, y, 84 * s, 32 * s);
    ctx.fill();
  };

  /** Gold star (badge). */
  K.drawStar = function (x, y, r, o) {
    o = o || {};
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    if (o.scale) ctx.scale(o.scale, o.scale);
    ctx.beginPath();
    K.starPath(ctx, 0, 0, r, r * 0.5, 5);
    ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(3, r * 0.16);
    ctx.strokeStyle = o.empty ? 'rgba(120,120,140,0.35)' : '#E8890C';
    ctx.fillStyle = o.empty ? 'rgba(255,255,255,0.55)' : '#FFCD2E';
    ctx.fill();
    ctx.stroke();
    if (!o.empty) {
      ctx.beginPath();
      K.starPath(ctx, -r * 0.08, -r * 0.1, r * 0.45, r * 0.22, 5);
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fill();
    }
    ctx.restore();
  };

  /** Big card used by level-select grids. o: {color, done, suggest, pressed, radius}. */
  K.tile = function (x, y, w, h, o) {
    o = o || {};
    var r = o.radius || 24;
    var press = o.pressed ? 4 : 0;
    if (o.suggest) {
      var a = 0.35 + 0.3 * Math.sin(K.time * 4);
      K.rr(x - 9, y - 9 + press, w + 18, h + 18, r + 8);
      ctx.fillStyle = 'rgba(255,205,46,' + a.toFixed(3) + ')';
      ctx.fill();
    }
    K.rr(x, y + 7, w, h, r);
    ctx.fillStyle = o.shadow || 'rgba(40,60,90,0.18)';
    ctx.fill();
    K.rr(x, y + press, w, h, r);
    ctx.fillStyle = o.color || '#ffffff';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = o.border || 'rgba(255,255,255,0.9)';
    ctx.stroke();
    if (o.done) K.drawStar(x + w - 14, y + 14 + press, 24, { rot: 0.12 });
  };

  /** Grid layout: returns n rects {x,y,w,h,i} centered in area {x,y,w,h}. */
  K.grid = function (n, cols, tw, th, sx, sy, area) {
    var rows = Math.ceil(n / cols);
    var gw = cols * tw + (cols - 1) * sx;
    var gh = rows * th + (rows - 1) * sy;
    var x0 = area.x + (area.w - gw) / 2;
    var y0 = area.y + (area.h - gh) / 2;
    var out = [];
    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / cols);
      var c = i % cols;
      var inRow = Math.min(cols, n - r * cols);
      var off = (cols - inRow) * (tw + sx) / 2;
      out.push({ x: x0 + off + c * (tw + sx), y: y0 + r * (th + sy), w: tw, h: th, i: i });
    }
    return out;
  };
  K.inRect = function (p, r, pad) {
    pad = pad || 0;
    return p.x >= r.x - pad && p.x <= r.x + r.w + pad && p.y >= r.y - pad && p.y <= r.y + r.h + pad;
  };

  /** Progress dots, centered at (cx, y). */
  K.dots = function (n, filled, cx, y, r, color, current) {
    var step = r * 2 + 14;
    var x0 = cx - (n - 1) * step / 2;
    for (var i = 0; i < n; i++) {
      var x = x0 + i * step;
      ctx.beginPath();
      ctx.arc(x, y, i === current ? r * 1.25 : r, 0, Math.PI * 2);
      ctx.fillStyle = i < filled ? (color || '#F5A623') : 'rgba(255,255,255,0.9)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = i < filled ? 'rgba(0,0,0,0.12)' : 'rgba(80,90,110,0.3)';
      ctx.stroke();
    }
  };

  // ------------------------------------------------------------------ icons + buttons
  K.icon = function (name, x, y, s, color) {
    var c = ctx;
    c.save();
    c.translate(x, y);
    c.scale(s / 100, s / 100);
    c.fillStyle = color || '#ffffff';
    c.strokeStyle = color || '#ffffff';
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    if (name === 'play') {
      c.moveTo(-26, -40); c.lineTo(44, 0); c.lineTo(-26, 40); c.closePath();
      c.lineWidth = 12; c.stroke(); c.fill();
    } else if (name === 'replay') {
      c.lineWidth = 15;
      c.arc(0, 0, 34, -Math.PI * 0.35, Math.PI * 1.45);
      c.stroke();
      c.beginPath();
      c.moveTo(4, -56); c.lineTo(32, -36); c.lineTo(2, -14); c.closePath();
      c.lineWidth = 8; c.stroke(); c.fill();
    } else if (name === 'next' || name === 'back') {
      if (name === 'back') c.scale(-1, 1);
      c.lineWidth = 16;
      c.moveTo(-36, 0); c.lineTo(22, 0); c.stroke();
      c.beginPath();
      c.moveTo(4, -32); c.lineTo(40, 0); c.lineTo(4, 32); c.closePath();
      c.lineWidth = 10; c.stroke(); c.fill();
    } else if (name === 'grid') {
      for (var i = 0; i < 4; i++) {
        var gx = (i % 2) * 40 - 38;
        var gy = Math.floor(i / 2) * 40 - 38;
        K.rrPath(c, gx, gy, 32, 32, 8);
      }
      c.fill();
    } else if (name === 'check') {
      c.lineWidth = 18;
      c.moveTo(-36, 2); c.lineTo(-10, 28); c.lineTo(38, -26); c.stroke();
    } else if (name === 'undo') {
      c.lineWidth = 14;
      c.arc(6, 8, 30, Math.PI * 1.05, Math.PI * 2.55);
      c.stroke();
      c.beginPath();
      c.moveTo(-44, -16); c.lineTo(-10, -26); c.lineTo(-30, 8); c.closePath();
      c.lineWidth = 8; c.stroke(); c.fill();
    } else if (name === 'eraser') {
      c.rotate(-0.6);
      K.rrPath(c, -42, -22, 84, 44, 10);
      c.fillStyle = '#FFB3C7'; c.fill();
      c.lineWidth = 7; c.strokeStyle = color || '#ffffff'; c.stroke();
      c.beginPath(); c.moveTo(-6, -22); c.lineTo(-6, 22); c.stroke();
      c.beginPath(); K.rrPath(c, -42, -22, 36, 44, 10); c.fillStyle = '#ffffff'; c.fill();
    } else if (name === 'music') {
      c.lineWidth = 9;
      c.moveTo(-10, 26); c.lineTo(-10, -40); c.lineTo(34, -48); c.lineTo(34, 18); c.stroke();
      c.beginPath(); c.ellipse(-24, 28, 16, 12, -0.4, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(20, 20, 16, 12, -0.4, 0, Math.PI * 2); c.fill();
    } else if (name === 'hand') {
      c.restore();
      K.drawHand(x - s * 0.1, y - s * 0.25, 0, 1, s / 150);
      return;
    }
    c.restore();
  };

  /** b: {x, y, r, icon, color, onTap, hidden, pulse}. Hit area is never smaller than 116 px. */
  K.button = function (b) {
    b.r = b.r || 56;
    b.hit = b.hit || Math.max(b.r + 8, 58);
    b.color = b.color || '#2E9E6B';
    return b;
  };

  K.drawButton = function (b) {
    if (b.hidden) return;
    var s = (b.pressed ? 0.92 : 1) * (b.pulse ? 1 + Math.sin(K.time * 3.2) * 0.045 : 1);
    if (b.appear !== undefined) s *= K.easeOutBack(b.appear);
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0, 6, b.r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,40,60,0.22)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.lineWidth = Math.max(5, b.r * 0.1);
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(-b.r * 0.25, -b.r * 0.42, b.r * 0.42, b.r * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();
    if (b.draw) b.draw(ctx, b);
    else K.icon(b.icon, 0, 0, b.r * 1.05, b.iconColor);
    if (b.selected) {
      ctx.beginPath();
      ctx.arc(0, 0, b.r + 12, 0, Math.PI * 2);
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#2B4C7E';
      ctx.stroke();
    }
    ctx.restore();
  };

  // ------------------------------------------------------------------ hint hand
  /** Cartoon hand; fingertip at (x, y). press 0..1 squashes it, scale default 1 (~110 px). */
  K.drawHand = function (x, y, press, alpha, scale) {
    var c = ctx;
    c.save();
    c.globalAlpha *= alpha === undefined ? 1 : alpha;
    c.translate(x, y);
    var s = (scale || 1) * (1 - (press || 0) * 0.1);
    c.scale(s, s);
    if (press > 0.5) {
      c.beginPath();
      c.arc(0, 0, 26 + press * 10, 0, Math.PI * 2);
      c.lineWidth = 5;
      c.strokeStyle = 'rgba(255,255,255,' + (0.9 * press).toFixed(2) + ')';
      c.stroke();
    }
    c.rotate(-0.38);
    c.beginPath();
    K.rrPath(c, -12, 0, 24, 70, 12);
    K.rrPath(c, -16, 44, 60, 64, 22);
    c.moveTo(-8, 76);
    c.ellipse(-17, 72, 11, 21, -0.55, 0, Math.PI * 2);
    c.moveTo(30, 48);
    c.arc(19, 48, 11, 0, Math.PI * 2);
    c.moveTo(43, 54);
    c.arc(33, 54, 10, 0, Math.PI * 2);
    c.moveTo(51, 64);
    c.arc(42, 64, 9, 0, Math.PI * 2);
    c.lineJoin = 'round';
    c.lineWidth = 9;
    c.strokeStyle = '#6B4A3A';
    c.stroke();
    c.fillStyle = '#FFE6D2';
    c.fill();
    c.beginPath();
    c.ellipse(-3, 12, 5, 9, 0, 0, Math.PI * 2);
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.fill();
    c.restore();
  };

  // ------------------------------------------------------------------ idle (for hints)
  K.idle = function () { return K.time - lastInput; };
  K.poke = function () { lastInput = K.time; };

  // ------------------------------------------------------------------ particles
  var PALETTE = ['#FF5A5F', '#FFB400', '#2EC4B6', '#3D8BFD', '#9B5DE5', '#FF7AB6', '#7AC943'];
  K.PALETTE = PALETTE;
  K.fx = {
    burst: function (x, y, n, o) {
      o = o || {};
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2;
        var sp = K.rand(o.min || 160, o.max || 420);
        parts.push({ k: o.kind || 'star', x: x, y: y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 80),
          g: o.g === undefined ? 520 : o.g, life: K.rand(0.6, 1.0) * (o.life || 1), age: 0,
          r: K.rand(o.rmin || 10, o.rmax || 20), rot: Math.random() * 6, vr: K.rand(-6, 6),
          color: o.color || K.pick(PALETTE) });
      }
    },
    confetti: function (n) {
      for (var i = 0; i < n; i++) {
        parts.push({ k: 'conf', x: K.rand(0, W), y: K.rand(-200, -10), vx: K.rand(-60, 60), vy: K.rand(120, 260),
          g: 60, life: 3.2, age: 0, r: K.rand(9, 15), rot: Math.random() * 6, vr: K.rand(-5, 5),
          color: K.pick(PALETTE), sway: Math.random() * 6 });
      }
    },
    note: function (x, y, color) {
      parts.push({ k: 'note', x: x, y: y, vx: K.rand(-40, 40), vy: -K.rand(140, 200), g: 0, life: 1.3, age: 0,
        r: K.rand(26, 34), rot: K.rand(-0.3, 0.3), vr: 0, color: color || K.pick(PALETTE) });
    },
    float: function (txt, x, y, color, size) {
      parts.push({ k: 'text', txt: txt, x: x, y: y, vx: 0, vy: -90, g: 0, life: 1.2, age: 0, r: size || 60,
        rot: 0, vr: 0, color: color || '#2B4C7E' });
    },
    ring: function (x, y, color, r) {
      parts.push({ k: 'ring', x: x, y: y, vx: 0, vy: 0, g: 0, life: 0.5, age: 0, r: r || 40, rot: 0, vr: 0,
        color: color || '#ffffff' });
    },
    clear: function () { parts = []; },
    update: function (dt) {
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.age += dt;
        if (p.age >= p.life) { parts.splice(i, 1); continue; }
        p.vy += p.g * dt;
        p.x += p.vx * dt + (p.k === 'conf' ? Math.sin(p.age * 4 + p.sway) * 40 * dt : 0);
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
      }
    },
    render: function () {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        var t = p.age / p.life;
        ctx.save();
        ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        if (p.k === 'star') {
          ctx.beginPath();
          K.starPath(ctx, 0, 0, p.r, p.r * 0.48, 5);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else if (p.k === 'spark') {
          ctx.beginPath();
          K.starPath(ctx, 0, 0, p.r, p.r * 0.25, 4);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else if (p.k === 'dot') {
          ctx.beginPath();
          ctx.arc(0, 0, p.r * 0.6, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        } else if (p.k === 'conf') {
          ctx.scale(1, Math.cos(p.age * 6 + p.sway));
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.r / 2, -p.r / 3, p.r, p.r * 0.66);
        } else if (p.k === 'note') {
          K.icon('music', 0, 0, p.r * 1.6, p.color);
        } else if (p.k === 'text') {
          ctx.rotate(-p.rot);
          K.text(p.txt, 0, 0, p.r * (t < 0.15 ? 0.6 + t / 0.15 * 0.4 : 1), p.color);
        } else if (p.k === 'ring') {
          ctx.beginPath();
          ctx.arc(0, 0, p.r * (1 + t * 1.6), 0, Math.PI * 2);
          ctx.lineWidth = 8 * (1 - t);
          ctx.strokeStyle = p.color;
          ctx.stroke();
        }
        ctx.restore();
      }
    }
  };

  // ------------------------------------------------------------------ Gi & Shi pop-in
  /** A mascot jumps in from the bottom corner for a moment. side: 'left' | 'right'. */
  K.cheer = function (name, side, dur, h) {
    for (var i = cheers.length - 1; i >= 0; i--) if (cheers[i].side === (side || 'left')) cheers.splice(i, 1);
    cheers.push({ name: name, side: side || 'left', t: 0, dur: dur || 1.8, h: h || 300 });
  };
  function renderCheers() {
    for (var i = 0; i < cheers.length; i++) {
      var c = cheers[i];
      var inT = K.easeOutBack(c.t / 0.35);
      var outT = c.t > c.dur - 0.3 ? (c.t - (c.dur - 0.3)) / 0.3 : 0;
      var y = H + 10 + (1 - inT) * c.h * 0.9 + outT * c.h * 0.9;
      var x = c.side === 'left' ? 150 : W - 150;
      var bob = Math.abs(Math.sin(c.t * 7)) * 14;
      K.drawImg(c.name, x, y - bob, c.h, { bottom: true });
    }
  }

  // ------------------------------------------------------------------ celebration overlay
  /** o: {title, left, right, onReplay, onNext, onMenu, nextLabel} — shows the end-of-level panel. */
  K.showDone = function (o) {
    var list = [];
    if (o.onMenu) list.push(K.button({ x: 430, y: 604, r: 50, icon: 'grid', color: '#5B8DEF', onTap: o.onMenu }));
    list.push(K.button({ x: o.onMenu ? 614 : 540, y: 604, r: 62, icon: 'replay', color: '#F29E38', onTap: o.onReplay }));
    if (o.onNext) list.push(K.button({ x: o.onMenu ? 820 : 740, y: 604, r: 66, icon: 'next', color: '#2E9E6B', pulse: true, onTap: o.onNext }));
    done = { t: 0, o: o, buttons: list };
    cheers = [];
    K.fx.confetti(70);
    K.sfx.fanfare();
    dirty = true;
  };
  K.hideDone = function () { done = null; dirty = true; };
  K.isDone = function () { return !!done; };

  function renderDone() {
    var t = done.t;
    var o = done.o;
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.5, t * 1.6).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
    var s = K.easeOutBack(t / 0.45);
    ctx.save();
    ctx.translate(640, 112);
    ctx.scale(s, s);
    K.drawStar(-300, 0, 46, { rot: Math.sin(K.time * 2) * 0.2 });
    K.drawStar(300, 0, 46, { rot: -Math.sin(K.time * 2) * 0.2 });
    K.text(o.title || 'Giỏi quá!', 0, 0, 96, '#F0682D', { lw: 22 });
    ctx.restore();
    var m = K.easeOutBack((t - 0.2) / 0.5);
    var bob = Math.abs(Math.sin(K.time * 5)) * 12;
    K.drawImg(o.left || 'gi_cheer', 165, H + 20 + (1 - m) * 320 - bob, 330, { bottom: true });
    K.drawImg(o.right || 'shi_clap', W - 165, H + 20 + (1 - m) * 320 - Math.abs(Math.sin(K.time * 5 + 1)) * 12, 330, { bottom: true });
    var ba = K.clamp((t - 0.35) / 0.35, 0, 1);
    for (var i = 0; i < done.buttons.length; i++) {
      done.buttons[i].appear = ba;
      K.drawButton(done.buttons[i]);
    }
  }

  // ------------------------------------------------------------------ generic start screen
  /** o: {title, top, bottom, titleColor, left, right, deco(ctx,t), onPlay, color} */
  K.startScreen = function (o) {
    var play = K.button({ x: 640, y: 470, r: 100, icon: 'play', color: o.color || '#2E9E6B', pulse: true,
      onTap: function () { o.onPlay(); } });
    return {
      buttons: [play],
      render: function () {
        K.bg(o.top, o.bottom);
        if (o.deco) o.deco(ctx, K.time);
        K.drawImg(o.left || 'gi_wave', 210, H - 20 + Math.sin(K.time * 2) * 4, 400, { bottom: true });
        K.drawImg(o.right || 'shi_wave', W - 210, H - 20 + Math.sin(K.time * 2 + 1.4) * 4, 400, { bottom: true });
        ctx.font = K.font(112);
        var size = Math.min(112, Math.floor(112 * 820 / Math.max(1, ctx.measureText(o.title).width)));
        K.text(o.title, 640, 210, size, o.titleColor || '#2B4C7E', { lw: Math.round(size * 0.23) });
      }
    };
  };

  // ------------------------------------------------------------------ sounds (Web Audio, no files)
  function ac() {
    if (!KidsSDK.isActive()) return null;
    var c = KidsSDK.audio.context();
    if (!c) return null;
    if (c.state !== 'running') { try { c.resume(); } catch (e) { /* SDK shows tap-to-play */ } }
    return c;
  }
  var noiseBuf = null;
  function noise(c) {
    if (!noiseBuf) {
      noiseBuf = c.createBuffer(1, Math.floor(c.sampleRate * 0.5), c.sampleRate);
      var d = noiseBuf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return noiseBuf;
  }
  /** One oscillator with a fast attack and exponential decay into the SDK master gain. */
  function voice(c, type, f, t, peak, decay, slideTo, attack) {
    var o = c.createOscillator();
    var g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + decay);
    var a = attack || 0.006;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + decay);
    o.connect(g);
    g.connect(KidsSDK.audio.output());
    o.start(t);
    o.stop(t + a + decay + 0.05);
  }
  function noiseHit(c, t, peak, dur, freq, q, type) {
    var src = c.createBufferSource();
    src.buffer = noise(c);
    var f = c.createBiquadFilter();
    f.type = type || 'bandpass';
    f.frequency.value = freq || 2000;
    f.Q.value = q || 1;
    var g = c.createGain();
    g.gain.setValueAtTime(peak, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(KidsSDK.audio.output());
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.02);
  }
  var NOTES = { C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
    C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, B5: 987.77, C6: 1046.5 };
  K.NOTES = NOTES;
  var SCALE = [261.63, 293.66, 329.63, 349.23, 392.0, 440.0, 493.88, 523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5];
  K.SCALE = SCALE;

  // Peak gain of every effect (sum of its voices) stays <= 0.25; the SDK master gain is 1.
  K.sfx = {
    click: function () {
      var c = ac(); if (!c) return;
      voice(c, 'sine', 880, c.currentTime, 0.08, 0.06, 660);
    },
    ting: function () {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      voice(c, 'sine', 1568, t, 0.13, 0.5);
      voice(c, 'sine', 2093, t + 0.07, 0.09, 0.55);
      voice(c, 'triangle', 3136, t + 0.07, 0.02, 0.25);
    },
    /** Rising "good" note; step 0.. climbs the scale. */
    good: function (step) {
      var c = ac(); if (!c) return;
      var f = SCALE[K.clamp(step || 0, 0, SCALE.length - 1)];
      var t = c.currentTime;
      voice(c, 'sine', f, t, 0.16, 0.35);
      voice(c, 'sine', f * 2, t, 0.05, 0.18);
    },
    wrong: function () {
      var c = ac(); if (!c) return;
      voice(c, 'triangle', 220, c.currentTime, 0.13, 0.2, 165, 0.01);
    },
    boing: function () {
      var c = ac(); if (!c) return;
      voice(c, 'sine', 300, c.currentTime, 0.12, 0.3, 520, 0.01);
    },
    pop: function () {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      var k = K.rand(0.9, 1.1);
      noiseHit(c, t, 0.08, 0.03, 1400 * k, 0.9);
      voice(c, 'sine', 300 * k, t, 0.16, 0.06, 120 * k, 0.003);
    },
    snap: function () {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      noiseHit(c, t, 0.09, 0.025, 3500, 1.2, 'highpass');
      voice(c, 'square', 1250, t, 0.03, 0.035, 900, 0.002);
      voice(c, 'sine', 660, t + 0.02, 0.11, 0.16);
    },
    whoosh: function () {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      var src = c.createBufferSource();
      src.buffer = noise(c);
      var f = c.createBiquadFilter();
      f.type = 'bandpass';
      f.Q.value = 2;
      f.frequency.setValueAtTime(400, t);
      f.frequency.exponentialRampToValueAtTime(2400, t + 0.35);
      var g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.12);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      src.connect(f); f.connect(g); g.connect(KidsSDK.audio.output());
      src.start(t); src.stop(t + 0.45);
    },
    sparkle: function () {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      var fs = [1760, 2217, 2637, 3520];
      for (var i = 0; i < fs.length; i++) voice(c, 'sine', fs[i], t + i * 0.05, 0.05, 0.22);
    },
    fanfare: function () {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      var seq = [523.25, 659.25, 783.99, 1046.5];
      for (var i = 0; i < seq.length; i++) {
        voice(c, 'triangle', seq[i], t + i * 0.12, 0.13, i === 3 ? 0.7 : 0.25);
        voice(c, 'sine', seq[i] * 2, t + i * 0.12, 0.04, 0.2);
      }
    },
    /** Mallet / xylophone note: sine partials 1, 4, 10 with fast decay + tiny strike noise. */
    note: function (f, o) {
      var c = ac(); if (!c) return;
      var t = c.currentTime;
      var v = Math.min(0.16, (o && o.vol) || 0.16);   // sum of partials stays <= 0.25
      var len = (o && o.len) || 1.1;
      voice(c, 'sine', f, t, v, len, 0, 0.003);
      voice(c, 'sine', f * 4, t, v * 0.22, len * 0.18, 0, 0.002);
      voice(c, 'sine', f * 10.2, t, v * 0.07, 0.06, 0, 0.001);
      noiseHit(c, t, v * 0.25, 0.018, 5000, 0.8, 'highpass');
    }
  };

  // ------------------------------------------------------------------ screens + loop
  K.screen = function (name, def) { screens[name] = def; };
  K.go = function (name, arg) {
    pointers = {};
    if (cur && cur.leave) cur.leave();
    cur = screens[name];
    curName = name;
    parts = [];
    cheers = [];
    done = null;
    fade = 1;
    lastInput = K.time;
    if (cur.enter) cur.enter(arg);
    dirty = true;
  };
  K.current = function () { return curName; };

  function buttonsOf(scr) {
    if (!scr) return [];
    var b = typeof scr.buttons === 'function' ? scr.buttons() : scr.buttons;
    return b || [];
  }
  function activeButtons() { return done ? done.buttons : buttonsOf(cur); }
  function hitButton(list, p) {
    for (var i = list.length - 1; i >= 0; i--) {
      var b = list[i];
      if (!b || b.hidden) continue;
      var dx = p.x - b.x;
      var dy = p.y - b.y;
      if (dx * dx + dy * dy <= b.hit * b.hit) return b;
    }
    return null;
  }
  function toP(ev) {
    var q = view.toLogical(ev.clientX, ev.clientY);
    return { x: q.x, y: q.y, id: ev.pointerId };
  }
  function fromOverlay(ev) {
    var t = ev.target;
    return !!(t && t.closest && t.closest('[data-kgp]'));
  }

  document.addEventListener('pointerdown', function (ev) {
    if (fromOverlay(ev)) return;
    ev.preventDefault();
    if (!KidsSDK.isActive() || !cur) return;
    var c = KidsSDK.audio.context();
    if (c && c.state !== 'running') { try { c.resume(); } catch (e) { /* ignore */ } }
    lastInput = K.time;
    var p = toP(ev);
    var b = hitButton(activeButtons(), p);
    pointers[p.id] = { btn: b, x: p.x, y: p.y };
    dirty = true;
    if (b) { b.pressed = true; return; }
    if (done) return;
    if (cur.down) cur.down(p);
  }, { passive: false });

  window.addEventListener('pointermove', function (ev) {
    var st = pointers[ev.pointerId];
    if (!st || !KidsSDK.isActive()) return;
    ev.preventDefault();
    lastInput = K.time;
    var p = toP(ev);
    st.x = p.x;
    st.y = p.y;
    if (st.btn) {
      var dx = p.x - st.btn.x;
      var dy = p.y - st.btn.y;
      st.btn.pressed = dx * dx + dy * dy <= st.btn.hit * st.btn.hit * 1.5;
      return;
    }
    if (!done && cur && cur.move) cur.move(p);
  }, { passive: false });

  function endPointer(ev, cancel) {
    var st = pointers[ev.pointerId];
    if (!st) return;
    delete pointers[ev.pointerId];
    // For touch, browsers count pointerup (not pointerdown) as the user gesture that may start audio.
    if (!cancel && KidsSDK.isActive()) {
      var ac0 = KidsSDK.audio.context();
      if (ac0 && ac0.state !== 'running') { try { ac0.resume(); } catch (e) { /* SDK shows tap-to-play */ } }
    }
    var p = toP(ev);
    dirty = true;
    if (st.btn) {
      var b = st.btn;
      b.pressed = false;
      var dx = p.x - b.x;
      var dy = p.y - b.y;
      if (!cancel && KidsSDK.isActive() && !b.hidden && dx * dx + dy * dy <= b.hit * b.hit * 1.5) {
        K.sfx.click();
        b.onTap(b);
      }
      return;
    }
    if (!done && cur && cur.up) cur.up(p, !!cancel);
  }
  window.addEventListener('pointerup', function (ev) { endPointer(ev, false); });
  window.addEventListener('pointercancel', function (ev) { endPointer(ev, true); });
  document.addEventListener('contextmenu', function (ev) { ev.preventDefault(); });

  KidsSDK.onActiveChange(function (active) {
    if (!active) {
      for (var id in pointers) {
        var st = pointers[id];
        if (st.btn) st.btn.pressed = false;
        else if (!done && cur && cur.up) cur.up({ x: st.x, y: st.y, id: +id }, true);
      }
      pointers = {};
      if (cur && cur.pause) cur.pause();
    }
    dirty = true;
  });
  window.addEventListener('resize', function () { dirty = true; });

  function update(dt) {
    K.time += dt;
    if (fade > 0) fade = Math.max(0, fade - dt * 5);
    if (cur && cur.update) cur.update(dt);
    K.fx.update(dt);
    for (var i = cheers.length - 1; i >= 0; i--) {
      cheers[i].t += dt;
      if (cheers[i].t >= cheers[i].dur) cheers.splice(i, 1);
    }
    if (done) done.t += dt;
  }

  function render() {
    if (!KidsSDK.isActive() && !dirty) return;
    dirty = false;
    ctx.save();
    ctx.fillStyle = K.bgColor;
    ctx.fillRect(0, 0, W, H);
    if (cur && cur.render) cur.render(ctx);
    if (!done) {
      var bl = buttonsOf(cur);
      for (var i = 0; i < bl.length; i++) K.drawButton(bl[i]);
    }
    if (cur && cur.renderTop) cur.renderTop(ctx);
    renderCheers();
    K.fx.render();
    if (done) renderDone();
    if (fade > 0) {
      ctx.fillStyle = 'rgba(255,255,255,' + fade.toFixed(3) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
  }

  /** Starts the game on the given screen. */
  K.start = function (first, arg) {
    K.go(first, arg);
    KidsSDK.loop(update, render);
  };

  /**
   * Peek/step helpers for automated tests (a hidden browser tab throttles requestAnimationFrame).
   * step() advances the same paused-aware update() in 1/60 s ticks: it does nothing while inactive.
   */
  window.__kg = { screen: function () { return curName; }, done: function () { return !!done; },
    buttons: function () { return activeButtons().filter(function (b) { return !b.hidden; }).map(function (b) { return { icon: b.icon, x: b.x, y: b.y }; }); },
    step: function (sec) {
      var n = Math.round((sec || 0) * 60);
      for (var i = 0; i < n; i++) if (KidsSDK.isActive()) update(1 / 60);
      dirty = true;
      render();
      return K.time;
    } };

  return K;
})();
