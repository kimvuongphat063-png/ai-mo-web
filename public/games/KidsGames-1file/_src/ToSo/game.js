/*
 * Tô số và đếm — part 1: trace a digit, then count that many things by tapping them.
 * Part 2: look at 1..10 things and pick the right number card (never locked; suggested after 0..5).
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var SCALE = 4.0;
  var ROAD = Math.round(100 * SCALE * 0.17);
  var TOL = Math.max(30, Math.round(100 * SCALE * 0.12));
  var CRAYONS = ['#FF6B4A', '#FF9F1C', '#2EB872', '#3D8BFD', '#9B5DE5', '#FF5DA2', '#00A6A6', '#E2574C', '#5B8DEF', '#F29E38'];
  var THINGS = ['apple', 'star', 'fish', 'cake', 'flower', 'strawberry', 'duck', 'ball', 'balloon', 'candy'];
  var AREA = { x: 300, y: 64, w: 540, h: 630 };
  var QUIZ_LEN = 5;

  // ------------------------------------------------------------------ save
  var traced = [];
  for (var i = 0; i < 10; i++) traced.push(0);
  var quizCorrect = 0;
  var quizRounds = 0;
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved) {
    for (i = 0; i < 10; i++) traced[i] = saved.traced && saved.traced[i] ? 1 : 0;
    quizCorrect = saved.quizCorrect | 0;
    quizRounds = saved.quizRounds | 0;
  }
  function save() {
    KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, traced: traced, quizCorrect: quizCorrect, quizRounds: quizRounds });
  }
  KidsSDK.onSave(save);
  function firstUntraced() {
    for (var k = 0; k < 10; k++) if (!traced[k]) return k;
    return -1;
  }
  function part2Suggested() {
    for (var k = 0; k <= 5; k++) if (!traced[k]) return false;
    return true;
  }

  /** n things laid out in rows of 5 (like a ten-frame) inside rect r. */
  function layout(n, r, size) {
    var out = [];
    var rows = Math.ceil(n / 5);
    var gapX = size * 1.22;
    var gapY = size * 1.25;
    for (var k = 0; k < n; k++) {
      var row = Math.floor(k / 5);
      var inRow = Math.min(5, n - row * 5);
      var col = k % 5;
      out.push({ x: r.x + r.w / 2 + (col - (inRow - 1) / 2) * gapX, y: r.y + r.h / 2 + (row - (rows - 1) / 2) * gapY });
    }
    return out;
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });

  // ------------------------------------------------------------------ part 1a: trace
  var digit = 0;
  var tr = null;
  var finished = 0;
  var color = CRAYONS[0];

  function startDigit(n) {
    digit = (n + 10) % 10;
    color = CRAYONS[digit];
    var strokes = T.fit(T.compile(GLYPHS.digits[String(digit)], 2), SCALE, AREA);
    finished = 0;
    tr = new T.Tracer(strokes, {
      width: ROAD, tol: TOL, color: color,
      onStroke: function (si, last) {
        K.sfx.ting();
        if (!last) K.cheer('shi_clap', 'right', 1.0, 240);
      },
      onDone: function () {
        finished = 0.001;
        traced[digit] = 1;
        save();
        K.sfx.sparkle();
        var b = T.bbox(strokes);
        K.fx.burst((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 24, { kind: 'star' });
      }
    });
    K.go('trace');
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
        if (finished > 1.3) startCount();
      }
    },
    render: function (c) {
      K.bg('#EAF8E6', '#CDEFC4');
      c.fillStyle = 'rgba(255,255,255,0.5)';
      K.rr(AREA.x - 10, AREA.y - 6, AREA.w + 20, AREA.h + 6, 40);
      c.fill();
      K.dots(tr.s.length, tr.done ? tr.s.length : tr.cur, 640, 40, 11, color, tr.done ? -1 : tr.cur);
      tr.render(c);
      K.rr(950, 158, 250, 300, 30); c.fillStyle = 'rgba(40,60,90,0.15)'; c.fill();
      K.rr(950, 150, 250, 300, 30); c.fillStyle = '#ffffff'; c.fill();
      GLYPHS.draw(c, String(digit), 1075, 300, 190, color);
      K.drawImg('gi_wave', 170, H - 16, 300, { bottom: true });
      tr.renderHint(c, K.idle(), 4.5);
    }
  });

  // ------------------------------------------------------------------ part 1b: count
  var things = [];
  var counted = 0;
  var countDone = 0;
  var COUNT_RECT = { x: 430, y: 150, w: 790, h: 470 };

  function startCount() {
    var pos = layout(digit, COUNT_RECT, 112);
    things = pos.map(function (p, k) { return { x: p.x, y: p.y, n: 0, bounce: 0, appear: -k * 0.08 }; });
    counted = 0;
    countDone = 0;
    K.go('count');
  }

  function countHit(p) {
    if (digit === 0) {
      if (K.dist(p.x, p.y, 825, 420) < 150) finishCount();
      return;
    }
    var best = -1;
    var bd = 75;
    for (var k = 0; k < things.length; k++) {
      var d = K.dist(p.x, p.y, things[k].x, things[k].y);
      if (d < bd) { bd = d; best = k; }
    }
    if (best < 0) return;
    var t = things[best];
    t.bounce = 1;
    if (t.n) { K.sfx.boing(); return; }
    counted++;
    t.n = counted;
    K.sfx.good(counted - 1);
    K.fx.float(String(counted), t.x, t.y - 80, CRAYONS[(counted - 1) % 10], 72);
    if (counted === digit) finishCount();
  }

  function finishCount() {
    if (countDone) return;
    countDone = 0.001;
    K.fx.burst(825, 380, 30, { kind: 'star' });
    K.sfx.ting();
    K.cheer('shi_cheer', 'right', 2.0, 300);
  }

  K.screen('count', {
    buttons: [menuBtn],
    down: function (p) { if (!countDone) countHit(p); },
    pause: function () { save(); },
    update: function (dt) {
      for (var k = 0; k < things.length; k++) {
        things[k].bounce = Math.max(0, things[k].bounce - dt * 3);
        things[k].appear += dt;
      }
      if (countDone > 0) {
        countDone += dt;
        if (countDone > 1.6 && !K.isDone()) {
          K.showDone({
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startDigit(digit); },
            onNext: function () { startDigit(digit + 1); },
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#EAF8E6', '#CDEFC4');
      K.rr(80, 170, 260, 330, 30); c.fillStyle = '#ffffff'; c.fill();
      GLYPHS.draw(c, String(digit), 210, 335, 220, color);
      var big = digit === 0 ? (countDone ? '0' : '') : (counted ? String(counted) : '');
      if (big) K.text(big, 825, 80, 96, CRAYONS[Math.max(0, counted - 1) % 10], { lw: 18 });
      if (digit === 0) {
        var s = 1 + (countDone ? Math.sin(Math.min(countDone, 0.5) / 0.5 * Math.PI) * 0.15 : 0);
        c.save();
        c.translate(825, 440);
        c.scale(s, s);
        c.beginPath(); c.moveTo(-150, -40); c.lineTo(150, -40); c.lineTo(115, 90); c.lineTo(-115, 90); c.closePath();
        c.fillStyle = '#D9A066'; c.fill();
        c.lineWidth = 6; c.strokeStyle = '#A0703F'; c.stroke();
        c.beginPath(); c.ellipse(0, -40, 150, 26, 0, 0, Math.PI * 2); c.fillStyle = '#8A5A2B'; c.fill();
        c.restore();
        if (!K.isDone()) K.drawImg('shi_puzzled', 1130, H - 10, 260, { bottom: true });
      }
      for (var k = 0; k < things.length; k++) {
        var t = things[k];
        if (t.appear < 0) continue;
        var a = K.easeOutBack(t.appear / 0.35);
        var by = -Math.sin(t.bounce * Math.PI) * 30;
        if (t.n) {
          K.circle(t.x, t.y, 64, 'rgba(255,255,255,0.75)');
        }
        ART.draw(c, THINGS[digit], t.x, t.y + by, 112 * a * (1 + t.bounce * 0.15), { t: K.time });
        if (t.n) {
          K.circle(t.x + 44, t.y - 44, 22, CRAYONS[(t.n - 1) % 10], '#ffffff', 4);
          K.text(String(t.n), t.x + 44, t.y - 43, 30, '#ffffff', { stroke: false });
        }
      }
      if (!countDone && K.idle() > 4.5) {
        var target = null;
        if (digit === 0) target = { x: 825, y: 430 };
        else for (k = 0; k < things.length; k++) if (!things[k].n) { target = things[k]; break; }
        if (target) {
          var cyc = (K.idle() - 4.5) % 1.4;
          K.drawHand(target.x + 10, target.y + 20, cyc < 0.5 ? cyc / 0.5 : (cyc < 0.8 ? 1 : 0), K.clamp((K.idle() - 4.5) / 0.3, 0, 1));
        }
      }
    }
  });

  // ------------------------------------------------------------------ part 2: which number?
  var q = null;      // {k, kind, cards:[3], shake:[3], good:-1, t}
  var qIndex = 0;
  var qRight = 0;
  var lastK = 0;
  var CARD_Y = 575;
  var CARD_X = [410, 640, 870];
  var QUIZ_RECT = { x: 180, y: 110, w: 920, h: 330 };

  function newQuestion() {
    var k;
    do { k = K.randInt(1, 10); } while (k === lastK);
    lastK = k;
    var opts = [k];
    var cand = [k - 2, k - 1, k + 1, k + 2].filter(function (v) { return v >= 1 && v <= 10; });
    K.shuffle(cand);
    opts.push(cand[0], cand[1]);
    K.shuffle(opts);
    q = { k: k, kind: K.pick(THINGS), cards: opts, shake: [0, 0, 0], good: -1, t: 0, pos: layout(k, QUIZ_RECT, 92), helper: 0 };
  }

  function startQuiz() {
    qIndex = 0;
    qRight = 0;
    newQuestion();
    K.go('quiz');
  }

  K.screen('quiz', {
    buttons: [menuBtn],
    down: function (p) {
      if (q.good >= 0) return;
      for (var k = 0; k < 3; k++) {
        if (Math.abs(p.x - CARD_X[k]) < 90 && Math.abs(p.y - CARD_Y) < 90) {
          if (q.cards[k] === q.k) {
            q.good = k;
            q.t = 0;
            qRight++;
            quizCorrect++;
            save();
            K.sfx.ting();
            K.fx.burst(CARD_X[k], CARD_Y, 20, { kind: 'star' });
            K.cheer(qIndex % 2 ? 'gi_clap' : 'shi_clap', qIndex % 2 ? 'left' : 'right', 1.4, 260);
          } else {
            q.shake[k] = 1;
            K.sfx.wrong();
          }
          return;
        }
      }
    },
    pause: function () { save(); },
    update: function (dt) {
      q.t += dt;
      for (var k = 0; k < 3; k++) q.shake[k] = Math.max(0, q.shake[k] - dt * 2.5);
      if (q.good < 0 && K.idle() > 5) q.helper = Math.min(q.k + 1.5, q.helper + dt * 1.6);
      if (q.good >= 0 && q.t > 1.3) {
        qIndex++;
        if (qIndex >= QUIZ_LEN) {
          if (!K.isDone()) {
            quizRounds++;
            save();
            K.showDone({
              left: 'gi_cheer', right: 'shi_cheer',
              onReplay: function () { startQuiz(); },
              onNext: function () { startQuiz(); },
              onMenu: function () { K.go('menu'); }
            });
          }
        } else {
          newQuestion();
          K.poke();
        }
      }
    },
    render: function (c) {
      K.bg('#FFF7E0', '#FFE6B0');
      K.dots(QUIZ_LEN, qIndex + (q.good >= 0 ? 1 : 0), 640, 40, 12, '#2EB872', qIndex);
      K.rr(QUIZ_RECT.x, QUIZ_RECT.y, QUIZ_RECT.w, QUIZ_RECT.h, 36);
      c.fillStyle = 'rgba(255,255,255,0.7)';
      c.fill();
      for (var k = 0; k < q.pos.length; k++) {
        var p = q.pos[k];
        var hop = 0;
        if (q.good >= 0) hop = Math.max(0, Math.sin((q.t * 6 - k * 0.5))) * 18;
        var lit = q.helper > k + 1;
        if (lit) K.circle(p.x, p.y, 52, 'rgba(255,210,74,0.5)');
        ART.draw(c, q.kind, p.x, p.y - hop, 92, { t: K.time });
        if (lit) {
          K.circle(p.x + 36, p.y - 36, 18, '#2EB872', '#ffffff', 3);
          K.text(String(k + 1), p.x + 36, p.y - 35, 24, '#ffffff', { stroke: false });
        }
      }
      for (k = 0; k < 3; k++) {
        var x = CARD_X[k] + Math.sin(q.shake[k] * 30) * 14 * q.shake[k];
        var good = q.good === k;
        var hintCard = q.good < 0 && q.helper >= q.k + 1.4 && q.cards[k] === q.k;
        var s = good ? 1 + Math.sin(Math.min(q.t, 0.4) / 0.4 * Math.PI) * 0.15 : 1;
        c.save();
        c.translate(x, CARD_Y);
        c.scale(s, s);
        if (hintCard) {
          K.rr(-94, -94, 188, 188, 36);
          c.fillStyle = 'rgba(255,205,46,' + (0.4 + 0.3 * Math.sin(K.time * 4)).toFixed(2) + ')';
          c.fill();
        }
        K.tile(-80, -80, 160, 160, { color: good ? '#C8F7C5' : '#ffffff', radius: 30 });
        GLYPHS.draw(c, String(q.cards[k]), 0, 0, q.cards[k] === 10 ? 92 : 110, good ? '#1E9E4F' : '#2B4C7E');
        c.restore();
      }
      if (!K.isDone()) K.drawImg(qIndex % 2 ? 'shi_wave' : 'gi_think', qIndex % 2 ? 1170 : 110, H - 6, 250, { bottom: true });
    }
  });

  // GLYPHS has single digits only: "10" is drawn from "1" and "0".
  var baseDraw = GLYPHS.draw;
  GLYPHS.draw = function (c, ch, cx, cy, h, col, lw) {
    if (ch === '10') {
      baseDraw(c, '1', cx - h * 0.32, cy, h, col, lw);
      baseDraw(c, '0', cx + h * 0.3, cy, h, col, lw);
      return;
    }
    baseDraw(c, ch, cx, cy, h, col, lw);
  };

  // ------------------------------------------------------------------ menu
  var tiles = K.grid(10, 5, 132, 150, 24, 30, { x: 40, y: 150, w: 800, h: 400 });
  var part2 = { x: 880, y: 175, w: 340, h: 330 };
  var pressed = -1;

  K.screen('menu', {
    down: function (p) {
      pressed = -1;
      for (var k = 0; k < 10; k++) if (K.inRect(p, tiles[k], 8)) pressed = k;
      if (K.inRect(p, part2, 8)) pressed = 10;
    },
    up: function (p, cancel) {
      var k = pressed;
      pressed = -1;
      if (cancel || k < 0) return;
      if (k === 10) { if (K.inRect(p, part2, 20)) { K.sfx.click(); startQuiz(); } return; }
      if (!K.inRect(p, tiles[k], 20)) return;
      K.sfx.click();
      startDigit(k);
    },
    render: function (c) {
      K.bg('#EAF8E6', '#C9EDBF');
      var sug = firstUntraced();
      for (var k = 0; k < 10; k++) {
        var r = tiles[k];
        K.tile(r.x, r.y, r.w, r.h, { done: !!traced[k], suggest: k === sug, pressed: k === pressed });
        GLYPHS.draw(c, String(k), r.x + r.w / 2, r.y + r.h / 2 + (k === pressed ? 4 : 0), 92, traced[k] ? CRAYONS[k] : '#2B4C7E');
      }
      var hint = part2Suggested();
      K.tile(part2.x, part2.y, part2.w, part2.h, { suggest: hint, pressed: pressed === 10, color: '#FFF7E0' });
      for (k = 0; k < 3; k++) ART.draw(c, 'apple', part2.x + 85 + k * 85, part2.y + 95, 78);
      for (k = 0; k < 3; k++) {
        var cx = part2.x + 70 + k * 100;
        K.rr(cx - 40, part2.y + 170, 80, 90, 18);
        c.fillStyle = k === 1 ? '#C8F7C5' : '#ffffff';
        c.fill();
        c.lineWidth = 3; c.strokeStyle = 'rgba(80,90,110,0.25)'; c.stroke();
        GLYPHS.draw(c, String(k + 2), cx, part2.y + 215, 56, k === 1 ? '#1E9E4F' : '#2B4C7E');
      }
      if (quizCorrect > 0) {
        K.drawStar(part2.x + 120, part2.y + 298, 20);
        K.text('× ' + quizCorrect, part2.x + 180, part2.y + 300, 32, '#7A4A00', { lw: 6 });
      }
    }
  });

  // ------------------------------------------------------------------ start + debug
  K.screen('start', K.startScreen({
    title: 'Tô số và đếm', top: '#EAF8E6', bottom: '#BDE8B0', titleColor: '#1E8E4A',
    left: 'gi_wave', right: 'shi_wave',
    deco: function (c, t) {
      for (var k = 1; k <= 5; k++) {
        GLYPHS.draw(c, String(k), 330 + (k - 1) * 155, 336 + Math.sin(t * 2 + k) * 8, 56, '#ffffff', 22);
        GLYPHS.draw(c, String(k), 330 + (k - 1) * 155, 336 + Math.sin(t * 2 + k) * 8, 56, CRAYONS[k]);
      }
    },
    onPlay: function () { K.go('menu'); }
  }));

  K.screen('debug', {
    render: function (c) {
      K.bg('#ffffff');
      var cells = K.grid(10, 5, 240, 340, 10, 10, { x: 0, y: 0, w: W, h: H });
      for (var k = 0; k < 10; k++) {
        var r = cells[k];
        c.strokeStyle = '#e3e3e3';
        c.lineWidth = 1;
        c.strokeRect(r.x, r.y, r.w, r.h);
        var st = T.compile(GLYPHS.digits[String(k)], 2);
        T.debugDraw(c, T.fit(st, 2.4, { x: r.x, y: r.y + 20, w: r.w, h: r.h - 20 }), { t: String(k), x: r.x + 16, y: r.y + 16 });
      }
    }
  });

  window.__kg.info = function () {
    var scr = __kg.screen();
    return {
      screen: scr, digit: digit, done: tr ? tr.done : false, cur: tr ? tr.cur : 0,
      strokes: tr ? tr.s.map(function (s) { return { pts: s.pts, dot: s.dot }; }) : [],
      things: things.map(function (t) { return { x: t.x, y: t.y, n: t.n }; }), counted: counted, countDone: countDone > 0,
      quiz: q ? { k: q.k, cards: q.cards, good: q.good, index: qIndex, cardX: CARD_X, cardY: CARD_Y } : null,
      quizCorrect: quizCorrect
    };
  };
  K.start(location.hash.indexOf('debug') >= 0 ? 'debug' : 'start');
})();
