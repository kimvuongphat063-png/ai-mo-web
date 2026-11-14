/*
 * Tô nét — drag a finger along the dotted road; a little friend follows the finger to its goal.
 * 12 levels: horizontal, vertical, diagonal, zigzag, wave, arc, circle, spiral, loops, square,
 * triangle, small maze (dead ends send the friend back by itself — never a penalty).
 */
(function () {
  'use strict';

  var W = K.W;
  var H = K.H;
  var STEP = 8;          // point spacing along a road (px)
  var ROAD = 66;         // road width (px)
  var TOL = 54;          // tracking tolerance (px, >= 30)
  var SAVE_VERSION = 1;
  var CRAYONS = ['#FF6B4A', '#FF9F1C', '#2EB872', '#3D8BFD', '#9B5DE5', '#FF5DA2'];

  // ------------------------------------------------------------------ road shapes
  function wave() {
    var s = 'M200 380';
    for (var x = 210; x <= 1040; x += 10) s += ' L' + x + ' ' + (380 - 105 * Math.sin((x - 200) / 420 * Math.PI * 2)).toFixed(1);
    return s;
  }
  function spiral() {
    var s = '';
    var turns = 2.25;
    for (var k = 0; k <= 360; k++) {
      var f = k / 360;
      var a = -f * turns * Math.PI * 2;
      var r = 262 - f * 212;
      s += (k ? ' L' : 'M') + (640 + r * Math.cos(a)).toFixed(1) + ' ' + (392 + r * Math.sin(a)).toFixed(1);
    }
    return s;
  }
  function loops() {
    var s = '';
    var a = 30;
    var b = 92;
    for (var k = 0; k <= 480; k++) {
      var t = k / 480 * Math.PI * 8;
      s += (k ? ' L' : 'M') + (250 + a * t + b * Math.sin(t)).toFixed(1) + ' ' + (395 + b * Math.cos(t)).toFixed(1);
    }
    return s;
  }

  var LEVELS = [
    { obj: 'bee', goal: 'flower', bg: 'meadow', path: 'M230 400 L1030 400' },
    { obj: 'ball', goal: 'basket', bg: 'room', path: 'M640 195 L640 555' },
    { obj: 'car', goal: 'house', bg: 'hill', path: 'M290 200 L960 540' },
    { obj: 'bird', goal: 'nest', bg: 'sky', path: 'M200 480 L350 270 L500 480 L650 270 L800 480 L950 270' },
    { obj: 'fish', goal: 'seaweed', bg: 'water', path: wave() },
    { obj: 'plane', goal: 'cloud', bg: 'sky', path: 'E640 600 400 400 180 360' },
    { obj: 'caterpillar', goal: 'apple', bg: 'meadow', path: 'E640 392 228 228 -90 -420' },
    { obj: 'snail', goal: 'leaf', bg: 'garden', path: spiral() },
    { obj: 'butterfly', goal: 'tulip', bg: 'meadow', path: loops() },
    { obj: 'train', goal: 'station', bg: 'hill', path: 'M450 170 L830 170 L830 560 L450 560 L450 170' },
    { obj: 'mouse', goal: 'cheese', bg: 'room', path: 'M640 165 L395 565 L885 565 L640 165' },
    { obj: 'rabbit', goal: 'carrot', bg: 'garden', maze: {
      main: 'M190 575 L430 575 L430 315 L700 315 L700 545 L960 545 L960 205 L1090 205',
      branches: ['M430 450 L250 450 L250 300', 'M700 315 L700 170 L870 170', 'M960 545 L1120 545 L1120 400']
    } }
  ];

  // ------------------------------------------------------------------ save
  var doneLv = [];
  for (var i = 0; i < LEVELS.length; i++) doneLv.push(0);
  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved && saved.done && saved.done.length) {
    for (i = 0; i < LEVELS.length; i++) doneLv[i] = saved.done[i] ? 1 : 0;
  }
  function save() { KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, done: doneLv }); }
  KidsSDK.onSave(save);
  function suggested() {
    for (var k = 0; k < doneLv.length; k++) if (!doneLv[k]) return k;
    return -1;
  }

  // ------------------------------------------------------------------ drawing: friends + goals
  function ell(c, x, y, rx, ry, fill, rot) {
    c.beginPath();
    c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }
  function circ(c, x, y, r, fill) {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
  }
  function eye(c, x, y, r) {
    circ(c, x, y, r, '#ffffff');
    circ(c, x + r * 0.25, y, r * 0.6, '#2B2B3A');
    circ(c, x + r * 0.45, y - r * 0.3, r * 0.22, '#ffffff');
  }
  function outline(c, w) {
    c.lineWidth = w || 4;
    c.strokeStyle = 'rgba(60,40,30,0.55)';
    c.stroke();
  }

  /** Each friend faces +x, centered on (0,0), about 90 px wide. t = time, d = distance travelled. */
  var FRIENDS = {
    bee: function (c, t) {
      var f = Math.sin(t * 40) * 0.5 + 0.5;
      c.globalAlpha = 0.75;
      ell(c, -6, -26, 16, 22 * (0.5 + f * 0.5), '#D6F0FF', -0.4);
      ell(c, 8, -24, 14, 19 * (0.5 + f * 0.5), '#C2E7FF', 0.3);
      c.globalAlpha = 1;
      c.beginPath(); c.moveTo(-36, 0); c.lineTo(-48, 4); c.lineTo(-36, 8); c.fillStyle = '#3A3A3A'; c.fill();
      c.save();
      c.beginPath(); c.ellipse(0, 4, 36, 26, 0, 0, Math.PI * 2);
      c.fillStyle = '#FFD23F'; c.fill(); outline(c);
      c.clip();
      c.fillStyle = '#3A3A3A';
      c.fillRect(-18, -30, 10, 70); c.fillRect(2, -30, 10, 70);
      c.restore();
      circ(c, 30, 0, 18, '#FFD23F');
      eye(c, 34, -4, 7);
      c.beginPath(); c.arc(36, 6, 6, 0.2, Math.PI - 0.2); c.lineWidth = 3; c.strokeStyle = '#3A3A3A'; c.stroke();
    },
    ball: function (c, t, d) {
      c.save();
      c.rotate(d / 34);
      var cols = ['#FF5A5F', '#ffffff', '#3D8BFD', '#ffffff', '#FFC93C', '#ffffff'];
      for (var k = 0; k < 6; k++) {
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 34, k * Math.PI / 3, (k + 1) * Math.PI / 3); c.closePath();
        c.fillStyle = cols[k]; c.fill();
      }
      c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); outline(c);
      circ(c, 0, 0, 7, '#ffffff');
      c.restore();
      ell(c, -10, -14, 10, 6, 'rgba(255,255,255,0.6)', -0.6);
    },
    car: function (c, t, d) {
      c.beginPath(); K.rrPath(c, -48, -30, 96, 36, 14); c.fillStyle = '#FF5A5F'; c.fill(); outline(c);
      c.beginPath(); K.rrPath(c, -26, -56, 52, 30, 12); c.fillStyle = '#FF5A5F'; c.fill(); outline(c);
      c.beginPath(); K.rrPath(c, -20, -50, 18, 20, 5); c.fillStyle = '#BDE6FF'; c.fill();
      c.beginPath(); K.rrPath(c, 3, -50, 18, 20, 5); c.fillStyle = '#BDE6FF'; c.fill();
      circ(c, 44, -16, 6, '#FFE66D');
      for (var k = -1; k <= 1; k += 2) {
        c.save(); c.translate(k * 26, 8); c.rotate(d / 16);
        circ(c, 0, 0, 15, '#33333F'); circ(c, 0, 0, 7, '#C9CDD6');
        c.fillStyle = '#33333F'; c.fillRect(-2, -7, 4, 14);
        c.restore();
      }
    },
    bird: function (c, t) {
      var f = Math.sin(t * 16);
      c.beginPath(); c.moveTo(-26, -4); c.lineTo(-48, -16); c.lineTo(-44, 6); c.closePath(); c.fillStyle = '#2F80ED'; c.fill();
      circ(c, 0, 0, 30, '#4EA8FF');
      ell(c, 6, 10, 18, 13, '#CDEBFF');
      c.beginPath(); c.moveTo(26, -6); c.lineTo(44, 0); c.lineTo(26, 6); c.closePath(); c.fillStyle = '#FFA62B'; c.fill();
      eye(c, 14, -10, 7);
      ell(c, -8, -4 - f * 8, 18, 10 + f * 6, '#2F80ED', -0.3);
    },
    fish: function (c, t) {
      var w = Math.sin(t * 10) * 0.35;
      c.save(); c.translate(-30, 0); c.rotate(w);
      c.beginPath(); c.moveTo(4, 0); c.lineTo(-26, -24); c.lineTo(-26, 24); c.closePath(); c.fillStyle = '#FF8C42'; c.fill();
      c.restore();
      ell(c, 2, 0, 40, 26, '#FFA552');
      c.beginPath(); c.ellipse(2, 0, 40, 26, 0, 0, Math.PI * 2); outline(c, 3);
      c.fillStyle = '#ffffff';
      c.fillRect(-10, -24, 8, 48);
      eye(c, 24, -6, 7);
      ell(c, 0, 14, 12, 6, '#FF8C42', 0.4);
    },
    plane: function (c) {
      c.beginPath(); c.moveTo(-10, -4); c.lineTo(-30, -40); c.lineTo(-14, -40); c.lineTo(14, -4); c.closePath(); c.fillStyle = '#3D8BFD'; c.fill();
      c.beginPath(); c.moveTo(-50, -4); c.lineTo(-58, -30); c.lineTo(-44, -30); c.lineTo(-34, -6); c.closePath(); c.fillStyle = '#FF5A5F'; c.fill();
      c.beginPath(); K.rrPath(c, -56, -14, 112, 28, 14); c.fillStyle = '#ffffff'; c.fill(); outline(c);
      for (var k = 0; k < 4; k++) circ(c, -26 + k * 16, -2, 5, '#7CC6FF');
      c.beginPath(); c.moveTo(-6, 4); c.lineTo(-24, 34); c.lineTo(-10, 34); c.lineTo(16, 4); c.closePath(); c.fillStyle = '#2F80ED'; c.fill();
      ell(c, 58, 0, 5, 20 * Math.abs(Math.sin(K.time * 30)) + 3, '#7D7D8C');
    },
    caterpillar: function (c, t) {
      for (var k = 4; k >= 1; k--) {
        var y = Math.sin(t * 8 - k * 0.9) * 6;
        circ(c, -k * 20, y, 17, k % 2 ? '#7AC943' : '#5FB236');
      }
      circ(c, 6, -4, 22, '#8BD450');
      c.beginPath(); c.moveTo(0, -24); c.lineTo(-6, -40); c.moveTo(14, -22); c.lineTo(18, -40);
      c.lineWidth = 3; c.strokeStyle = '#3A3A3A'; c.stroke();
      circ(c, -6, -40, 4, '#FF5DA2'); circ(c, 18, -40, 4, '#FF5DA2');
      eye(c, 12, -8, 6);
      c.beginPath(); c.arc(12, 4, 6, 0.2, Math.PI - 0.2); c.lineWidth = 3; c.strokeStyle = '#3A3A3A'; c.stroke();
    },
    snail: function (c, t) {
      var s = 1 + Math.sin(t * 6) * 0.04;
      c.beginPath(); c.moveTo(-40, 18); c.lineTo(36, 18); c.quadraticCurveTo(48, 18, 46, 4); c.lineTo(-30, 8); c.closePath();
      c.fillStyle = '#FFD8A8'; c.fill();
      c.beginPath(); c.moveTo(34, 4); c.lineTo(38, -26); c.moveTo(42, 4); c.lineTo(50, -22);
      c.lineWidth = 4; c.strokeStyle = '#E8B07A'; c.stroke();
      circ(c, 38, -28, 5, '#3A3A3A'); circ(c, 50, -24, 5, '#3A3A3A');
      c.save(); c.scale(s, s);
      circ(c, -6, -8, 28, '#C77D3A');
      c.beginPath();
      for (var k = 0; k <= 40; k++) {
        var a = k / 40 * Math.PI * 4;
        var r = 24 - k * 0.55;
        if (k) c.lineTo(-6 + r * Math.cos(a), -8 + r * Math.sin(a)); else c.moveTo(-6 + r, -8);
      }
      c.lineWidth = 4; c.strokeStyle = '#8A4F1D'; c.stroke();
      c.restore();
    },
    butterfly: function (c, t) {
      var f = 0.35 + Math.abs(Math.sin(t * 9)) * 0.65;
      c.save(); c.scale(1, f);
      ell(c, -10, -22, 24, 20, '#FF7AB6', -0.5); ell(c, -10, 18, 18, 15, '#C77DFF', 0.5);
      ell(c, 10, -22, 24, 20, '#FF7AB6', 0.5); ell(c, 10, 18, 18, 15, '#C77DFF', -0.5);
      circ(c, -12, -24, 7, '#FFE066'); circ(c, 12, -24, 7, '#FFE066');
      c.restore();
      ell(c, 0, 0, 22, 6, '#4A3A5A');
      circ(c, 22, 0, 7, '#4A3A5A');
      c.beginPath(); c.moveTo(24, -4); c.lineTo(34, -16); c.moveTo(26, 2); c.lineTo(38, -6);
      c.lineWidth = 2.5; c.strokeStyle = '#4A3A5A'; c.stroke();
    },
    train: function (c, t, d) {
      c.beginPath(); K.rrPath(c, -48, -36, 40, 40, 8); c.fillStyle = '#3D8BFD'; c.fill(); outline(c);
      c.beginPath(); K.rrPath(c, -42, -30, 28, 16, 4); c.fillStyle = '#BDE6FF'; c.fill();
      c.beginPath(); K.rrPath(c, -12, -18, 58, 22, 8); c.fillStyle = '#FF5A5F'; c.fill(); outline(c);
      c.beginPath(); K.rrPath(c, 20, -34, 14, 18, 3); c.fillStyle = '#33333F'; c.fill();
      circ(c, 27, -42 - Math.abs(Math.sin(t * 5)) * 6, 7, 'rgba(255,255,255,0.85)');
      for (var k = 0; k < 3; k++) {
        c.save(); c.translate(-34 + k * 30, 8); c.rotate(d / 12);
        circ(c, 0, 0, 12, '#33333F'); circ(c, 0, 0, 5, '#FFC93C');
        c.restore();
      }
    },
    mouse: function (c, t) {
      c.beginPath(); c.moveTo(-36, 6); c.quadraticCurveTo(-60, 0, -58, -22); c.lineWidth = 4; c.strokeStyle = '#E58FA6'; c.stroke();
      ell(c, -4, 0, 38, 24, '#AEB4C2');
      circ(c, 14, -24, 13, '#AEB4C2'); circ(c, 14, -24, 7, '#FFB3C7');
      ell(c, 30, -2, 18, 15, '#BCC2CF');
      circ(c, 48, -2, 5, '#FF7AA2');
      eye(c, 32, -8, 5);
      c.beginPath(); c.moveTo(44, 4); c.lineTo(58, 8); c.moveTo(44, 2); c.lineTo(58, -2); c.lineWidth = 1.5; c.strokeStyle = '#555'; c.stroke();
    },
    rabbit: function (c, t) {
      var h = Math.abs(Math.sin(t * 8)) * 5;
      c.save(); c.translate(0, -h);
      circ(c, -32, 4, 10, '#ffffff');
      ell(c, -6, 4, 30, 22, '#ffffff');
      c.beginPath(); c.ellipse(-6, 4, 30, 22, 0, 0, Math.PI * 2); outline(c, 3);
      ell(c, 14, -38, 8, 24, '#ffffff', 0.25); ell(c, 14, -38, 4, 16, '#FFB3C7', 0.25);
      ell(c, 26, -36, 8, 24, '#ffffff', 0.5); ell(c, 26, -36, 4, 16, '#FFB3C7', 0.5);
      circ(c, 22, -8, 18, '#ffffff');
      c.beginPath(); c.arc(22, -8, 18, 0, Math.PI * 2); outline(c, 3);
      eye(c, 28, -12, 5);
      circ(c, 39, -6, 4, '#FF7AA2');
      c.restore();
    }
  };

  var GOALS = {
    flower: function (c, t) {
      c.beginPath(); c.moveTo(0, 10); c.lineTo(0, 90); c.lineWidth = 8; c.strokeStyle = '#4CAF50'; c.stroke();
      ell(c, 16, 62, 18, 8, '#66BB6A', -0.5);
      for (var k = 0; k < 6; k++) {
        var a = k / 6 * Math.PI * 2 + Math.sin(t) * 0.1;
        circ(c, Math.cos(a) * 26, Math.sin(a) * 26, 20, '#FF7AB6');
      }
      circ(c, 0, 0, 18, '#FFD23F');
    },
    basket: function (c) {
      c.beginPath(); c.moveTo(-70, 0); c.lineTo(70, 0); c.lineTo(52, 78); c.lineTo(-52, 78); c.closePath();
      c.fillStyle = '#D9A066'; c.fill(); outline(c);
      c.strokeStyle = '#B07A45'; c.lineWidth = 4;
      for (var k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-70 + k * 4.5, k * 19); c.lineTo(70 - k * 4.5, k * 19); c.stroke(); }
      c.beginPath(); c.ellipse(0, 0, 70, 12, 0, 0, Math.PI * 2); c.fillStyle = '#8A5A2B'; c.fill();
    },
    house: function (c) {
      c.beginPath(); c.moveTo(-80, -40); c.lineTo(0, -110); c.lineTo(80, -40); c.closePath(); c.fillStyle = '#E2574C'; c.fill(); outline(c);
      c.beginPath(); c.rect(-64, -42, 128, 92); c.fillStyle = '#FFE8B6'; c.fill(); outline(c);
      c.beginPath(); K.rrPath(c, -22, -6, 44, 56, 10); c.fillStyle = '#9C6644'; c.fill();
      c.beginPath(); c.rect(26, -28, 26, 24); c.fillStyle = '#9ED8FF'; c.fill(); outline(c, 3);
      circ(c, 14, 24, 4, '#FFD23F');
    },
    nest: function (c) {
      ell(c, -14, -14, 16, 22, '#FFF5E1'); ell(c, 14, -16, 16, 22, '#E8F4FF');
      c.beginPath(); c.ellipse(0, 4, 62, 26, 0, 0, Math.PI); c.fillStyle = '#A0703F'; c.fill();
      c.strokeStyle = '#7A5230'; c.lineWidth = 4;
      for (var k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(-58 + k * 6, 6 + Math.abs(k) * 3); c.lineTo(58 + k * 6, 10 - Math.abs(k) * 2); c.stroke(); }
    },
    seaweed: function (c, t) {
      c.lineCap = 'round';
      var cols = ['#2EB872', '#4CD38A', '#1E9E5A'];
      for (var k = -1; k <= 1; k++) {
        c.beginPath(); c.moveTo(k * 22, 120);
        for (var y = 110; y >= -40 + Math.abs(k) * 20; y -= 10) c.lineTo(k * 22 + Math.sin(y / 22 + t * 2 + k) * 10, y);
        c.lineWidth = 14; c.strokeStyle = cols[k + 1]; c.stroke();
      }
    },
    cloud: function (c, t) {
      c.save(); c.scale(1.3, 1.3);
      K.cloud(-42, 8, 1, '#ffffff');
      c.restore();
      circ(c, -14, 4, 4, '#5B6B85'); circ(c, 14, 4, 4, '#5B6B85');
      c.beginPath(); c.arc(0, 10, 9, 0.3, Math.PI - 0.3); c.lineWidth = 3; c.strokeStyle = '#5B6B85'; c.stroke();
      circ(c, -26, 14, 6, 'rgba(255,150,170,0.5)'); circ(c, 26, 14, 6, 'rgba(255,150,170,0.5)');
    },
    apple: function (c) {
      c.beginPath(); c.moveTo(0, -30); c.quadraticCurveTo(4, -44, 12, -50); c.lineWidth = 6; c.strokeStyle = '#7A5230'; c.stroke();
      ell(c, 20, -42, 16, 8, '#5FB236', -0.4);
      circ(c, -14, 2, 32, '#E53935'); circ(c, 14, 2, 32, '#E53935');
      ell(c, -18, -8, 8, 12, 'rgba(255,255,255,0.45)', 0.4);
    },
    leaf: function (c) {
      c.beginPath(); c.moveTo(-50, 30); c.quadraticCurveTo(-40, -50, 40, -40); c.quadraticCurveTo(40, 30, -50, 30);
      c.fillStyle = '#7AC943'; c.fill(); outline(c);
      c.beginPath(); c.moveTo(-50, 30); c.quadraticCurveTo(0, -4, 34, -34); c.lineWidth = 4; c.strokeStyle = '#4E9A2A'; c.stroke();
    },
    tulip: function (c) {
      c.beginPath(); c.moveTo(0, 10); c.lineTo(0, 100); c.lineWidth = 8; c.strokeStyle = '#4CAF50'; c.stroke();
      ell(c, -18, 70, 20, 8, '#66BB6A', 0.6);
      c.beginPath(); c.moveTo(-28, -30); c.lineTo(-14, -8); c.lineTo(0, -34); c.lineTo(14, -8); c.lineTo(28, -30);
      c.quadraticCurveTo(32, 18, 0, 20); c.quadraticCurveTo(-32, 18, -28, -30); c.fillStyle = '#FFB000'; c.fill(); outline(c);
    },
    station: function (c, t) {
      c.beginPath(); c.moveTo(-60, -30); c.lineTo(0, -80); c.lineTo(60, -30); c.closePath(); c.fillStyle = '#9B5DE5'; c.fill(); outline(c);
      c.beginPath(); c.rect(-48, -32, 96, 70); c.fillStyle = '#FFF3C4'; c.fill(); outline(c);
      c.beginPath(); K.rrPath(c, -16, -4, 32, 42, 8); c.fillStyle = '#7B5EA7'; c.fill();
      c.beginPath(); c.moveTo(0, -80); c.lineTo(0, -120); c.lineWidth = 4; c.strokeStyle = '#555'; c.stroke();
      c.beginPath(); c.moveTo(0, -120); c.lineTo(30 + Math.sin(t * 4) * 4, -110); c.lineTo(0, -100); c.closePath(); c.fillStyle = '#FF5A5F'; c.fill();
    },
    cheese: function (c) {
      c.beginPath(); c.moveTo(-50, 30); c.lineTo(50, 30); c.lineTo(50, -10); c.lineTo(-50, 10); c.closePath();
      c.fillStyle = '#FFD23F'; c.fill(); outline(c);
      c.beginPath(); c.moveTo(-50, 10); c.lineTo(50, -10); c.lineTo(20, -30); c.closePath(); c.fillStyle = '#FFE680'; c.fill(); outline(c);
      circ(c, -20, 18, 7, '#E8B923'); circ(c, 18, 12, 9, '#E8B923'); circ(c, 38, 22, 5, '#E8B923');
    },
    carrot: function (c, t) {
      c.save(); c.rotate(0.5);
      for (var k = -1; k <= 1; k++) ell(c, k * 10, -46, 7, 20, '#5FB236', k * 0.4 + Math.sin(t * 3) * 0.05);
      c.beginPath(); c.moveTo(-20, -30); c.quadraticCurveTo(0, -38, 20, -30); c.lineTo(2, 56); c.lineTo(-2, 56); c.closePath();
      c.fillStyle = '#FF8C1A'; c.fill(); outline(c);
      c.strokeStyle = '#D96C00'; c.lineWidth = 3;
      for (k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-12 + k * 3, -10 + k * 18); c.lineTo(-2 + k * 3, -8 + k * 18); c.stroke(); }
      c.restore();
    }
  };

  // ------------------------------------------------------------------ backgrounds
  function background(kind) {
    var c = K.ctx;
    if (kind === 'water') {
      K.bg('#BDEBFF', '#5CB8E6');
      c.fillStyle = 'rgba(255,255,255,0.35)';
      for (var k = 0; k < 14; k++) {
        var bx = (k * 173) % W;
        var by = H - ((K.time * 30 + k * 97) % (H + 40));
        c.beginPath(); c.arc(bx, by, 6 + (k % 4) * 3, 0, Math.PI * 2); c.fill();
      }
      c.fillStyle = '#F2D59B';
      c.beginPath(); c.moveTo(0, H); c.quadraticCurveTo(320, H - 70, 640, H - 40); c.quadraticCurveTo(960, H - 10, W, H - 60); c.lineTo(W, H); c.fill();
      return;
    }
    if (kind === 'sky') {
      K.bg('#BFE6FF', '#EAF7FF');
      K.cloud(120, 620, 0.9, 'rgba(255,255,255,0.8)');
      K.cloud(1050, 120, 0.8, 'rgba(255,255,255,0.8)');
      c.fillStyle = '#FFE066';
      c.beginPath(); c.arc(1180, 600, 60, 0, Math.PI * 2); c.fill();
      return;
    }
    if (kind === 'room') {
      K.bg('#FFF4D6', '#FFE2B0');
      c.fillStyle = 'rgba(255,255,255,0.4)';
      for (var x = 0; x < W; x += 80) c.fillRect(x, 0, 40, H);
      c.fillStyle = '#E8C48E';
      c.fillRect(0, H - 60, W, 60);
      return;
    }
    K.bg('#CDEEFF', '#F4FBFF');
    c.fillStyle = kind === 'garden' ? '#BDE8A0' : '#C8EFA6';
    c.beginPath();
    c.moveTo(0, kind === 'hill' ? 380 : 470);
    if (kind === 'hill') c.quadraticCurveTo(500, 200, W, 420);
    else c.quadraticCurveTo(640, 420, W, 470);
    c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    K.cloud(170, 110, 0.7);
    K.cloud(980, 90, 0.6);
    if (kind === 'garden' || kind === 'meadow') {
      for (var j = 0; j < 9; j++) {
        var fx = 60 + j * 145;
        var fy = 690 - (j % 3) * 12;
        circ(c, fx, fy, 7, ['#FF7AB6', '#FFD23F', '#ffffff'][j % 3]);
      }
    }
  }

  // ------------------------------------------------------------------ maze (level 12)
  function Maze(def) {
    this.main = T.compile([def.main], STEP)[0].pts;
    var n = this.main.length / 2;
    this.br = [];
    for (var k = 0; k < def.branches.length; k++) {
      var pts = T.compile([def.branches[k]], STEP)[0].pts;
      this.br.push({ pts: pts, j: T.nearest(this.main, pts[0], pts[1], 0, n - 1).i });
    }
    this.prog = 0;
    this.shown = 0;
    this.mode = -1;
    this.bprog = 0;
    this.bshown = 0;
    this.retreat = false;
    this.pid = null;
    this.on = false;
    this.done = false;
    this.last = null;
    this.wiggle = 0;
  }
  var MP = Maze.prototype;
  MP.n = function () { return this.main.length / 2; };
  MP.head = function () {
    var p = this.mode < 0 ? this.main : this.br[this.mode].pts;
    var i = Math.round(this.mode < 0 ? this.shown : this.bshown);
    var a = T.angleAt(p, i);
    if (this.retreat) a += Math.PI;
    return { x: p[i * 2], y: p[i * 2 + 1], a: a };
  };
  MP.down = function (p) {
    if (this.done || this.pid !== null || this.retreat) return;
    this.pid = p.id;
    this.last = { x: p.x, y: p.y };
    this.on = false;
    this.feed(p.x, p.y);
  };
  MP.move = function (p) {
    if (p.id !== this.pid || !this.last) return;
    var l = this.last;
    var dx = p.x - l.x;
    var dy = p.y - l.y;
    var n = Math.max(1, Math.ceil(Math.sqrt(dx * dx + dy * dy) / (TOL * 0.35)));
    for (var k = 1; k <= n && !this.done && !this.retreat; k++) this.feed(l.x + dx * k / n, l.y + dy * k / n);
    this.last = { x: p.x, y: p.y };
  };
  MP.up = function (p, cancel) {
    if (p.id !== this.pid) return;
    if (!cancel) this.move(p);
    if (this.pid === null) return;
    var n = this.n();
    if (!cancel && this.mode < 0 && !this.done && this.prog >= 0.85 * (n - 1) &&
        K.dist(p.x, p.y, this.main[(n - 1) * 2], this.main[(n - 1) * 2 + 1]) <= TOL * 1.5) {
      this.prog = n - 1;
      this.done = true;
      if (this.onDone) this.onDone();
    }
    this.pid = null;
    this.last = null;
    this.on = false;
    if (this.mode >= 0 && !this.done) this.retreat = true;
  };
  MP.feed = function (x, y) {
    var tol2 = TOL * TOL;
    var n = this.n();
    var h = this.head();
    if (!this.on) {
      if ((x - h.x) * (x - h.x) + (y - h.y) * (y - h.y) <= tol2 * 2.25) this.on = true;
      else return;
    }
    if (this.mode < 0) {
      var best = T.nearest(this.main, x, y, Math.max(0, this.prog - 5), Math.min(n - 1, this.prog + 20));
      var bk = -1;
      for (var k = 0; k < this.br.length; k++) {
        var b = this.br[k];
        if (Math.abs(b.j - this.prog) > 8) continue;
        var cand = T.nearest(b.pts, x, y, 0, Math.min(b.pts.length / 2 - 1, 20));
        if (cand.i >= 3 && cand.d2 < best.d2) { best = cand; bk = k; }
      }
      if (best.d2 <= tol2) {
        if (bk >= 0) { this.mode = bk; this.bprog = best.i; this.bshown = 0; }
        else if (best.i > this.prog) this.prog = best.i;
      } else if (best.d2 > tol2 * 6.25) this.on = false;
      if (this.prog >= 0.95 * (n - 1)) {
        this.prog = n - 1;
        this.done = true;
        this.pid = null;
        if (this.onDone) this.onDone();
      }
      return;
    }
    var br = this.br[this.mode];
    var bn = br.pts.length / 2;
    var c2 = T.nearest(br.pts, x, y, Math.max(0, this.bprog - 5), Math.min(bn - 1, this.bprog + 20));
    if (this.bprog <= 8) {
      var mc = T.nearest(this.main, x, y, Math.max(0, br.j - 5), Math.min(n - 1, br.j + 20));
      if (mc.d2 < c2.d2 && mc.d2 <= tol2) {
        this.mode = -1;
        this.prog = Math.max(this.prog, mc.i);
        this.shown = this.prog;
        return;
      }
    }
    if (c2.d2 <= tol2) {
      this.bprog = c2.i;
      if (this.bprog >= bn - 2) {
        this.retreat = true;
        this.wiggle = 1;
        this.pid = null;
        this.on = false;
        K.sfx.boing();
        K.cheer('shi_puzzled', 'right', 1.4, 240);
      }
    } else if (c2.d2 > tol2 * 6.25) this.on = false;
  };
  MP.update = function (dt) {
    this.shown += (this.prog - this.shown) * Math.min(1, dt * 18);
    this.wiggle = Math.max(0, this.wiggle - dt * 2);
    if (this.mode >= 0) {
      if (this.retreat) {
        this.bprog = Math.max(0, this.bprog - dt * 40);
        this.bshown = this.bprog;
        if (this.bprog <= 0.01) {
          this.mode = -1;
          this.retreat = false;
        }
      } else this.bshown += (this.bprog - this.bshown) * Math.min(1, dt * 18);
    }
  };
  MP.render = function (c, color) {
    var all = [this.main];
    var k;
    for (k = 0; k < this.br.length; k++) all.push(this.br[k].pts);
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (var pass = 0; pass < 2; pass++) {
      for (k = 0; k < all.length; k++) {
        T.polyline(c, all[k], 0, all[k].length / 2 - 1);
        c.lineWidth = pass ? ROAD : ROAD + 12;
        c.strokeStyle = pass ? '#FFF8E8' : '#7DBB55';
        c.stroke();
      }
    }
    for (k = 0; k < all.length; k++) {
      T.polyline(c, all[k], 0, all[k].length / 2 - 1);
      c.setLineDash([0.1, 24]);
      c.lineWidth = 10;
      c.strokeStyle = '#C9B48A';
      c.stroke();
      c.setLineDash([]);
    }
    if (this.shown > 0.5) T.crayon(c, this.main, 0, Math.round(this.shown), ROAD * 0.7, color);
    if (this.mode >= 0 && this.bshown > 0.5) T.crayon(c, this.br[this.mode].pts, 0, Math.round(this.bshown), ROAD * 0.7, color, 'rgba(255,255,255,0.3)');
    if (this.prog === 0 && this.mode < 0) {
      var ai = T.ahead(this.main, 0, 56);
      T.arrowHead(c, this.main[ai * 2], this.main[ai * 2 + 1], T.angleAt(this.main, ai), 34, '#24A35A');
      c.beginPath();
      c.arc(this.main[0], this.main[1], 28 * (1 + Math.sin(K.time * 5) * 0.07), 0, Math.PI * 2);
      c.fillStyle = '#24A35A';
      c.fill();
      c.lineWidth = 5;
      c.strokeStyle = '#ffffff';
      c.stroke();
    }
    c.restore();
  };
  MP.renderHint = function (c, idle) {
    if (this.done || this.pid !== null || this.retreat || idle < 4.5) return;
    var n = this.n();
    var cyc = (idle - 4.5) % 3.2;
    var from = Math.round(this.mode < 0 ? this.prog : this.br[this.mode].j);
    var ph = K.clamp((cyc - 0.3) / 2.4, 0, 1);
    var idx = Math.round(from + (n - 1 - from) * K.easeInOut(ph));
    var alpha = K.clamp((idle - 4.5) / 0.3, 0, 1) * (cyc > 2.8 ? 1 - (cyc - 2.8) / 0.4 : 1);
    c.save();
    c.globalAlpha = 0.35 * alpha;
    c.lineCap = 'round';
    T.polyline(c, this.main, from, idx);
    c.lineWidth = ROAD * 0.5;
    c.strokeStyle = '#FFD24A';
    c.stroke();
    c.restore();
    K.drawHand(this.main[idx * 2], this.main[idx * 2 + 1], cyc < 0.3 ? cyc / 0.3 : 1, alpha);
  };

  // ------------------------------------------------------------------ play state
  var lv = 0;
  var tr = null;       // T.Tracer or Maze
  var dist = 0;        // distance travelled by the friend (for wheels)
  var lastHead = null;
  var arrive = 0;      // celebration timer after reaching the goal
  var tickStep = 0;
  var goalPos = null;
  var crayon = CRAYONS[0];

  function startLevel(k) {
    lv = (k + LEVELS.length) % LEVELS.length;
    var L = LEVELS[lv];
    crayon = CRAYONS[lv % CRAYONS.length];
    dist = 0;
    lastHead = null;
    arrive = 0;
    tickStep = 0;
    if (L.maze) {
      tr = new Maze(L.maze);
      tr.onDone = reached;
      var m = tr.main;
      goalPos = { x: m[m.length - 2], y: m[m.length - 1] };
    } else {
      var strokes = T.compile([L.path], STEP);
      tr = new T.Tracer(strokes, { width: ROAD, tol: TOL, color: crayon, noNumbers: true, noHead: true, noEnd: true, onDone: reached });
      var p = strokes[0].pts;
      goalPos = { x: p[p.length - 2], y: p[p.length - 1] };
    }
    K.go('play');
  }

  function reached() {
    arrive = 0.001;
    K.sfx.ting();
    K.fx.burst(goalPos.x, goalPos.y, 26, { kind: 'star' });
    K.cheer(lv % 2 ? 'shi_clap' : 'gi_clap', goalPos.x > 640 ? 'left' : 'right', 2.2);
    if (!doneLv[lv]) { doneLv[lv] = 1; }
    save();
  }

  function fraction() {
    if (tr instanceof Maze) return tr.prog / (tr.n() - 1);
    return tr.fraction();
  }

  var menuBtn = K.button({ x: 92, y: 88, r: 48, icon: 'grid', color: '#5B8DEF', onTap: function () { K.go('menu'); } });

  K.screen('play', {
    buttons: [menuBtn],
    down: function (p) { tr.down(p); },
    move: function (p) {
      tr.move(p);
      var f = fraction();
      var step = Math.floor(f * 8);
      if (step > tickStep && !tr.done) {
        tickStep = step;
        K.sfx.note(K.SCALE[Math.min(7, step)], { vol: 0.07, len: 0.35 });
      }
    },
    up: function (p, cancel) { tr.up(p, cancel); },
    pause: function () { save(); },
    update: function (dt) {
      tr.update(dt);
      var h = tr.head();
      if (lastHead) dist += K.dist(h.x, h.y, lastHead.x, lastHead.y);
      lastHead = h;
      if (arrive > 0) {
        arrive += dt;
        if (arrive > 1.6 && !K.isDone()) {
          K.showDone({
            title: K.pick(['Giỏi quá!', 'Tuyệt vời!', 'Hoan hô!']),
            left: 'gi_cheer', right: 'shi_cheer',
            onReplay: function () { startLevel(lv); },
            onNext: function () { startLevel(lv + 1); },
            onMenu: function () { K.go('menu'); }
          });
        }
      }
    },
    render: function (c) {
      var L = LEVELS[lv];
      background(L.bg);
      K.dots(LEVELS.length, 0, 640, 46, 9, '#F5A623', lv);
      for (var k = 0; k < LEVELS.length; k++) {
        if (doneLv[k]) {
          var x = 640 - (LEVELS.length - 1) * 16 + k * 32;
          K.circle(x, 46, k === lv ? 11 : 9, '#F5A623');
        }
      }
      if (tr instanceof Maze) tr.render(c, crayon);
      else tr.render(c, { roadCur: '#FFFFFF', road: '#FFFFFF' });
      // goal
      c.save();
      c.translate(goalPos.x, goalPos.y + (L.goal === 'basket' ? 34 : 0));
      var gs = arrive > 0 ? 1 + Math.sin(Math.min(arrive, 0.6) / 0.6 * Math.PI) * 0.25 : 1;
      c.scale(gs * 0.9, gs * 0.9);
      GOALS[L.goal](c, K.time);
      c.restore();
      // friend: waits just behind the green start dot, then rides under the finger
      var h = tr.head();
      var a = h.a;
      var lead = (tr instanceof Maze && tr.mode >= 0) ? 0 : Math.max(0, 1 - tr.shown / 3) * 80;
      c.save();
      c.translate(h.x - Math.cos(a) * lead, h.y - Math.sin(a) * lead + (arrive > 0 ? -Math.abs(Math.sin(arrive * 9)) * 26 : Math.sin(K.time * 6) * 3));
      if (L.obj !== 'ball') {
        c.rotate(a);
        if (Math.cos(a) < -0.01) c.scale(1, -1);
      }
      if (tr instanceof Maze && tr.wiggle > 0) c.rotate(Math.sin(tr.wiggle * 30) * 0.2 * tr.wiggle);
      c.scale(1.05, 1.05);
      FRIENDS[L.obj](c, K.time, dist);
      c.restore();
      tr.renderHint(c, K.idle(), 4.5);
    }
  });

  // ------------------------------------------------------------------ menu (12 levels)
  var previews = [];
  function buildPreviews() {
    for (var k = 0; k < LEVELS.length; k++) {
      var L = LEVELS[k];
      var defs = L.maze ? [L.maze.main].concat(L.maze.branches) : [L.path];
      previews.push(T.compile(defs, 12));
    }
  }
  buildPreviews();
  var tiles = K.grid(LEVELS.length, 4, 236, 162, 34, 30, { x: 0, y: 30, w: W, h: H - 30 });
  var pressedTile = -1;

  function drawPreview(c, k, r) {
    var st = previews[k];
    var b = T.bbox(st);
    var s = Math.min((r.w - 60) / Math.max(1, b.x1 - b.x0), (r.h - 50) / Math.max(1, b.y1 - b.y0), 0.3);
    var placed = T.place(st, s, r.x + r.w / 2 - (b.x0 + b.x1) / 2 * s, r.y + r.h / 2 - (b.y0 + b.y1) / 2 * s);
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (var i = 0; i < placed.length; i++) {
      var p = placed[i].pts;
      T.polyline(c, p, 0, p.length / 2 - 1);
      c.lineWidth = 14;
      c.strokeStyle = doneLv[k] ? CRAYONS[k % CRAYONS.length] : '#D5DCE6';
      c.stroke();
    }
    var m = placed[0].pts;
    K.circle(m[0], m[1], 10, '#24A35A', '#ffffff', 3);
    c.restore();
    c.save();
    c.translate(m[m.length - 2], m[m.length - 1]);
    c.scale(0.38, 0.38);
    GOALS[LEVELS[k].goal](c, K.time);
    c.restore();
    c.save();
    c.translate(r.x + 46, r.y + r.h - 34);
    c.scale(0.42, 0.42);
    FRIENDS[LEVELS[k].obj](c, K.time, 0);
    c.restore();
  }

  K.screen('menu', {
    down: function (p) {
      pressedTile = -1;
      for (var k = 0; k < tiles.length; k++) if (K.inRect(p, tiles[k], 6)) pressedTile = k;
    },
    up: function (p, cancel) {
      var k = pressedTile;
      pressedTile = -1;
      if (cancel || k < 0 || !K.inRect(p, tiles[k], 16)) return;
      K.sfx.click();
      startLevel(k);
    },
    render: function (c) {
      K.bg('#FFF4D6', '#FFE6B3');
      var sug = suggested();
      for (var k = 0; k < tiles.length; k++) {
        var r = tiles[k];
        K.tile(r.x, r.y, r.w, r.h, { done: !!doneLv[k], suggest: k === sug, pressed: k === pressedTile });
        drawPreview(c, k, r);
      }
    }
  });

  // ------------------------------------------------------------------ start + debug
  K.screen('start', K.startScreen({
    title: 'Tô nét', top: '#FFF4D6', bottom: '#FFDFA0', titleColor: '#E2574C',
    left: 'gi_point', right: 'shi_wave',
    deco: function (c, t) {
      var p = T.compile(['M300 340 Q470 270 640 340 Q810 410 980 340'], 10)[0].pts;
      c.save();
      c.lineCap = 'round';
      T.polyline(c, p, 0, p.length / 2 - 1);
      c.setLineDash([0.1, 26]);
      c.lineWidth = 12;
      c.strokeStyle = 'rgba(226,87,76,0.35)';
      c.stroke();
      c.restore();
    },
    onPlay: function () { K.go('menu'); }
  }));

  K.screen('debug', {
    render: function (c) {
      K.bg('#ffffff');
      var cells = K.grid(LEVELS.length, 4, 300, 220, 10, 10, { x: 0, y: 0, w: W, h: H });
      for (var k = 0; k < LEVELS.length; k++) {
        var r = cells[k];
        c.strokeStyle = '#ddd';
        c.lineWidth = 1;
        c.strokeRect(r.x, r.y, r.w, r.h);
        var L = LEVELS[k];
        var defs = L.maze ? [L.maze.main].concat(L.maze.branches) : [L.path];
        var st = T.compile(defs, 8);
        var b = T.bbox(st);
        var s = Math.min((r.w - 40) / (b.x1 - b.x0 + 1), (r.h - 50) / (b.y1 - b.y0 + 1));
        T.debugDraw(c, T.place(st, s, r.x + r.w / 2 - (b.x0 + b.x1) / 2 * s, r.y + 10 + r.h / 2 - (b.y0 + b.y1) / 2 * s),
          { t: (k + 1) + '. ' + L.obj + ' → ' + L.goal, x: r.x + r.w / 2, y: r.y + 16 });
      }
    }
  });

  window.__kg.info = function () {
    var mz = tr instanceof Maze;
    return { lv: lv, done: tr ? tr.done : false, pts: tr ? (mz ? tr.main : tr.s[0].pts) : null,
      branches: mz ? tr.br.map(function (b) { return b.pts; }) : [], mode: mz ? tr.mode : -1, retreat: mz ? tr.retreat : false };
  };
  K.start(location.hash.indexOf('debug') >= 0 ? 'debug' : 'start');
})();
