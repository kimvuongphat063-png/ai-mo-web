/*
 * Tìm bóng — drag each colored thing (bottom row) onto its dark shadow (top row).
 * Right shadow: it snaps in and fills with color ("tách"). Wrong place: the thing slides home.
 * 4 themes x 4 levels (2, 3, 4, 5 things); bigger levels mix look-alike shadows (cat/dog...).
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var THEMES = [
    { id: 'animals', items: ['cat', 'dog', 'rabbit', 'fish', 'bird', 'turtle', 'elephant', 'pig'], pair: ['cat', 'dog'], bg: ['#FFF0E0', '#FFDDB8'] },
    { id: 'fruits', items: ['apple', 'orange', 'banana', 'grapes', 'watermelon', 'strawberry', 'pear', 'cherry'], pair: ['apple', 'orange'], bg: ['#FFF6E0', '#FFE7A8'] },
    { id: 'vehicles', items: ['car', 'bus', 'plane', 'boat', 'train', 'rocket', 'helicopter', 'bike'], pair: ['car', 'bus'], bg: ['#E8F4FF', '#C8E4FF'] },
    { id: 'toys', items: ['ball', 'balloon', 'teddy', 'kite', 'drum', 'top', 'blocks', 'duck'], pair: ['ball', 'balloon'], bg: ['#FBEAFF', '#EDD1FF'] }
  ];
  var LEVELS = [2, 3, 4, 5];
  var SLOT_Y = 250;
  var HOME_Y = 560;
  var SIZE = 150;

  // ------------------------------------------------------------------ save
  var done = {};
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved && saved.done) done = saved.done;
  function key(t, l) { return t + '-' + l; }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, done: done }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ play
  var ti = 0;
  var li = 0;
  var slots = [];   // {name, x, y, filled, flash}
  var things = [];  // {name, hx, hy, x, y, placed, back}
  var drag = null;  // {k, id, dx, dy}
  var finish = 0;

  function xs(n) {
    var sp = Math.min(230, 900 / n);
    var out = [];
    for (var k = 0; k < n; k++) out.push(700 + (k - (n - 1) / 2) * sp);
    return out;
  }

  function startLevel(t, l) {
    ti = t;
    li = l;
    var th = THEMES[ti];
    var n = LEVELS[li];
    var pool = th.items.slice();
    var pick = [];
    if (n >= 4) {
      pick = th.pair.slice();
      pool = pool.filter(function (x) { return th.pair.indexOf(x) < 0; });
    }
    K.shuffle(pool);
    while (pick.length < n) pick.push(pool.shift());
    var sx = xs(n);
    var order = K.shuffle(pick.slice());
    slots = order.map(function (name, k) { return { name: name, x: sx[k], y: SLOT_Y, filled: false, flash: 0 }; });
    var homes = K.shuffle(pick.slice());
    // never leave every thing straight under its own shadow
    var same = homes.every(function (name, k) { return name === order[k]; });
    if (same && n > 1) homes.reverse();
    things = homes.map(function (name, k) { return { name: name, hx: sx[k], hy: HOME_Y, x: sx[k], y: HOME_Y, placed: false, back: 0, wob: 0 }; });
    drag = null;
    finish = 0;
    K.go('play');
  }
  function nextLevel() {
    var l = li + 1;
    var t = ti;
    if (l >= LEVELS.length) { l = 0; t = (t + 1) % THEMES.length; }
    startLevel(t, l);
  }

  function release(cancel) {
    if (!drag) return;
    var th = things[drag.k];
    drag = null;
    if (cancel) { th.back = 1; return; }
    var best = null;
    var bd = 110;
    for (var k = 0; k < slots.length; k++) {
      if (slots[k].filled) continue;
      var d = K.dist(th.x, th.y, slots[k].x, slots[k].y);
      if (d < bd) { bd = d; best = slots[k]; }
    }
    if (best && best.name === th.name) {
      th.placed = true;
      th.x = best.x;
      th.y = best.y;
      best.filled = true;
      best.flash = 1;
      K.sfx.snap();
      K.fx.burst(best.x, best.y, 12, { kind: 'spark', min: 80, max: 220 });
      var left = slots.filter(function (s) { return !s.filled; }).length;
      if (left === 0) {
        finish = 0.001;
        done[key(ti, li)] = 1;
        save();
        K.sfx.sparkle();
        K.cheer('shi_clap', 'right', 2.0, 260);
      }
    } else {
      if (best) { K.sfx.wrong(); th.wob = 1; }
      th.back = 1;
    }
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });

  K.screen('play', {
    buttons: [menuBtn],
    down: function (p) {
      if (drag || finish) return;
      for (var k = things.length - 1; k >= 0; k--) {
        var t = things[k];
        if (t.placed) continue;
        if (K.dist(p.x, p.y, t.x, t.y) < 88) {
          drag = { k: k, id: p.id, dx: t.x - p.x, dy: t.y - p.y };
          t.back = 0;
          things.push(things.splice(k, 1)[0]);
          drag.k = things.length - 1;
          K.sfx.click();
          return;
        }
      }
    },
    move: function (p) {
      if (!drag || p.id !== drag.id) return;
      var t = things[drag.k];
      t.x = K.clamp(p.x + drag.dx, 60, W - 60);
      t.y = K.clamp(p.y + drag.dy, 60, H - 60);
    },
    up: function (p, cancel) {
      if (!drag || p.id !== drag.id) return;
      if (!cancel) this.move(p);
      release(cancel);
    },
    pause: function () { release(true); save(); },
    update: function (dt) {
      for (var k = 0; k < things.length; k++) {
        var t = things[k];
        t.wob = Math.max(0, t.wob - dt * 2.5);
        if (t.back > 0) {
          t.x += (t.hx - t.x) * Math.min(1, dt * 9);
          t.y += (t.hy - t.y) * Math.min(1, dt * 9);
          if (K.dist(t.x, t.y, t.hx, t.hy) < 1) { t.x = t.hx; t.y = t.hy; t.back = 0; }
        }
      }
      for (k = 0; k < slots.length; k++) slots[k].flash = Math.max(0, slots[k].flash - dt * 2);
      if (finish > 0) {
        finish += dt;
        if (finish > 1.8 && !K.isDone()) {
          K.showDone({
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startLevel(ti, li); },
            onNext: nextLevel,
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      var th = THEMES[ti];
      K.bg(th.bg[0], th.bg[1]);
      K.rr(160, SLOT_Y - 125, 1080, 250, 40);
      c.fillStyle = 'rgba(255,255,255,0.55)';
      c.fill();
      K.dots(LEVELS.length, li + (finish ? 1 : 0), 700, 40, 10, '#F29E38', li);
      var k;
      for (k = 0; k < slots.length; k++) {
        var s = slots[k];
        if (s.filled) {
          var b = 1 + Math.sin(s.flash * Math.PI) * 0.18;
          ART.draw(c, s.name, s.x, s.y, SIZE * b, { t: K.time });
        } else {
          var sil = ART.silhouette(s.name, 160);
          var hint = drag && things[drag.k].name === s.name && K.dist(things[drag.k].x, things[drag.k].y, s.x, s.y) < 110;
          if (hint) K.circle(s.x, s.y, 92, 'rgba(255,255,255,0.8)');
          c.drawImage(sil, s.x - 80, s.y - 80, 160, 160);
        }
      }
      for (k = 0; k < things.length; k++) {
        var t = things[k];
        if (t.placed) continue;
        var dragging = drag && drag.k === k;
        if (!dragging) {
          c.beginPath();
          c.ellipse(t.hx, t.hy + 70, 58, 14, 0, 0, Math.PI * 2);
          c.fillStyle = 'rgba(80,60,40,0.12)';
          c.fill();
        }
        var sc = dragging ? 1.12 : 1;
        ART.draw(c, t.name, t.x + Math.sin(t.wob * 25) * 10 * t.wob, t.y, SIZE * sc, { t: K.time });
      }
      if (!K.isDone()) K.drawImg(finish ? 'gi_cheer' : 'gi_think', 92, H - 4, 250, { bottom: true });
      // hint: a hand carries the first loose thing to its shadow
      if (!finish && !drag && K.idle() > 5) {
        var tt = null;
        for (k = 0; k < things.length; k++) if (!things[k].placed) { tt = things[k]; break; }
        var sl = null;
        for (k = 0; tt && k < slots.length; k++) if (slots[k].name === tt.name) sl = slots[k];
        if (tt && sl) {
          var cyc = (K.idle() - 5) % 2.4;
          var ph = K.easeInOut(K.clamp((cyc - 0.4) / 1.4, 0, 1));
          var hx = K.lerp(tt.hx, sl.x, ph);
          var hy = K.lerp(tt.hy, sl.y, ph);
          c.save();
          c.globalAlpha = 0.45;
          if (ph > 0) ART.draw(c, tt.name, hx, hy, SIZE * 0.8);
          c.restore();
          K.drawHand(hx + 10, hy + 20, cyc < 2.0 ? 1 : 0, K.clamp((K.idle() - 5) / 0.3, 0, 1));
        }
      }
    }
  });

  // ------------------------------------------------------------------ menu
  function tileRect(t, l) { return { x: 260 + l * 236, y: 92 + t * 138, w: 200, h: 116 }; }
  var pressed = null;
  K.screen('menu', {
    down: function (p) {
      pressed = null;
      for (var t = 0; t < THEMES.length; t++) for (var l = 0; l < LEVELS.length; l++) if (K.inRect(p, tileRect(t, l), 10)) pressed = [t, l];
    },
    up: function (p, cancel) {
      var pr = pressed;
      pressed = null;
      if (cancel || !pr || !K.inRect(p, tileRect(pr[0], pr[1]), 20)) return;
      K.sfx.click();
      startLevel(pr[0], pr[1]);
    },
    render: function (c) {
      K.bg('#FFF0E0', '#FFDCB5');
      var sug = null;
      for (var t = 0; t < THEMES.length && !sug; t++) for (var l = 0; l < LEVELS.length; l++) if (!done[key(t, l)]) { sug = key(t, l); break; }
      for (t = 0; t < THEMES.length; t++) {
        var r0 = tileRect(t, 0);
        K.circle(150, r0.y + r0.h / 2, 58, '#ffffff');
        ART.draw(c, THEMES[t].items[0], 150, r0.y + r0.h / 2, 92);
        for (l = 0; l < LEVELS.length; l++) {
          var r = tileRect(t, l);
          var isP = pressed && pressed[0] === t && pressed[1] === l;
          K.tile(r.x, r.y, r.w, r.h, { done: !!done[key(t, l)], suggest: key(t, l) === sug, pressed: isP });
          var n = LEVELS[l];
          for (var k = 0; k < n; k++) {
            var sil = ART.silhouette(THEMES[t].items[(k + l) % THEMES[t].items.length], 48);
            c.drawImage(sil, r.x + r.w / 2 - n * 18 + k * 36 - 18, r.y + r.h / 2 - 24 + (isP ? 4 : 0) + (k % 2) * 6, 40, 40);
          }
        }
      }
    }
  });

  K.screen('start', K.startScreen({
    title: 'Tìm bóng', top: '#FFF0E0', bottom: '#FFD3A6', titleColor: '#E2574C', left: 'gi_think', right: 'shi_wave',
    deco: function (c, t) {
      c.drawImage(ART.silhouette('cat', 120), 370, 282, 120, 120);
      ART.draw(c, 'cat', 910, 340 + Math.sin(t * 2) * 6, 116, { t: t });
      c.beginPath(); c.moveTo(830, 330); c.lineTo(520, 330); c.lineWidth = 10; c.lineCap = 'round'; c.strokeStyle = '#F29E38'; c.stroke();
      c.beginPath(); c.moveTo(546, 306); c.lineTo(516, 330); c.lineTo(546, 354); c.stroke();
    },
    onPlay: function () { K.go('menu'); }
  }));

  window.__kg.info = function () {
    return { ti: ti, li: li, finish: finish > 0,
      slots: slots.map(function (s) { return { name: s.name, x: s.x, y: s.y, filled: s.filled }; }),
      things: things.map(function (t) { return { name: t.name, x: t.x, y: t.y, placed: t.placed }; }) };
  };
  K.start('start');
})();
