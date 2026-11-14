/*
 * T — tracing engine shared by ToNet, ToChu and ToSo (brief §7).
 *
 * Shapes are lists of strokes written in a tiny path language (units are free: glyph units for
 * letters, pixels for ToNet):
 *   M x y            move (start)                L x y              line
 *   Q cx cy x y      quadratic Bezier            C c1x c1y c2x c2y x y  cubic Bezier
 *   E cx cy rx ry a0 a1   elliptical arc from angle a0 to a1 in degrees (0 = right, 90 = down;
 *                    decreasing angles run counter-clockwise on screen)
 *   D x y            a dot (tapped, not traced)
 * Every stroke is resampled to evenly spaced points (default 2 units).
 */
var T = (function () {
  'use strict';

  function tokens(str) {
    return str.match(/[MLQCED]|-?[0-9]*\.?[0-9]+/g) || [];
  }

  function sampleStroke(str, step) {
    var tk = tokens(str);
    var dense = [];
    var cx = null;
    var cy = null;
    var fine = step / 4;
    var i = 0;
    var dot = false;
    function num() { return parseFloat(tk[i++]); }
    function add(x, y) {
      if (cx !== null && Math.abs(x - cx) < 1e-6 && Math.abs(y - cy) < 1e-6) return;
      dense.push(x, y);
      cx = x;
      cy = y;
    }
    function lineTo(x, y) {
      if (cx === null) { add(x, y); return; }
      var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      var n = Math.max(1, Math.ceil(d / fine));
      var x0 = cx;
      var y0 = cy;
      for (var k = 1; k <= n; k++) add(x0 + (x - x0) * k / n, y0 + (y - y0) * k / n);
    }
    while (i < tk.length) {
      var c = tk[i++];
      var x, y, n, k, t, a0, a1, rx, ry, ex, ey;
      if (c === 'M') {
        x = num(); y = num();
        if (cx === null) add(x, y); else lineTo(x, y);
      } else if (c === 'L') {
        x = num(); y = num();
        lineTo(x, y);
      } else if (c === 'D') {
        x = num(); y = num();
        add(x, y);
        dot = true;
      } else if (c === 'Q') {
        var qx = num(); var qy = num();
        x = num(); y = num();
        var sx = cx; var sy = cy;
        n = Math.max(2, Math.ceil((Math.abs(qx - sx) + Math.abs(qy - sy) + Math.abs(x - qx) + Math.abs(y - qy)) / fine));
        for (k = 1; k <= n; k++) {
          t = k / n;
          add((1 - t) * (1 - t) * sx + 2 * (1 - t) * t * qx + t * t * x, (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * qy + t * t * y);
        }
      } else if (c === 'C') {
        var c1x = num(); var c1y = num(); var c2x = num(); var c2y = num();
        x = num(); y = num();
        var bx = cx; var by = cy;
        n = Math.max(2, Math.ceil((Math.abs(c1x - bx) + Math.abs(c1y - by) + Math.abs(c2x - c1x) + Math.abs(c2y - c1y) + Math.abs(x - c2x) + Math.abs(y - c2y)) / fine));
        for (k = 1; k <= n; k++) {
          t = k / n;
          var u = 1 - t;
          add(u * u * u * bx + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x,
            u * u * u * by + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y);
        }
      } else if (c === 'E') {
        ex = num(); ey = num(); rx = num(); ry = num(); a0 = num(); a1 = num();
        var sa = a0 * Math.PI / 180;
        lineTo(ex + rx * Math.cos(sa), ey + ry * Math.sin(sa));
        n = Math.max(4, Math.ceil(Math.abs(a1 - a0) * Math.PI / 180 * Math.max(rx, ry) / fine));
        for (k = 1; k <= n; k++) {
          var a = (a0 + (a1 - a0) * k / n) * Math.PI / 180;
          add(ex + rx * Math.cos(a), ey + ry * Math.sin(a));
        }
      }
    }
    if (dot) return { pts: dense.slice(0, 2), dot: true, len: 0 };
    return resample(dense, step);
  }

  /** Evenly spaced points along a dense polyline; first and last points are kept exactly. */
  function resample(d, step) {
    var out = [d[0], d[1]];
    var px = d[0];
    var py = d[1];
    var acc = 0;
    var len = 0;
    for (var i = 2; i < d.length; i += 2) {
      var x = d[i];
      var y = d[i + 1];
      var seg = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
      len += seg;
      while (acc + seg >= step && seg > 0) {
        var t = (step - acc) / seg;
        px = px + (x - px) * t;
        py = py + (y - py) * t;
        out.push(px, py);
        seg = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
        acc = 0;
      }
      acc += seg;
      px = x;
      py = y;
    }
    var lx = d[d.length - 2];
    var ly = d[d.length - 1];
    if (acc > step * 0.35 || out.length < 4) out.push(lx, ly);
    else { out[out.length - 2] = lx; out[out.length - 1] = ly; }
    return { pts: out, dot: false, len: len };
  }

  /** strokes: array of path strings -> array of {pts, dot, len}. */
  function compile(defs, step) {
    var out = [];
    for (var i = 0; i < defs.length; i++) out.push(sampleStroke(defs[i], step || 2));
    return out;
  }

  function bbox(strokes) {
    var b = { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 };
    for (var i = 0; i < strokes.length; i++) {
      var p = strokes[i].pts;
      for (var k = 0; k < p.length; k += 2) {
        if (p[k] < b.x0) b.x0 = p[k];
        if (p[k] > b.x1) b.x1 = p[k];
        if (p[k + 1] < b.y0) b.y0 = p[k + 1];
        if (p[k + 1] > b.y1) b.y1 = p[k + 1];
      }
    }
    return b;
  }

  /** Copies strokes into screen space: x' = ox + x*s, y' = oy + y*s. */
  function place(strokes, s, ox, oy) {
    var out = [];
    for (var i = 0; i < strokes.length; i++) {
      var p = strokes[i].pts;
      var q = new Array(p.length);
      for (var k = 0; k < p.length; k += 2) {
        q[k] = ox + p[k] * s;
        q[k + 1] = oy + p[k + 1] * s;
      }
      out.push({ pts: q, dot: strokes[i].dot, len: strokes[i].len * s });
    }
    return out;
  }

  /** Fits strokes (by their bbox) centered in rect {x,y,w,h} with a fixed scale s. */
  function fit(strokes, s, rect) {
    var b = bbox(strokes);
    var ox = rect.x + rect.w / 2 - (b.x0 + b.x1) / 2 * s;
    var oy = rect.y + rect.h / 2 - (b.y0 + b.y1) / 2 * s;
    return place(strokes, s, ox, oy);
  }

  function nearest(pts, x, y, i0, i1) {
    var best = -1;
    var bd = 1e18;
    for (var i = i0; i <= i1; i++) {
      var dx = pts[i * 2] - x;
      var dy = pts[i * 2 + 1] - y;
      var d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    return { i: best, d2: bd };
  }

  function angleAt(pts, i) {
    var n = pts.length / 2;
    var a = Math.max(0, Math.min(n - 2, i));
    var b = a + 1;
    if (n < 2) return 0;
    var k = Math.min(n - 1, b + 2);
    var j = Math.max(0, a - 2);
    return Math.atan2(pts[k * 2 + 1] - pts[j * 2 + 1], pts[k * 2] - pts[j * 2]);
  }

  /** Index whose arc distance from index i0 is about d (step = spacing in screen units). */
  function ahead(pts, i0, d) {
    var n = pts.length / 2;
    var acc = 0;
    for (var i = i0 + 1; i < n; i++) {
      acc += Math.sqrt(Math.pow(pts[i * 2] - pts[i * 2 - 2], 2) + Math.pow(pts[i * 2 + 1] - pts[i * 2 - 1], 2));
      if (acc >= d) return i;
    }
    return n - 1;
  }

  function polyline(c, pts, i0, i1) {
    c.beginPath();
    c.moveTo(pts[i0 * 2], pts[i0 * 2 + 1]);
    for (var i = i0 + 1; i <= i1; i++) c.lineTo(pts[i * 2], pts[i * 2 + 1]);
  }

  function arrowHead(c, x, y, ang, size, color) {
    c.save();
    c.translate(x, y);
    c.rotate(ang);
    c.beginPath();
    c.moveTo(size * 0.62, 0);
    c.lineTo(-size * 0.42, -size * 0.55);
    c.lineTo(-size * 0.18, 0);
    c.lineTo(-size * 0.42, size * 0.55);
    c.closePath();
    c.fillStyle = color;
    c.fill();
    c.lineJoin = 'round';
    c.lineWidth = Math.max(2, size * 0.1);
    c.strokeStyle = '#ffffff';
    c.stroke();
    c.restore();
  }

  /** Crayon-looking stroke: solid core + light wax highlight. */
  function crayon(c, pts, i0, i1, w, color, light) {
    if (i1 <= i0) {
      c.beginPath();
      c.arc(pts[i0 * 2], pts[i0 * 2 + 1], w / 2, 0, Math.PI * 2);
      c.fillStyle = color;
      c.fill();
      return;
    }
    polyline(c, pts, i0, i1);
    c.lineWidth = w;
    c.strokeStyle = color;
    c.stroke();
    c.save();
    c.translate(-w * 0.12, -w * 0.14);
    polyline(c, pts, i0, i1);
    c.lineWidth = w * 0.28;
    c.strokeStyle = light || 'rgba(255,255,255,0.45)';
    c.stroke();
    c.restore();
  }

  // ------------------------------------------------------------------ Tracer
  /**
   * strokes: placed strokes (screen units). o: {width, tol, color, light, onStroke(i, last), onDone(),
   * noNumbers, noHead (no marker at the progress point), noEnd (no ring at the stroke end)}
   */
  function Tracer(strokes, o) {
    this.s = strokes;
    this.o = o;
    this.reset();
  }
  var TP = Tracer.prototype;

  TP.reset = function () {
    this.cur = 0;
    this.prog = 0;
    this.shown = 0;
    this.done = false;
    this.pid = null;
    this.on = false;
    this.last = null;
    this.stray = [];
    this.flash = 0;
    this.bounce = 0;
    this.doneFlash = [];
    for (var i = 0; i < this.s.length; i++) this.doneFlash.push(0);
  };

  TP.head = function () {
    var st = this.s[this.cur];
    var i = Math.round(this.shown);
    return { x: st.pts[i * 2], y: st.pts[i * 2 + 1], a: angleAt(st.pts, i) };
  };

  TP.fraction = function () {
    var st = this.s[this.cur];
    var n = st.pts.length / 2;
    return n > 1 ? this.prog / (n - 1) : 0;
  };

  TP.down = function (p) {
    if (this.done || this.pid !== null) return false;
    this.pid = p.id;
    this.last = { x: p.x, y: p.y };
    this.on = false;
    this.feed(p.x, p.y);
    return true;
  };

  TP.move = function (p) {
    if (p.id !== this.pid || this.done || !this.last) return;
    var l = this.last;
    var dx = p.x - l.x;
    var dy = p.y - l.y;
    var d = Math.sqrt(dx * dx + dy * dy);
    var n = Math.max(1, Math.ceil(d / (this.o.tol * 0.35)));
    for (var k = 1; k <= n && !this.done; k++) this.feed(l.x + dx * k / n, l.y + dy * k / n);
    this.last = { x: p.x, y: p.y };
  };

  TP.up = function (p, cancel) {
    if (p.id !== this.pid) return;
    // the last position often arrives only with pointerup (real fingers, adb swipes)
    if (!cancel) {
      this.move(p);
      // a young finger often stops a little short: lifted near the end of an almost-done stroke = done
      var st = this.s[this.cur];
      var n = st.pts.length / 2;
      if (!this.done && this.pid !== null && !st.dot && this.prog >= 0.85 * (n - 1)) {
        var ex = st.pts[(n - 1) * 2] - p.x;
        var ey = st.pts[(n - 1) * 2 + 1] - p.y;
        if (ex * ex + ey * ey <= this.o.tol * this.o.tol * 2.25) this.finishStroke();
      }
    }
    this.pid = null;
    this.on = false;
    this.last = null;
  };

  TP.addStray = function (x, y) {
    this.stray.push({ x: x, y: y, t: K.time });
    if (this.stray.length > 60) this.stray.shift();
  };

  TP.feed = function (x, y) {
    var st = this.s[this.cur];
    var tol = this.o.tol;
    if (st.dot) {
      var ddx = x - st.pts[0];
      var ddy = y - st.pts[1];
      if (ddx * ddx + ddy * ddy <= tol * tol * 2.25) this.finishStroke();
      else this.addStray(x, y);
      return;
    }
    var n = st.pts.length / 2;
    if (!this.on) {
      var hx = st.pts[this.prog * 2];
      var hy = st.pts[this.prog * 2 + 1];
      if ((x - hx) * (x - hx) + (y - hy) * (y - hy) <= tol * tol * 2.25) this.on = true;
      else { this.addStray(x, y); return; }
    }
    var r = nearest(st.pts, x, y, Math.max(0, this.prog - 5), Math.min(n - 1, this.prog + 20));
    if (r.d2 <= tol * tol) {
      if (r.i > this.prog) this.prog = r.i;
    } else {
      this.addStray(x, y);
      if (r.d2 > tol * tol * 6.25) this.on = false;
    }
    if (this.prog >= 0.95 * (n - 1)) this.finishStroke();
  };

  TP.finishStroke = function () {
    var st = this.s[this.cur];
    var i = this.cur;
    this.prog = st.pts.length / 2 - 1;
    this.shown = this.prog;
    this.doneFlash[i] = 1;
    var last = i === this.s.length - 1;
    if (!last) {
      this.cur++;
      this.prog = 0;
      this.shown = 0;
      this.on = false;
      this.bounce = 1;
    } else {
      this.done = true;
      this.pid = null;
    }
    if (this.o.onStroke) this.o.onStroke(i, last);
    if (last && this.o.onDone) this.o.onDone();
  };

  TP.update = function (dt) {
    this.shown += (this.prog - this.shown) * Math.min(1, dt * 18);
    if (Math.abs(this.prog - this.shown) < 0.05) this.shown = this.prog;
    this.bounce = Math.max(0, this.bounce - dt * 2.5);
    for (var i = 0; i < this.doneFlash.length; i++) this.doneFlash[i] = Math.max(0, this.doneFlash[i] - dt * 2);
    while (this.stray.length && K.time - this.stray[0].t > 0.6) this.stray.shift();
  };

  /** Guide (road + dots + markers) and crayon. o: {hideFuture, roadColor, edgeColor} */
  TP.render = function (c, ro) {
    ro = ro || {};
    var o = this.o;
    var w = o.width;
    var s = this.s;
    var i, st, n;
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // 1. road edges then road surfaces
    for (var pass = 0; pass < 2; pass++) {
      for (i = 0; i < s.length; i++) {
        st = s[i];
        n = st.pts.length / 2;
        c.globalAlpha = i > this.cur && !this.done ? 0.6 : 1;
        if (st.dot) {
          c.beginPath();
          c.arc(st.pts[0], st.pts[1], w / 2 + (pass ? 0 : 5), 0, Math.PI * 2);
          c.fillStyle = pass ? (ro.road || '#ffffff') : (ro.edge || '#CFD7E3');
          c.fill();
          continue;
        }
        polyline(c, st.pts, 0, n - 1);
        c.lineWidth = pass ? w : w + 10;
        c.strokeStyle = pass ? (i === this.cur && !this.done ? (ro.roadCur || '#ffffff') : (ro.road || '#F4F6FA')) : (ro.edge || '#CFD7E3');
        c.stroke();
      }
    }
    c.globalAlpha = 1;
    // 2. dotted center lines on strokes not finished yet
    for (i = 0; i < s.length; i++) {
      if (i < this.cur || this.done) continue;
      st = s[i];
      if (st.dot) continue;
      n = st.pts.length / 2;
      polyline(c, st.pts, 0, n - 1);
      c.setLineDash([0.1, Math.max(14, w * 0.36)]);
      c.lineWidth = Math.max(6, w * 0.15);
      c.strokeStyle = i === this.cur ? '#8C99AE' : '#C9D1DD';
      c.stroke();
      c.setLineDash([]);
    }
    // 3. crayon: finished strokes + current progress
    var cw = w * 0.74;
    for (i = 0; i < s.length; i++) {
      st = s[i];
      n = st.pts.length / 2;
      var end = i < this.cur || this.done ? n - 1 : (i === this.cur ? Math.round(this.shown) : -1);
      if (end < 0 || (i === this.cur && !this.done && end === 0 && !this.on && !st.dot)) continue;
      if (st.dot && i === this.cur && !this.done) continue;
      var fl = this.doneFlash[i];
      if (fl > 0) {
        c.save();
        c.globalAlpha = fl * 0.6;
        polyline(c, st.pts, 0, n - 1);
        if (st.dot) { c.beginPath(); c.arc(st.pts[0], st.pts[1], w * 0.6, 0, Math.PI * 2); c.fillStyle = '#FFF3A6'; c.fill(); }
        else { c.lineWidth = w * (1 + fl * 0.5); c.strokeStyle = '#FFF3A6'; c.stroke(); }
        c.restore();
      }
      crayon(c, st.pts, 0, end, cw, o.color || '#FF6B4A', o.light);
    }
    // 4. markers for the current stroke + numbers for the next ones
    if (!this.done) {
      for (i = s.length - 1; i >= this.cur; i--) {
        st = s[i];
        var sx = st.pts[0];
        var sy = st.pts[1];
        var r = Math.max(19, w * 0.42);
        if (i === this.cur) {
          if (this.prog === 0 || st.dot) {
            var sc = 1 + Math.sin(K.time * 5) * 0.07 + this.bounce * 0.5 * Math.sin(this.bounce * 10);
            if (!st.dot) {
              var ai = ahead(st.pts, 0, r * 2.1);
              if (ai > 0) arrowHead(c, st.pts[ai * 2], st.pts[ai * 2 + 1], angleAt(st.pts, ai), r * 1.25, '#24A35A');
            }
            c.beginPath();
            c.arc(sx, sy, r * sc, 0, Math.PI * 2);
            c.fillStyle = '#24A35A';
            c.fill();
            c.lineWidth = 5;
            c.strokeStyle = '#ffffff';
            c.stroke();
            if (!o.noNumbers) K.text(String(i + 1), sx, sy + 1, r * 1.15, '#ffffff', { stroke: false });
          } else if (!o.noHead) {
            var h = this.head();
            c.beginPath();
            c.arc(h.x, h.y, cw * 0.55, 0, Math.PI * 2);
            c.fillStyle = '#ffffff';
            c.fill();
            c.lineWidth = 6;
            c.strokeStyle = o.color || '#FF6B4A';
            c.stroke();
            var ni = ahead(st.pts, Math.round(this.shown), r * 2.2);
            if (ni > Math.round(this.shown) + 1) arrowHead(c, st.pts[ni * 2], st.pts[ni * 2 + 1], angleAt(st.pts, ni), r * 1.05, 'rgba(36,163,90,0.75)');
          }
          if (!st.dot && !o.noEnd) {
            var en = st.pts.length / 2 - 1;
            c.beginPath();
            c.arc(st.pts[en * 2], st.pts[en * 2 + 1], Math.max(10, w * 0.2), 0, Math.PI * 2);
            c.lineWidth = 5;
            c.strokeStyle = 'rgba(242,120,48,0.75)';
            c.stroke();
          }
        } else if (!o.noNumbers) {
          c.beginPath();
          c.arc(sx, sy, r * 0.8, 0, Math.PI * 2);
          c.fillStyle = 'rgba(150,165,185,0.85)';
          c.fill();
          K.text(String(i + 1), sx, sy + 1, r * 0.95, '#ffffff', { stroke: false });
        }
      }
    }
    // 5. faint trail when the finger is off the path (fades away, never thick)
    if (this.stray.length > 1) {
      for (i = 1; i < this.stray.length; i++) {
        var a = this.stray[i - 1];
        var b = this.stray[i];
        if (b.t - a.t > 0.12) continue;
        var age = K.time - b.t;
        c.globalAlpha = Math.max(0, 0.35 * (1 - age / 0.6));
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.lineWidth = 8;
        c.strokeStyle = '#8C99AE';
        c.stroke();
      }
      c.globalAlpha = 1;
    }
    c.restore();
  };

  /** Hint hand running along the current stroke after `delay` idle seconds. */
  TP.renderHint = function (c, idle, delay) {
    if (this.done || this.pid !== null) return;
    delay = delay || 4;
    if (idle < delay) return;
    var st = this.s[this.cur];
    var n = st.pts.length / 2;
    var cyc = (idle - delay) % 2.8;
    var fadeIn = K.clamp((idle - delay) / 0.3, 0, 1);
    if (st.dot) {
      var pr = cyc < 0.6 ? cyc / 0.6 : (cyc < 1.2 ? 1 - (cyc - 0.6) / 0.6 : 0);
      K.drawHand(st.pts[0], st.pts[1], pr, fadeIn);
      return;
    }
    var from = Math.round(this.prog);
    var ph = K.clamp((cyc - 0.3) / 2.0, 0, 1);
    var idx = Math.round(from + (n - 1 - from) * K.easeInOut(ph));
    var alpha = fadeIn * (cyc > 2.4 ? 1 - (cyc - 2.4) / 0.4 : 1);
    if (ph > 0) {
      c.save();
      c.globalAlpha = 0.35 * alpha;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      polyline(c, st.pts, from, idx);
      c.lineWidth = this.o.width * 0.5;
      c.strokeStyle = '#FFD24A';
      c.stroke();
      c.restore();
    }
    K.drawHand(st.pts[idx * 2], st.pts[idx * 2 + 1], cyc < 0.3 ? cyc / 0.3 : 1, alpha);
  };

  // ------------------------------------------------------------------ debug view (#debug)
  /** Thin drawing of a shape with stroke numbers, arrows, green start and red end points. */
  function debugDraw(c, strokes, label) {
    var cols = ['#E74C3C', '#2E86DE', '#27AE60', '#8E44AD', '#E67E22', '#16A085'];
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (var i = 0; i < strokes.length; i++) {
      var st = strokes[i];
      var n = st.pts.length / 2;
      var col = cols[i % cols.length];
      if (st.dot) {
        c.beginPath(); c.arc(st.pts[0], st.pts[1], 5, 0, Math.PI * 2); c.fillStyle = col; c.fill();
        K.text(String(i + 1), st.pts[0] + 12, st.pts[1] - 10, 15, col, { lw: 4 });
        continue;
      }
      polyline(c, st.pts, 0, n - 1);
      c.lineWidth = 4;
      c.strokeStyle = col;
      c.stroke();
      var m = Math.floor(n * 0.5);
      arrowHead(c, st.pts[m * 2], st.pts[m * 2 + 1], angleAt(st.pts, m), 16, col);
      c.beginPath(); c.arc(st.pts[0], st.pts[1], 6, 0, Math.PI * 2); c.fillStyle = '#1E9E4F'; c.fill();
      c.beginPath(); c.arc(st.pts[(n - 1) * 2], st.pts[(n - 1) * 2 + 1], 5, 0, Math.PI * 2); c.fillStyle = '#D0021B'; c.fill();
      K.text(String(i + 1), st.pts[0] - 10, st.pts[1] - 12, 16, col, { lw: 4 });
    }
    c.restore();
    if (label) K.text(label.t, label.x, label.y, 18, '#333', { lw: 4 });
  }

  return {
    compile: compile, bbox: bbox, place: place, fit: fit, nearest: nearest, angleAt: angleAt, ahead: ahead,
    polyline: polyline, crayon: crayon, arrowHead: arrowHead, Tracer: Tracer, debugDraw: debugDraw
  };
})();
