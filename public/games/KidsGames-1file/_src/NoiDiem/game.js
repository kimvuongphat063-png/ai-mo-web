/*
 * Nối các điểm — drag (or tap) from 1 to 2 to 3 ... The next dot glows. When the last dot is
 * reached the outline closes, the picture appears in full color and starts to move.
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var SAVE_VERSION = 1;
  var CX = 670;
  var CY = 398;
  var HIT = 60;

  // ------------------------------------------------------------------ helpers
  function poly(c, pts) {
    c.beginPath();
    c.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  }
  function fillOut(c, col, lw) {
    c.fillStyle = col;
    c.fill();
    c.lineJoin = 'round';
    c.lineWidth = lw || 8;
    c.strokeStyle = 'rgba(60,40,40,0.75)';
    c.stroke();
  }
  function circ(c, x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = col; c.fill(); }
  function eye(c, x, y, r) { circ(c, x, y, r, '#2B2B3A'); circ(c, x + r * 0.3, y - r * 0.35, r * 0.35, '#ffffff'); }
  function smile(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0.2, Math.PI - 0.2); c.lineWidth = 6; c.strokeStyle = '#3A2A2A'; c.lineCap = 'round'; c.stroke(); }
  function pentagon(k, R, a0) { return [Math.cos(a0 + k * Math.PI * 2 / 5) * R, Math.sin(a0 + k * Math.PI * 2 / 5) * R]; }
  function heartPt(t) {
    var x = 16 * Math.pow(Math.sin(t), 3);
    var y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    return [x * 15.5, y * 15.5 - 30];
  }

  var FIGS = [
    { id: 'star', color: '#FFCD2E',
      dots: [pentagon(0, 255, -Math.PI / 2), pentagon(2, 255, -Math.PI / 2), pentagon(4, 255, -Math.PI / 2), pentagon(1, 255, -Math.PI / 2), pentagon(3, 255, -Math.PI / 2)],
      draw: function (c, t, a) {
        c.rotate(Math.sin(a * 2) * 0.12);
        var s = 1 + Math.sin(a * 5) * 0.04;
        c.scale(s, s);
        c.beginPath(); K.starPath(c, 0, 0, 255, 104, 5); fillOut(c, '#FFCD2E', 10);
        eye(c, -45, -10, 14); eye(c, 45, -10, 14); smile(c, 0, 20, 30);
        circ(c, -80, 30, 14, 'rgba(255,120,140,0.5)'); circ(c, 80, 30, 14, 'rgba(255,120,140,0.5)');
        for (var k = 0; k < 4; k++) {
          var aa = a * 1.5 + k * 1.6;
          c.save(); c.translate(Math.cos(aa) * 300, Math.sin(aa) * 260); c.rotate(aa);
          c.beginPath(); K.starPath(c, 0, 0, 22, 8, 4); c.fillStyle = '#FFE680'; c.fill(); c.restore();
        }
      } },
    { id: 'house', color: '#E2574C',
      dots: [[-70, -235], [70, -235], [215, -50], [215, 225], [-215, 225], [-215, -50]],
      draw: function (c, t, a) {
        var outline = [[-70, -235], [70, -235], [215, -50], [215, 225], [-215, 225], [-215, -50]];
        poly(c, outline); fillOut(c, '#FFE8B6');
        c.save(); poly(c, outline); c.clip();
        c.fillStyle = '#E2574C'; c.fillRect(-260, -260, 520, 210);
        c.restore();
        poly(c, outline); c.lineWidth = 8; c.strokeStyle = 'rgba(60,40,40,0.75)'; c.stroke();
        c.fillStyle = '#9C6644'; c.beginPath(); K.rrPath(c, -50, 80, 100, 145, 18); c.fill();
        circ(c, 30, 160, 7, '#FFD23F');
        var glow = 0.6 + Math.sin(a * 3) * 0.3;
        c.fillStyle = 'rgba(255,230,120,' + glow.toFixed(2) + ')';
        c.fillRect(-170, 20, 80, 70); c.fillRect(90, 20, 80, 70);
        c.lineWidth = 6; c.strokeStyle = '#7A5230'; c.strokeRect(-170, 20, 80, 70); c.strokeRect(90, 20, 80, 70);
        for (var k = 0; k < 3; k++) {
          var ph = (a * 0.6 + k / 3) % 1;
          circ(c, 120 + ph * 40, -250 - ph * 140, 18 + ph * 20, 'rgba(255,255,255,' + (0.8 * (1 - ph)).toFixed(2) + ')');
        }
      } },
    { id: 'fish', color: '#FF8C42',
      dots: [[250, 0], [90, -150], [-110, -110], [-280, -150], [-230, 0], [-280, 150], [-110, 110], [90, 150]],
      draw: function (c, t, a) {
        c.translate(Math.sin(a * 1.5) * 50, Math.sin(a * 3) * 12);
        var w = Math.sin(a * 8) * 0.12;
        c.save(); c.translate(-160, 0); c.rotate(w); c.translate(160, 0);
        poly(c, [[-150, -40], [-280, -150], [-230, 0], [-280, 150], [-150, 40]]); fillOut(c, '#FF8C42');
        c.restore();
        c.beginPath(); c.moveTo(250, 0); c.bezierCurveTo(180, -140, -60, -170, -150, -40);
        c.lineTo(-150, 40); c.bezierCurveTo(-60, 170, 180, 140, 250, 0); fillOut(c, '#FFA552');
        c.save(); c.clip();
        c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-40, -200, 30, 400); c.fillRect(40, -200, 22, 400);
        c.restore();
        eye(c, 150, -30, 18); smile(c, 185, 30, 22);
        for (var k = 0; k < 3; k++) {
          var ph = (a * 0.5 + k / 3) % 1;
          c.beginPath(); c.arc(300 + k * 20, -40 - ph * 260, 10 + k * 4, 0, Math.PI * 2);
          c.lineWidth = 4; c.strokeStyle = 'rgba(80,160,230,' + (1 - ph).toFixed(2) + ')'; c.stroke();
        }
      } },
    { id: 'boat', color: '#3D8BFD',
      dots: [[0, -250], [200, 40], [270, 70], [190, 200], [-190, 200], [-270, 70], [-160, 40], [-15, -150]],
      draw: function (c, t, a) {
        c.save();
        c.translate(0, Math.sin(a * 2.5) * 10);
        c.rotate(Math.sin(a * 2) * 0.06);
        c.beginPath(); c.moveTo(-6, 60); c.lineTo(-6, -255); c.lineWidth = 12; c.strokeStyle = '#7A5230'; c.stroke();
        poly(c, [[0, -250], [200, 40], [0, 40]]); fillOut(c, '#ffffff');
        poly(c, [[-15, -150], [-160, 40], [-15, 40]]); fillOut(c, '#FFD23F');
        poly(c, [[-270, 70], [270, 70], [190, 200], [-190, 200]]); fillOut(c, '#E2574C');
        c.fillStyle = '#ffffff'; c.fillRect(-220, 110, 440, 18);
        c.beginPath(); c.moveTo(0, -250); c.lineTo(60, -230); c.lineTo(0, -210); c.fillStyle = '#3D8BFD'; c.fill();
        c.restore();
        c.beginPath();
        for (var x = -340; x <= 340; x += 10) c.lineTo(x, 225 + Math.sin(x / 40 + a * 3) * 10);
        c.lineTo(340, 300); c.lineTo(-340, 300); c.closePath();
        c.fillStyle = 'rgba(77,182,255,0.75)'; c.fill();
      } },
    { id: 'butterfly', color: '#FF7AB6',
      dots: [[0, -100], [150, -235], [265, -120], [200, 10], [240, 165], [0, 110], [-240, 165], [-200, 10], [-265, -120], [-150, -235]],
      draw: function (c, t, a) {
        c.translate(Math.sin(a * 1.2) * 30, Math.sin(a * 2.4) * 18);
        var f = 0.55 + Math.abs(Math.cos(a * 6)) * 0.45;
        c.save(); c.scale(f, 1);
        poly(c, [[0, -100], [150, -235], [265, -120], [200, 10], [0, 0]]); fillOut(c, '#FF7AB6');
        poly(c, [[0, -100], [-150, -235], [-265, -120], [-200, 10], [0, 0]]); fillOut(c, '#FF7AB6');
        poly(c, [[0, 0], [200, 10], [240, 165], [0, 110]]); fillOut(c, '#B57BFF');
        poly(c, [[0, 0], [-200, 10], [-240, 165], [0, 110]]); fillOut(c, '#B57BFF');
        circ(c, 150, -110, 36, '#FFE066'); circ(c, -150, -110, 36, '#FFE066');
        circ(c, 140, 90, 24, '#ffffff'); circ(c, -140, 90, 24, '#ffffff');
        c.restore();
        c.beginPath(); c.ellipse(0, 10, 26, 120, 0, 0, Math.PI * 2); fillOut(c, '#5A3D6E');
        circ(c, 0, -120, 34, '#5A3D6E');
        eye(c, -12, -125, 8); eye(c, 12, -125, 8);
        c.beginPath(); c.moveTo(-10, -150); c.quadraticCurveTo(-40, -220, -70, -230); c.moveTo(10, -150); c.quadraticCurveTo(40, -220, 70, -230);
        c.lineWidth = 6; c.strokeStyle = '#5A3D6E'; c.stroke();
      } },
    { id: 'tree', color: '#2E9E4F',
      dots: [[0, -265], [150, -70], [80, -70], [230, 140], [40, 140], [40, 245], [-40, 245], [-40, 140], [-230, 140], [-80, -70], [-150, -70]],
      draw: function (c, t, a) {
        c.save(); c.rotate(Math.sin(a * 1.6) * 0.03);
        c.fillStyle = '#9C6644'; c.fillRect(-40, 120, 80, 125);
        c.strokeStyle = 'rgba(60,40,40,0.75)'; c.lineWidth = 8; c.strokeRect(-40, 120, 80, 125);
        poly(c, [[0, -60], [230, 140], [-230, 140]]); fillOut(c, '#2E9E4F');
        poly(c, [[0, -265], [150, -70], [-150, -70]]); fillOut(c, '#3CB55F');
        poly(c, [[0, -170], [190, 40], [-190, 40]]); fillOut(c, '#34A853');
        var cols = ['#FF5A5F', '#FFD23F', '#3D8BFD', '#FF7AB6', '#ffffff'];
        var balls = [[-60, -110], [50, -60], [-100, 0], [90, 20], [0, 60], [-150, 110], [140, 110], [-40, 110]];
        for (var k = 0; k < balls.length; k++) {
          var on = Math.sin(a * 4 + k * 1.3) > -0.2;
          circ(c, balls[k][0], balls[k][1], 15, on ? cols[k % cols.length] : 'rgba(255,255,255,0.4)');
        }
        c.beginPath(); K.starPath(c, 0, -268, 42, 18, 5); c.fillStyle = '#FFCD2E'; c.fill();
        c.restore();
      } },
    { id: 'cat', color: '#F7B267',
      dots: [[-120, -250], [-60, -170], [60, -170], [120, -250], [160, -120], [130, -40], [190, 120], [150, 230], [-150, 230], [-190, 120], [-130, -40], [-160, -120]],
      draw: function (c, t, a) {
        var tw = Math.sin(a * 4) * 0.35;
        c.save(); c.translate(150, 200); c.rotate(tw);
        c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(160, -20, 120, -170); c.lineWidth = 34; c.lineCap = 'round'; c.strokeStyle = '#E8954A'; c.stroke();
        c.restore();
        poly(c, [[-120, -250], [-60, -170], [60, -170], [120, -250], [160, -120], [130, -40], [190, 120], [150, 230], [-150, 230], [-190, 120], [-130, -40], [-160, -120]]);
        fillOut(c, '#F7B267');
        c.beginPath(); c.ellipse(0, 120, 100, 95, 0, 0, Math.PI * 2); c.fillStyle = '#FFE0B8'; c.fill();
        poly(c, [[-105, -225], [-70, -180], [-120, -170]]); c.fillStyle = '#FFB3C7'; c.fill();
        poly(c, [[105, -225], [70, -180], [120, -170]]); c.fillStyle = '#FFB3C7'; c.fill();
        var blink = (a % 3) > 2.85;
        if (blink) { c.beginPath(); c.moveTo(-75, -100); c.lineTo(-35, -100); c.moveTo(35, -100); c.lineTo(75, -100); c.lineWidth = 7; c.strokeStyle = '#2B2B3A'; c.stroke(); }
        else { eye(c, -55, -100, 16); eye(c, 55, -100, 16); }
        poly(c, [[-14, -62], [14, -62], [0, -48]]); c.fillStyle = '#E5687A'; c.fill();
        c.beginPath(); c.moveTo(-60, -50); c.lineTo(-150, -60); c.moveTo(-60, -38); c.lineTo(-150, -30); c.moveTo(60, -50); c.lineTo(150, -60); c.moveTo(60, -38); c.lineTo(150, -30);
        c.lineWidth = 4; c.strokeStyle = '#7A5230'; c.stroke();
      } },
    { id: 'car', color: '#FF5A5F',
      dots: [[-270, 20], [-240, -40], [-140, -50], [-90, -150], [80, -150], [150, -50], [250, -30], [280, 30], [270, 100], [90, 100], [-90, 100], [-270, 100]],
      draw: function (c, t, a) {
        c.translate(Math.sin(a * 1.2) * 40, -Math.abs(Math.sin(a * 10)) * 4);
        poly(c, [[-270, 20], [-240, -40], [-140, -50], [-90, -150], [80, -150], [150, -50], [250, -30], [280, 30], [270, 100], [-270, 100]]);
        fillOut(c, '#FF5A5F');
        poly(c, [[-120, -55], [-78, -132], [-10, -132], [-10, -55]]); c.fillStyle = '#BDE6FF'; c.fill();
        poly(c, [[10, -55], [10, -132], [70, -132], [125, -55]]); c.fillStyle = '#BDE6FF'; c.fill();
        circ(c, 255, 10, 16, '#FFE66D');
        c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(-250, 30, 500, 12);
        for (var k = -1; k <= 1; k += 2) {
          c.save(); c.translate(k * 150, 105); c.rotate(a * 8);
          circ(c, 0, 0, 58, '#33333F'); circ(c, 0, 0, 26, '#C9CDD6');
          c.fillStyle = '#33333F'; c.fillRect(-6, -26, 12, 52); c.fillRect(-26, -6, 52, 12);
          c.restore();
        }
      } },
    { id: 'plane', color: '#3D8BFD',
      dots: [[300, 20], [220, -40], [-200, -40], [-260, -170], [-310, -170], [-290, 40], [-60, 60], [-100, 200], [-30, 200], [90, 60], [220, 60], [290, 50]],
      draw: function (c, t, a) {
        c.translate(Math.sin(a) * 40, Math.sin(a * 2) * 20);
        c.rotate(Math.sin(a * 2) * 0.04);
        for (var k = 0; k < 3; k++) {
          var x = 360 - ((a * 200 + k * 260) % 780);
          K.cloud(x - 50, -220 + k * 170, 0.7, 'rgba(255,255,255,0.8)');
        }
        poly(c, [[-200, -40], [-260, -170], [-310, -170], [-290, 40]]); fillOut(c, '#FF5A5F');
        c.beginPath(); c.moveTo(300, 20); c.quadraticCurveTo(290, -40, 220, -40); c.lineTo(-200, -40); c.lineTo(-290, 40); c.lineTo(220, 60); c.quadraticCurveTo(290, 60, 300, 20);
        fillOut(c, '#ffffff');
        for (var w = 0; w < 6; w++) circ(c, -120 + w * 55, 0, 15, '#7CC6FF');
        poly(c, [[-60, 60], [-100, 200], [-30, 200], [90, 60]]); fillOut(c, '#3D8BFD');
        c.beginPath(); c.moveTo(225, -38); c.quadraticCurveTo(275, -30, 285, 5); c.lineTo(230, 5); c.closePath(); c.fillStyle = '#9ED8FF'; c.fill();
      } },
    { id: 'dino', color: '#7AC943',
      dots: [[230, -250], [310, -205], [275, -165], [190, -150], [170, 10], [175, 200], [95, 200], [75, 100], [-90, 100], [-95, 200], [-175, 200], [-200, 70], [-340, 140], [-170, -40], [130, -200]],
      draw: function (c, t, a) {
        var pts = [[230, -250], [310, -205], [275, -165], [190, -150], [170, 10], [175, 200], [95, 200], [75, 100], [-90, 100], [-95, 200], [-175, 200], [-200, 70], [-340, 140], [-170, -40], [130, -200]];
        c.translate(0, -Math.abs(Math.sin(a * 3)) * 10);
        c.save();
        c.translate(200, -170); c.rotate(Math.sin(a * 2) * 0.08); c.translate(-200, 170);
        poly(c, pts); fillOut(c, '#7AC943');
        c.restore();
        circ(c, -60, 20, 30, '#5FB236'); circ(c, 40, 40, 22, '#5FB236'); circ(c, -150, 50, 18, '#5FB236');
        eye(c, 250, -215, 12); smile(c, 285, -195, 14);
      } },
    { id: 'rocket', color: '#E2574C',
      dots: [[0, -280], [70, -170], [85, -40], [85, 110], [170, 200], [170, 250], [70, 200], [40, 250], [-40, 250], [-70, 200], [-170, 250], [-170, 200], [-85, 110], [-85, -40], [-70, -170]],
      draw: function (c, t, a) {
        var fly = a > 1.2 ? (a - 1.2) : 0;
        var y = -(fly * 260 % 1100);
        if (fly * 260 % 1100 > 700) y += 1100;
        c.translate(Math.sin(a * 30) * 3, y);
        var fl = 1 + Math.sin(a * 25) * 0.2;
        c.beginPath(); c.moveTo(-40, 250); c.quadraticCurveTo(0, 250 + 160 * fl, 40, 250); c.fillStyle = '#FF9F1C'; c.fill();
        c.beginPath(); c.moveTo(-22, 250); c.quadraticCurveTo(0, 250 + 90 * fl, 22, 250); c.fillStyle = '#FFE066'; c.fill();
        poly(c, [[85, 110], [170, 200], [170, 250], [70, 200]]); fillOut(c, '#E2574C');
        poly(c, [[-85, 110], [-170, 200], [-170, 250], [-70, 200]]); fillOut(c, '#E2574C');
        poly(c, [[0, -280], [70, -170], [85, -40], [85, 110], [70, 200], [40, 250], [-40, 250], [-70, 200], [-85, 110], [-85, -40], [-70, -170]]);
        fillOut(c, '#F1F3F8');
        poly(c, [[0, -280], [70, -170], [-70, -170]]); fillOut(c, '#E2574C');
        circ(c, 0, -60, 44, '#ffffff'); circ(c, 0, -60, 34, '#7CC6FF');
        c.fillStyle = '#3D8BFD'; c.fillRect(-85, 60, 170, 22);
      } },
    { id: 'heart', color: '#FF5A7A',
      dots: (function () { var d = []; for (var k = 0; k < 20; k++) d.push(heartPt(k / 20 * Math.PI * 2)); return d; })(),
      draw: function (c, t, a) {
        var s = 1 + Math.max(0, Math.sin(a * 6)) * 0.08;
        c.scale(s, s);
        c.beginPath();
        for (var k = 0; k <= 100; k++) { var p = heartPt(k / 100 * Math.PI * 2); if (k) c.lineTo(p[0], p[1]); else c.moveTo(p[0], p[1]); }
        c.closePath();
        fillOut(c, '#FF5A7A', 10);
        c.beginPath(); c.ellipse(-120, -110, 50, 30, -0.6, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,0.45)'; c.fill();
        for (var j = 0; j < 4; j++) {
          var ph = (a * 0.4 + j / 4) % 1;
          c.save(); c.translate(-300 + j * 200, 200 - ph * 520); c.globalAlpha = 1 - ph;
          c.beginPath(); K.heartPath(c, 0, 0, 60); c.fillStyle = '#FF9EBB'; c.fill(); c.restore();
        }
      } }
  ];

  // ------------------------------------------------------------------ save
  var done = [];
  for (var i = 0; i < FIGS.length; i++) done.push(0);
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved && saved.done) for (i = 0; i < FIGS.length; i++) done[i] = saved.done[i] ? 1 : 0;
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, done: done }); }
  KidsSDK.onSave(save);

  // ------------------------------------------------------------------ play
  var fi = 0;
  var fig = FIGS[0];
  var next = 0;           // index of the dot to reach next (0 = dot 1)
  var drag = null;        // {id, x, y}
  var closeT = 0;         // >0 while the outline closes / picture appears
  var reveal = 0;
  var pulse = [];
  var labelPos = [];

  function S(p) { return { x: CX + p[0], y: CY + p[1] }; }
  function startFig(k) {
    fi = (k + FIGS.length) % FIGS.length;
    fig = FIGS[fi];
    next = 0;
    drag = null;
    closeT = 0;
    reveal = 0;
    pulse = fig.dots.map(function () { return 0; });
    // number labels sit outside the outline, away from the lines
    var n = fig.dots.length;
    labelPos = fig.dots.map(function (p, k) {
      var a = fig.dots[(k + n - 1) % n];
      var b = fig.dots[(k + 1) % n];
      var dx = (p[0] - a[0]) / (K.dist(p[0], p[1], a[0], a[1]) || 1) + (p[0] - b[0]) / (K.dist(p[0], p[1], b[0], b[1]) || 1);
      var dy = (p[1] - a[1]) / (K.dist(p[0], p[1], a[0], a[1]) || 1) + (p[1] - b[1]) / (K.dist(p[0], p[1], b[0], b[1]) || 1);
      var l = Math.sqrt(dx * dx + dy * dy);
      if (l < 0.3) { dx = p[0]; dy = p[1]; l = Math.sqrt(dx * dx + dy * dy) || 1; }
      return { x: CX + p[0] + dx / l * 40, y: CY + p[1] + dy / l * 40 };
    });
    K.go('play');
  }

  function reach(k) {
    pulse[k] = 1;
    next = k + 1;
    K.sfx.note(K.SCALE[Math.min(K.SCALE.length - 1, k % 15)], { vol: 0.16, len: 0.6 });
    if (next >= fig.dots.length) {
      closeT = 0.001;
      drag = null;
    }
  }
  function tryReach(x, y) {
    while (next < fig.dots.length) {
      var p = S(fig.dots[next]);
      if (K.dist(x, y, p.x, p.y) <= HIT) reach(next);
      else break;
    }
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });

  K.screen('play', {
    buttons: [menuBtn],
    down: function (p) {
      if (closeT > 0 || drag) return;
      // a finger can start anywhere: passing over the glowing dot connects it
      tryReach(p.x, p.y);
      if (closeT === 0) drag = { id: p.id, x: p.x, y: p.y };
    },
    move: function (p) {
      if (!drag || p.id !== drag.id) return;
      var n = Math.max(1, Math.ceil(K.dist(drag.x, drag.y, p.x, p.y) / 20));
      for (var k = 1; k <= n && closeT === 0; k++) tryReach(drag.x + (p.x - drag.x) * k / n, drag.y + (p.y - drag.y) * k / n);
      if (drag) { drag.x = p.x; drag.y = p.y; }
    },
    up: function (p, cancel) {
      if (!drag || p.id !== drag.id) return;
      if (!cancel) this.move(p);
      drag = null;
    },
    pause: function () { drag = null; save(); },
    update: function (dt) {
      for (var k = 0; k < pulse.length; k++) pulse[k] = Math.max(0, pulse[k] - dt * 2.5);
      if (closeT > 0) {
        var was = closeT;
        closeT += dt;
        if (was < 0.45 && closeT >= 0.45) {
          done[fi] = 1;
          save();
          K.sfx.sparkle();
          K.fx.burst(CX, CY, 34, { kind: 'star' });
          K.cheer('shi_clap', 'right', 2.6, 280);
        }
        if (closeT >= 0.45) reveal += dt;
        if (closeT > 3.2 && !K.isDone()) {
          K.showDone({
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startFig(fi); },
            onNext: function () { startFig(fi + 1); },
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      K.bg('#F3ECFF', '#E0D2FF');
      var n = fig.dots.length;
      var k;
      var ra = K.clamp(reveal / 0.7, 0, 1);
      if (ra > 0) {
        c.save();
        c.globalAlpha = ra;
        c.translate(CX, CY);
        fig.draw(c, K.time, reveal);
        c.restore();
      }
      c.save();
      c.globalAlpha = 1 - ra;
      c.lineCap = 'round';
      c.lineJoin = 'round';
      // connected lines
      if (next > 1) {
        c.beginPath();
        var p0 = S(fig.dots[0]);
        c.moveTo(p0.x, p0.y);
        for (k = 1; k < next; k++) { var pk = S(fig.dots[k]); c.lineTo(pk.x, pk.y); }
        if (closeT > 0) {
          var last = S(fig.dots[n - 1]);
          var f = K.clamp(closeT / 0.4, 0, 1);
          c.lineTo(K.lerp(last.x, p0.x, f), K.lerp(last.y, p0.y, f));
        }
        c.lineWidth = 12;
        c.strokeStyle = fig.color;
        c.stroke();
      }
      // rubber band from the last dot to the finger
      if (drag && next > 0) {
        var lp = S(fig.dots[next - 1]);
        c.beginPath(); c.moveTo(lp.x, lp.y); c.lineTo(drag.x, drag.y);
        c.setLineDash([4, 18]); c.lineWidth = 10; c.strokeStyle = 'rgba(80,70,140,0.5)'; c.stroke(); c.setLineDash([]);
      }
      // dots + numbers
      for (k = 0; k < n; k++) {
        var p = S(fig.dots[k]);
        var isNext = k === next && closeT === 0;
        if (isNext) {
          var g = 0.35 + 0.25 * Math.sin(K.time * 4);
          K.circle(p.x, p.y, 38 + Math.sin(K.time * 4) * 4, 'rgba(255,205,46,' + g.toFixed(2) + ')');
        }
        var r = (k < next ? 15 : 17) * (1 + pulse[k] * 0.6);
        K.circle(p.x, p.y, r, k < next ? fig.color : (isNext ? '#24A35A' : '#6B5CA5'), '#ffffff', 4);
        var lbl = labelPos[k];
        K.text(String(k + 1), lbl.x, lbl.y, isNext ? 40 : 32, k < next ? '#9A8CC9' : (isNext ? '#1E8E4A' : '#4A3D80'), { lw: 7 });
      }
      c.restore();
      if (!K.isDone()) K.drawImg(closeT > 0 ? 'gi_cheer' : 'gi_point', 140, H - 6, 270, { bottom: true });
      // hint: hand slides from the last reached dot to the next one
      if (closeT === 0 && !drag && K.idle() > 4.5) {
        var to = S(fig.dots[next]);
        var from = next > 0 ? S(fig.dots[next - 1]) : { x: to.x + 120, y: to.y + 120 };
        var cyc = (K.idle() - 4.5) % 2;
        var ph = K.easeInOut(K.clamp((cyc - 0.3) / 1.1, 0, 1));
        K.drawHand(K.lerp(from.x, to.x, ph), K.lerp(from.y, to.y, ph), cyc < 1.6 ? 1 : 0, K.clamp((K.idle() - 4.5) / 0.3, 0, 1));
      }
    }
  });

  // ------------------------------------------------------------------ menu
  var tiles = K.grid(FIGS.length, 4, 236, 162, 34, 30, { x: 0, y: 30, w: W, h: H - 30 });
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
      startFig(k);
    },
    render: function (c) {
      K.bg('#F3ECFF', '#DCCBFF');
      var sug = -1;
      for (var k = 0; k < FIGS.length; k++) if (!done[k]) { sug = k; break; }
      for (k = 0; k < tiles.length; k++) {
        var r = tiles[k];
        var f = FIGS[k];
        K.tile(r.x, r.y, r.w, r.h, { done: !!done[k], suggest: k === sug, pressed: k === pressed });
        c.save();
        c.translate(r.x + r.w / 2 + 20, r.y + r.h / 2 + (k === pressed ? 4 : 0));
        c.scale(0.22, 0.22);
        if (done[k]) {
          c.save();
          f.draw(c, 0, 0.4);
          c.restore();
        } else {
          for (var d = 0; d < f.dots.length; d++) {
            c.beginPath(); c.arc(f.dots[d][0], f.dots[d][1], 26, 0, Math.PI * 2);
            c.fillStyle = '#6B5CA5'; c.fill();
          }
        }
        c.restore();
        K.text(String(f.dots.length), r.x + 40, r.y + 40, 34, '#6B5CA5', { lw: 6 });
      }
    }
  });

  K.screen('start', K.startScreen({
    title: 'Nối các điểm', top: '#F3ECFF', bottom: '#D9C6FF', titleColor: '#6B4FD8', left: 'gi_point', right: 'shi_wave',
    deco: function (c, t) {
      var pts = [[460, 380], [560, 320], [660, 380], [760, 320], [860, 380]];
      c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < 4; k++) c.lineTo(pts[k][0], pts[k][1]);
      c.lineWidth = 10; c.strokeStyle = '#B79BFF'; c.lineCap = 'round'; c.stroke();
      for (k = 0; k < pts.length; k++) {
        K.circle(pts[k][0], pts[k][1], 16, k < 4 ? '#B79BFF' : '#24A35A', '#ffffff', 4);
        K.text(String(k + 1), pts[k][0], pts[k][1] - 42, 32, '#4A3D80', { lw: 6 });
      }
    },
    onPlay: function () { K.go('menu'); }
  }));

  window.__kg.info = function () {
    return { fi: fi, id: fig.id, next: next, n: fig.dots.length, closing: closeT > 0, done: done.slice(),
      dots: fig.dots.map(function (p) { return [CX + p[0], CY + p[1]]; }), counts: FIGS.map(function (f) { return f.dots.length; }) };
  };
  K.start('start');
})();
