/*
 * ART — small hand-written vector pictures (canvas paths), each centered on (0,0) inside a
 * ~120x120 box, facing right. ART.draw(ctx, name, x, y, size, {t, flip}) ; ART.silhouette(name, size)
 * returns an offscreen canvas with the same shape filled in one dark color (for "Tìm bóng").
 */
var ART = (function () {
  'use strict';
  var OUT = 'rgba(70,45,35,0.8)';

  function E(c, x, y, rx, ry, rot) { c.beginPath(); c.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }
  function C(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function R(c, x, y, w, h, r) { c.beginPath(); K.rrPath(c, x, y, w, h, r); }
  function fill(c, col) { c.fillStyle = col; c.fill(); }
  function line(c, w) { c.lineWidth = w || 4; c.strokeStyle = OUT; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); }
  function fl(c, col, w) { fill(c, col); line(c, w); }
  function stroke(c, col, w) { c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); }
  function eye(c, x, y, r) {
    C(c, x, y, r); fill(c, '#2B2B3A');
    C(c, x + r * 0.3, y - r * 0.35, r * 0.35); fill(c, '#ffffff');
  }
  function smile(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0.25, Math.PI - 0.25); stroke(c, '#3A2A2A', 3.5); }
  function cheek(c, x, y) { E(c, x, y, 7, 4.5); fill(c, 'rgba(255,120,140,0.45)'); }
  function shine(c, x, y, rx, ry, rot) { E(c, x, y, rx, ry, rot); fill(c, 'rgba(255,255,255,0.5)'); }
  function wheel(c, x, y, r, t) {
    C(c, x, y, r); fl(c, '#33333F');
    C(c, x, y, r * 0.45); fill(c, '#C9CDD6');
  }

  var items = {
    // ---------------------------------------------------------------- fruits
    apple: function (c) {
      c.beginPath(); c.moveTo(0, -34); c.quadraticCurveTo(4, -50, 12, -56); stroke(c, '#7A5230', 7);
      E(c, 24, -48, 16, 8, -0.4); fl(c, '#5FB236', 3);
      c.beginPath(); c.moveTo(0, -30);
      c.bezierCurveTo(30, -50, 62, -20, 50, 16); c.bezierCurveTo(42, 44, 20, 56, 0, 46);
      c.bezierCurveTo(-20, 56, -42, 44, -50, 16); c.bezierCurveTo(-62, -20, -30, -50, 0, -30); c.closePath();
      fl(c, '#E53935');
      shine(c, -24, -10, 9, 15, 0.4);
    },
    orange: function (c) {
      C(c, 0, 6, 50); fl(c, '#FF9F1C');
      c.fillStyle = 'rgba(200,100,0,0.25)';
      for (var i = 0; i < 9; i++) { var a = i * 2.4; C(c, Math.cos(a) * (18 + i * 2.5), 6 + Math.sin(a) * (18 + i * 2.5), 2.5); c.fill(); }
      C(c, 0, -42, 5); fill(c, '#6B8E23');
      E(c, 14, -48, 14, 7, -0.3); fl(c, '#5FB236', 3);
      shine(c, -22, -12, 10, 14, 0.5);
    },
    banana: function (c) {
      c.beginPath(); c.moveTo(-50, -26);
      c.quadraticCurveTo(-34, 50, 52, 26); c.quadraticCurveTo(58, 18, 50, 14);
      c.quadraticCurveTo(-14, 26, -36, -30); c.closePath();
      fl(c, '#FFD93D');
      c.beginPath(); c.moveTo(-44, -18); c.quadraticCurveTo(-24, 30, 40, 22); stroke(c, 'rgba(200,150,0,0.5)', 3);
      R(c, -56, -40, 12, 16, 4); fl(c, '#7A5230', 3);
    },
    grapes: function (c) {
      c.beginPath(); c.moveTo(0, -40); c.lineTo(4, -56); stroke(c, '#7A5230', 6);
      E(c, 20, -50, 16, 9, -0.3); fl(c, '#5FB236', 3);
      var pts = [[-24, -26], [0, -28], [24, -26], [-12, -4], [12, -4], [-30, -2], [30, -2], [0, 18], [-18, 20], [18, 20], [-8, 40], [10, 40]];
      for (var i = 0; i < pts.length; i++) { C(c, pts[i][0], pts[i][1], 14); fl(c, '#8E5BD6', 3); }
      for (i = 0; i < pts.length; i++) { C(c, pts[i][0] - 4, pts[i][1] - 5, 4); fill(c, 'rgba(255,255,255,0.5)'); }
    },
    watermelon: function (c) {
      c.beginPath(); c.arc(0, -16, 60, 0, Math.PI); c.closePath(); fl(c, '#3FA34D');
      c.beginPath(); c.arc(0, -16, 52, 0, Math.PI); c.closePath(); fill(c, '#F3FFE8');
      c.beginPath(); c.arc(0, -16, 46, 0, Math.PI); c.closePath(); fill(c, '#FF4F6A');
      c.fillStyle = '#2B2B3A';
      var s = [[-24, 0], [0, 6], [24, 0], [-12, 18], [12, 18], [0, -6]];
      for (var i = 0; i < s.length; i++) { E(c, s[i][0], s[i][1], 3, 5); c.fill(); }
    },
    strawberry: function (c) {
      c.beginPath(); c.moveTo(0, 52);
      c.bezierCurveTo(-30, 30, -54, 0, -46, -22); c.bezierCurveTo(-36, -44, 36, -44, 46, -22);
      c.bezierCurveTo(54, 0, 30, 30, 0, 52); c.closePath(); fl(c, '#F2334A');
      c.fillStyle = '#FFE680';
      var s = [[-22, -14], [0, -18], [22, -14], [-28, 6], [-6, 4], [16, 6], [32, -2], [-14, 24], [8, 24], [0, 40]];
      for (var i = 0; i < s.length; i++) { E(c, s[i][0], s[i][1], 2.5, 4); c.fill(); }
      c.beginPath(); c.moveTo(-30, -32); c.lineTo(-10, -44); c.lineTo(0, -56); c.lineTo(10, -44); c.lineTo(30, -32); c.lineTo(0, -36); c.closePath();
      fl(c, '#4CAF50', 3);
    },
    pear: function (c) {
      c.beginPath(); c.moveTo(0, -38); c.lineTo(4, -54); stroke(c, '#7A5230', 6);
      c.beginPath(); c.moveTo(0, -40);
      c.bezierCurveTo(22, -40, 22, -10, 36, 10); c.bezierCurveTo(52, 36, 30, 56, 0, 56);
      c.bezierCurveTo(-30, 56, -52, 36, -36, 10); c.bezierCurveTo(-22, -10, -22, -40, 0, -40); c.closePath();
      fl(c, '#B5D334');
      shine(c, -18, 10, 7, 14, 0.3);
    },
    cherry: function (c) {
      c.beginPath(); c.moveTo(-22, 20); c.quadraticCurveTo(-12, -30, 10, -50); c.moveTo(26, 26); c.quadraticCurveTo(22, -20, 10, -50);
      stroke(c, '#5B8C2A', 5);
      E(c, 22, -48, 14, 7, 0.3); fl(c, '#5FB236', 3);
      C(c, -24, 30, 22); fl(c, '#D7263D');
      C(c, 26, 34, 22); fl(c, '#D7263D');
      shine(c, -32, 22, 5, 8, 0.4); shine(c, 18, 26, 5, 8, 0.4);
    },
    // ---------------------------------------------------------------- animals
    cat: function (c) {
      c.beginPath(); c.moveTo(30, 40); c.quadraticCurveTo(66, 30, 52, -6); stroke(c, '#F0A04B', 11);
      E(c, 0, 26, 34, 32); fl(c, '#F7B267');
      c.beginPath(); c.moveTo(-30, -36); c.lineTo(-26, -66); c.lineTo(-6, -48); c.closePath(); fl(c, '#F7B267');
      c.beginPath(); c.moveTo(30, -36); c.lineTo(26, -66); c.lineTo(6, -48); c.closePath(); fl(c, '#F7B267');
      C(c, 0, -26, 32); fl(c, '#F7B267');
      eye(c, -12, -30, 5); eye(c, 12, -30, 5);
      c.beginPath(); c.moveTo(-4, -20); c.lineTo(4, -20); c.lineTo(0, -15); c.closePath(); fill(c, '#E5687A');
      c.beginPath(); c.moveTo(-36, -18); c.lineTo(-16, -16); c.moveTo(-36, -10); c.lineTo(-16, -12);
      c.moveTo(36, -18); c.lineTo(16, -16); c.moveTo(36, -10); c.lineTo(16, -12); stroke(c, '#7A5230', 2);
      E(c, -14, 54, 10, 6); fl(c, '#F7B267', 3); E(c, 14, 54, 10, 6); fl(c, '#F7B267', 3);
    },
    dog: function (c) {
      c.beginPath(); c.moveTo(30, 34); c.quadraticCurveTo(52, 26, 50, 4); stroke(c, '#B07A45', 10);
      E(c, 0, 26, 34, 32); fl(c, '#D9A066');
      C(c, 0, -26, 32); fl(c, '#D9A066');
      E(c, -32, -18, 11, 24, 0.25); fl(c, '#8A5A2B');
      E(c, 32, -18, 11, 24, -0.25); fl(c, '#8A5A2B');
      E(c, 0, -12, 16, 12); fill(c, '#F3D2A8');
      E(c, 0, -18, 6, 4.5); fill(c, '#3A2A2A');
      eye(c, -12, -32, 5); eye(c, 12, -32, 5);
      c.beginPath(); c.moveTo(0, -14); c.lineTo(0, -8); c.moveTo(-6, -6); c.quadraticCurveTo(0, -2, 6, -6); stroke(c, '#3A2A2A', 2.5);
      E(c, -14, 54, 10, 6); fl(c, '#D9A066', 3); E(c, 14, 54, 10, 6); fl(c, '#D9A066', 3);
    },
    rabbit: function (c) {
      C(c, 34, 34, 10); fl(c, '#ffffff', 3);
      E(c, 0, 30, 32, 28); fl(c, '#F4F4F8');
      E(c, -12, -60, 9, 26, -0.15); fl(c, '#F4F4F8'); E(c, -12, -58, 4, 18, -0.15); fill(c, '#FFB3C7');
      E(c, 12, -60, 9, 26, 0.15); fl(c, '#F4F4F8'); E(c, 12, -58, 4, 18, 0.15); fill(c, '#FFB3C7');
      C(c, 0, -18, 26); fl(c, '#F4F4F8');
      eye(c, -10, -22, 4.5); eye(c, 10, -22, 4.5);
      C(c, 0, -12, 4); fill(c, '#FF7AA2');
      cheek(c, -16, -10); cheek(c, 16, -10);
    },
    fish: function (c) {
      c.beginPath(); c.moveTo(-34, 0); c.lineTo(-62, -28); c.lineTo(-62, 28); c.closePath(); fl(c, '#FF8C42');
      E(c, 4, 0, 46, 30); fl(c, '#FFA552');
      c.save(); E(c, 4, 0, 46, 30); c.clip();
      c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(-12, -32, 9, 64); c.fillRect(12, -32, 7, 64);
      c.restore();
      E(c, 4, 0, 46, 30); line(c);
      eye(c, 30, -8, 6);
      c.beginPath(); c.moveTo(4, -28); c.quadraticCurveTo(16, -44, 26, -26); fl(c, '#FF8C42', 3);
    },
    bird: function (c) {
      c.beginPath(); c.moveTo(-28, 0); c.lineTo(-56, -14); c.lineTo(-52, 12); c.closePath(); fl(c, '#2F80ED');
      C(c, 0, 0, 36); fl(c, '#4EA8FF');
      E(c, 8, 14, 22, 16); fill(c, '#CDEBFF');
      c.beginPath(); c.moveTo(32, -8); c.lineTo(54, 0); c.lineTo(32, 8); c.closePath(); fl(c, '#FFA62B', 3);
      eye(c, 16, -12, 6);
      E(c, -10, 2, 20, 12, -0.3); fl(c, '#2F80ED', 3);
      c.beginPath(); c.moveTo(-6, 36); c.lineTo(-6, 48); c.moveTo(8, 36); c.lineTo(8, 48); stroke(c, '#FFA62B', 4);
    },
    turtle: function (c) {
      E(c, 46, 6, 16, 13); fl(c, '#8BD450');
      eye(c, 52, 2, 3.5);
      E(c, -30, 30, 12, 9); fl(c, '#8BD450'); E(c, 26, 32, 12, 9); fl(c, '#8BD450');
      c.beginPath(); c.moveTo(-50, 22); c.lineTo(-62, 26); c.lineTo(-50, 30); fl(c, '#8BD450', 3);
      c.beginPath(); c.ellipse(0, 22, 50, 46, 0, Math.PI, Math.PI * 2); c.closePath(); fl(c, '#3FA34D');
      c.beginPath(); c.moveTo(-18, 22); c.lineTo(-10, -4); c.lineTo(10, -4); c.lineTo(18, 22);
      c.moveTo(-10, -4); c.lineTo(-26, -14); c.moveTo(10, -4); c.lineTo(26, -14); stroke(c, '#2B7A37', 4);
      R(c, -52, 18, 104, 10, 5); fl(c, '#C9E59A', 3);
    },
    elephant: function (c) {
      E(c, -6, 14, 46, 34); fl(c, '#9FB4CC');
      R(c, -40, 30, 18, 30, 6); fl(c, '#9FB4CC'); R(c, 14, 30, 18, 30, 6); fl(c, '#9FB4CC');
      c.beginPath(); c.moveTo(-50, 4); c.lineTo(-62, 20); stroke(c, '#9FB4CC', 5);
      C(c, 32, -14, 28); fl(c, '#9FB4CC');
      c.beginPath(); c.moveTo(52, -6); c.quadraticCurveTo(66, 20, 58, 44); c.quadraticCurveTo(54, 50, 50, 44);
      c.quadraticCurveTo(54, 24, 42, 8); fl(c, '#9FB4CC');
      E(c, 14, -14, 18, 24); fl(c, '#B8C9DC');
      eye(c, 40, -22, 4.5);
    },
    pig: function (c) {
      c.beginPath(); c.moveTo(-46, 4); c.bezierCurveTo(-62, -6, -58, 16, -48, 10); stroke(c, '#F28DB0', 4);
      E(c, -4, 14, 46, 34); fl(c, '#FFB3C7');
      R(c, -34, 36, 14, 20, 5); fl(c, '#FFB3C7'); R(c, 16, 36, 14, 20, 5); fl(c, '#FFB3C7');
      C(c, 32, -12, 28); fl(c, '#FFB3C7');
      c.beginPath(); c.moveTo(16, -34); c.lineTo(20, -52); c.lineTo(32, -38); fl(c, '#FF9EBB', 3);
      E(c, 52, -8, 12, 10); fl(c, '#FF9EBB', 3);
      E(c, 49, -8, 2.5, 4); fill(c, '#B0506E'); E(c, 55, -8, 2.5, 4); fill(c, '#B0506E');
      eye(c, 34, -20, 4.5);
    },
    duck: function (c) {
      E(c, -6, 20, 46, 30); fl(c, '#FFD23F');
      C(c, 26, -18, 24); fl(c, '#FFD23F');
      c.beginPath(); c.moveTo(44, -16); c.quadraticCurveTo(64, -14, 58, -4); c.quadraticCurveTo(50, 0, 42, -6); fl(c, '#FF8C1A', 3);
      eye(c, 30, -24, 4.5);
      E(c, -12, 16, 22, 13, 0.2); fl(c, '#F5B800', 3);
      cheek(c, 22, -8);
    },
    // ---------------------------------------------------------------- vehicles
    car: function (c, t) {
      R(c, -56, -18, 112, 38, 14); fl(c, '#FF5A5F');
      c.beginPath(); c.moveTo(-34, -18); c.lineTo(-20, -44); c.lineTo(22, -44); c.lineTo(38, -18); c.closePath(); fl(c, '#FF5A5F');
      c.beginPath(); c.moveTo(-26, -20); c.lineTo(-16, -38); c.lineTo(-2, -38); c.lineTo(-2, -20); c.closePath(); fill(c, '#BDE6FF');
      c.beginPath(); c.moveTo(4, -20); c.lineTo(4, -38); c.lineTo(18, -38); c.lineTo(28, -20); c.closePath(); fill(c, '#BDE6FF');
      C(c, 50, -6, 6); fill(c, '#FFE66D');
      wheel(c, -30, 22, 15); wheel(c, 30, 22, 15);
    },
    bus: function (c) {
      R(c, -60, -42, 120, 66, 14); fl(c, '#FFC23D');
      for (var i = 0; i < 4; i++) { R(c, -50 + i * 26, -32, 20, 22, 4); fill(c, '#BDE6FF'); }
      R(c, -60, 4, 120, 8, 2); fill(c, '#E58E1A');
      C(c, 54, 14, 5); fill(c, '#FFF6B0');
      wheel(c, -34, 26, 14); wheel(c, 34, 26, 14);
    },
    plane: function (c) {
      c.beginPath(); c.moveTo(-8, -4); c.lineTo(-30, -46); c.lineTo(-12, -46); c.lineTo(18, -4); c.closePath(); fl(c, '#3D8BFD', 3);
      c.beginPath(); c.moveTo(-54, -6); c.lineTo(-62, -34); c.lineTo(-46, -34); c.lineTo(-36, -8); c.closePath(); fl(c, '#FF5A5F', 3);
      R(c, -60, -16, 120, 32, 16); fl(c, '#ffffff');
      for (var i = 0; i < 4; i++) { C(c, -28 + i * 17, -3, 5); fill(c, '#7CC6FF'); }
      c.beginPath(); c.moveTo(-6, 6); c.lineTo(-26, 42); c.lineTo(-10, 42); c.lineTo(18, 6); c.closePath(); fl(c, '#2F80ED', 3);
    },
    boat: function (c) {
      c.beginPath(); c.moveTo(-2, 10); c.lineTo(-2, -58); stroke(c, '#7A5230', 5);
      c.beginPath(); c.moveTo(2, -54); c.lineTo(44, 2); c.lineTo(2, 2); c.closePath(); fl(c, '#ffffff', 3);
      c.beginPath(); c.moveTo(-6, -46); c.lineTo(-38, 2); c.lineTo(-6, 2); c.closePath(); fl(c, '#FFD23F', 3);
      c.beginPath(); c.moveTo(-60, 10); c.lineTo(60, 10); c.lineTo(42, 40); c.lineTo(-42, 40); c.closePath(); fl(c, '#E2574C');
      R(c, -48, 18, 96, 6, 3); fill(c, '#ffffff');
    },
    train: function (c) {
      R(c, -58, -40, 46, 62, 8); fl(c, '#3D8BFD');
      R(c, -50, -32, 30, 20, 4); fill(c, '#BDE6FF');
      R(c, -14, -16, 72, 38, 10); fl(c, '#FF5A5F');
      R(c, 24, -40, 16, 24, 3); fl(c, '#33333F', 3);
      R(c, -62, -48, 54, 10, 4); fl(c, '#2F6FD6', 3);
      wheel(c, -40, 26, 13); wheel(c, -4, 26, 13); wheel(c, 34, 26, 13);
    },
    rocket: function (c) {
      c.save(); c.rotate(-Math.PI / 4);
      c.beginPath(); c.moveTo(-12, 44); c.lineTo(0, 64); c.lineTo(12, 44); c.closePath(); fill(c, '#FF9F1C');
      c.beginPath(); c.moveTo(-18, 26); c.lineTo(-36, 46); c.lineTo(-18, 46); c.closePath(); fl(c, '#FF5A5F', 3);
      c.beginPath(); c.moveTo(18, 26); c.lineTo(36, 46); c.lineTo(18, 46); c.closePath(); fl(c, '#FF5A5F', 3);
      c.beginPath(); c.moveTo(0, -64); c.bezierCurveTo(26, -40, 22, 20, 18, 46); c.lineTo(-18, 46); c.bezierCurveTo(-22, 20, -26, -40, 0, -64); c.closePath(); fl(c, '#F1F3F8');
      c.beginPath(); c.moveTo(0, -64); c.bezierCurveTo(12, -54, 16, -44, 17, -36); c.lineTo(-17, -36); c.bezierCurveTo(-16, -44, -12, -54, 0, -64); fl(c, '#FF5A5F', 3);
      C(c, 0, -8, 10); fl(c, '#7CC6FF', 3);
      c.restore();
    },
    helicopter: function (c) {
      R(c, -62, -52, 124, 6, 3); fill(c, '#555566');
      c.beginPath(); c.moveTo(0, -46); c.lineTo(0, -30); stroke(c, '#555566', 5);
      c.beginPath(); c.moveTo(-20, -6); c.lineTo(-60, -10); c.lineTo(-60, 2); c.lineTo(-20, 8); c.closePath(); fl(c, '#22B07D', 3);
      c.beginPath(); c.moveTo(-58, -20); c.lineTo(-58, 10); stroke(c, '#555566', 4);
      E(c, 10, 0, 36, 28); fl(c, '#2EC4B6');
      E(c, 22, -6, 16, 14); fill(c, '#BDE6FF');
      c.beginPath(); c.moveTo(-12, 34); c.lineTo(34, 34); c.moveTo(-2, 26); c.lineTo(-6, 34); c.moveTo(22, 26); c.lineTo(26, 34); stroke(c, '#555566', 4);
    },
    bike: function (c) {
      c.beginPath(); c.arc(-32, 20, 24, 0, Math.PI * 2); stroke(c, '#33333F', 7);
      c.beginPath(); c.arc(32, 20, 24, 0, Math.PI * 2); stroke(c, '#33333F', 7);
      c.beginPath(); c.moveTo(-32, 20); c.lineTo(-6, 20); c.lineTo(20, -10); c.lineTo(-14, -10); c.lineTo(-6, 20);
      c.moveTo(20, -10); c.lineTo(32, 20); c.moveTo(-14, -10); c.lineTo(-32, 20); stroke(c, '#E2574C', 7);
      c.beginPath(); c.moveTo(16, -22); c.lineTo(20, -10); c.moveTo(10, -24); c.lineTo(26, -24); stroke(c, '#33333F', 6);
      R(c, -24, -18, 20, 7, 3); fill(c, '#33333F');
    },
    // ---------------------------------------------------------------- toys
    ball: function (c) {
      C(c, 0, 0, 52); fill(c, '#ffffff');
      var cols = ['#FF5A5F', '#ffffff', '#3D8BFD', '#ffffff', '#FFC93C', '#ffffff'];
      for (var k = 0; k < 6; k++) {
        c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, 52, k * Math.PI / 3 - 0.3, (k + 1) * Math.PI / 3 - 0.3); c.closePath();
        fill(c, cols[k]);
      }
      C(c, 0, 0, 52); line(c);
      C(c, 0, 0, 9); fl(c, '#ffffff', 3);
      shine(c, -18, -24, 12, 7, -0.6);
    },
    balloon: function (c) {
      c.beginPath(); c.moveTo(0, 30); c.quadraticCurveTo(-10, 46, 4, 62); stroke(c, '#7A7A8A', 3);
      E(c, 0, -14, 38, 46); fl(c, '#FF5DA2');
      c.beginPath(); c.moveTo(-6, 34); c.lineTo(6, 34); c.lineTo(0, 28); c.closePath(); fl(c, '#FF5DA2', 3);
      shine(c, -14, -32, 9, 15, 0.5);
    },
    teddy: function (c) {
      C(c, -24, -46, 13); fl(c, '#B5835A'); C(c, 24, -46, 13); fl(c, '#B5835A');
      E(c, 0, 26, 32, 34); fl(c, '#B5835A');
      E(c, 0, 30, 18, 20); fill(c, '#E3C29C');
      E(c, -32, 16, 10, 16, 0.4); fl(c, '#B5835A'); E(c, 32, 16, 10, 16, -0.4); fl(c, '#B5835A');
      E(c, -18, 56, 13, 9); fl(c, '#B5835A'); E(c, 18, 56, 13, 9); fl(c, '#B5835A');
      C(c, 0, -26, 28); fl(c, '#B5835A');
      E(c, 0, -16, 13, 10); fill(c, '#E3C29C');
      E(c, 0, -20, 5, 3.5); fill(c, '#3A2A2A');
      eye(c, -11, -32, 4); eye(c, 11, -32, 4);
      c.beginPath(); c.moveTo(-12, -2); c.lineTo(12, -2); c.lineTo(0, 8); c.closePath(); fill(c, '#FF5A5F');
    },
    kite: function (c) {
      c.beginPath(); c.moveTo(0, 30); c.quadraticCurveTo(10, 46, 0, 58); c.quadraticCurveTo(-8, 64, 4, 66); stroke(c, '#7A7A8A', 3);
      c.fillStyle = '#FF5A5F'; c.beginPath(); c.moveTo(0, 46); c.lineTo(-8, 40); c.lineTo(-8, 52); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(0, -60); c.lineTo(40, -10); c.lineTo(0, 30); c.lineTo(-40, -10); c.closePath(); fl(c, '#FFC93C');
      c.beginPath(); c.moveTo(0, -60); c.lineTo(0, 30); c.lineTo(-40, -10); c.closePath(); fill(c, '#3D8BFD');
      c.beginPath(); c.moveTo(0, -60); c.lineTo(40, -10); c.lineTo(0, 30); c.lineTo(-40, -10); c.closePath(); line(c);
      c.beginPath(); c.moveTo(0, -60); c.lineTo(0, 30); c.moveTo(-40, -10); c.lineTo(40, -10); stroke(c, 'rgba(70,45,35,0.6)', 3);
    },
    drum: function (c) {
      c.beginPath(); c.moveTo(-30, -60); c.lineTo(-8, -26); c.moveTo(34, -60); c.lineTo(12, -26); stroke(c, '#C08A55', 6);
      C(c, -30, -62, 6); fill(c, '#FFE0B0'); C(c, 34, -62, 6); fill(c, '#FFE0B0');
      R(c, -48, -20, 96, 64, 10); fl(c, '#E2574C');
      c.beginPath(); c.moveTo(-48, -10); for (var i = 0; i <= 6; i++) c.lineTo(-48 + i * 16, i % 2 ? 36 : -10); stroke(c, '#FFD23F', 4);
      E(c, 0, -20, 48, 12); fl(c, '#FFF3E0');
    },
    top: function (c) {
      c.beginPath(); c.moveTo(0, -60); c.lineTo(0, -40); stroke(c, '#7A5230', 7);
      c.beginPath(); c.moveTo(-50, -14); c.quadraticCurveTo(0, -60, 50, -14); c.lineTo(4, 54); c.lineTo(-4, 54); c.closePath(); fl(c, '#9B5DE5');
      c.beginPath(); c.moveTo(-42, -6); c.quadraticCurveTo(0, 6, 42, -6); stroke(c, '#FFD23F', 6);
      c.beginPath(); c.moveTo(-26, 18); c.quadraticCurveTo(0, 26, 26, 18); stroke(c, '#2EC4B6', 6);
    },
    blocks: function (c) {
      var cols = ['#FF5A5F', '#3D8BFD', '#FFC93C'];
      var pos = [[-50, 6], [4, 6], [-24, -46]];
      var lab = ['A', 'B', 'C'];
      for (var i = 0; i < 3; i++) {
        R(c, pos[i][0], pos[i][1], 48, 48, 6); fl(c, cols[i]);
        c.font = '800 34px ' + K.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff';
        c.fillText(lab[i], pos[i][0] + 24, pos[i][1] + 26);
      }
    },
    // ---------------------------------------------------------------- misc (letters / counting)
    flower: function (c) {
      c.beginPath(); c.moveTo(0, 14); c.lineTo(0, 62); stroke(c, '#4CAF50', 7);
      E(c, 14, 44, 14, 7, -0.5); fl(c, '#66BB6A', 3);
      for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2; C(c, Math.cos(a) * 24, -10 + Math.sin(a) * 24, 17); fl(c, '#FF7AB6', 3); }
      C(c, 0, -10, 16); fl(c, '#FFD23F', 3);
    },
    icecream: function (c) {
      c.beginPath(); c.moveTo(-28, 4); c.lineTo(0, 62); c.lineTo(28, 4); c.closePath(); fl(c, '#E8B06A');
      c.beginPath(); c.moveTo(-18, 12); c.lineTo(10, 40); c.moveTo(18, 12); c.lineTo(-10, 40); stroke(c, '#C08A55', 3);
      C(c, -14, -6, 20); fl(c, '#FFB3C7'); C(c, 14, -6, 20); fl(c, '#B9F3E4');
      C(c, 0, -28, 22); fl(c, '#FFF1C1');
      C(c, 4, -50, 7); fl(c, '#E53935', 3);
    },
    leaf: function (c) {
      c.beginPath(); c.moveTo(-50, 40); c.quadraticCurveTo(-46, -50, 50, -46); c.quadraticCurveTo(46, 40, -50, 40); c.closePath(); fl(c, '#7AC943');
      c.beginPath(); c.moveTo(-58, 48); c.lineTo(-50, 40); c.quadraticCurveTo(0, 0, 40, -38); stroke(c, '#4E9A2A', 4);
    },
    house: function (c) {
      R(c, 22, -50, 14, 26, 2); fl(c, '#9C6644', 3);
      c.beginPath(); c.moveTo(-60, -10); c.lineTo(0, -58); c.lineTo(60, -10); c.closePath(); fl(c, '#E2574C');
      R(c, -46, -12, 92, 66, 4); fl(c, '#FFE8B6');
      R(c, -12, 14, 24, 40, 6); fl(c, '#9C6644', 3);
      R(c, 18, 2, 20, 18, 3); fl(c, '#9ED8FF', 3); R(c, -38, 2, 20, 18, 3); fl(c, '#9ED8FF', 3);
    },
    bee: function (c) {
      E(c, -6, -30, 14, 20, -0.4); fl(c, '#D6F0FF', 3); E(c, 10, -28, 12, 18, 0.3); fl(c, '#C2E7FF', 3);
      c.beginPath(); c.moveTo(-40, 6); c.lineTo(-54, 10); c.lineTo(-40, 14); fill(c, '#3A3A3A');
      c.save(); E(c, -2, 8, 40, 28); fill(c, '#FFD23F'); c.clip();
      c.fillStyle = '#3A3A3A'; c.fillRect(-22, -30, 11, 70); c.fillRect(0, -30, 11, 70);
      c.restore(); E(c, -2, 8, 40, 28); line(c);
      C(c, 34, 0, 20); fl(c, '#FFD23F');
      eye(c, 38, -4, 6); smile(c, 38, 6, 6);
    },
    umbrella: function (c) {
      c.beginPath(); c.moveTo(0, -40); c.lineTo(0, 44); c.quadraticCurveTo(0, 58, -12, 56); stroke(c, '#7A5230', 6);
      c.beginPath(); c.moveTo(-60, -6); c.quadraticCurveTo(-56, -58, 0, -58); c.quadraticCurveTo(56, -58, 60, -6);
      c.quadraticCurveTo(50, -14, 40, -6); c.quadraticCurveTo(30, -14, 20, -6); c.quadraticCurveTo(10, -14, 0, -6);
      c.quadraticCurveTo(-10, -14, -20, -6); c.quadraticCurveTo(-30, -14, -40, -6); c.quadraticCurveTo(-50, -14, -60, -6); c.closePath();
      fl(c, '#3D8BFD');
      c.beginPath(); c.moveTo(-20, -6); c.quadraticCurveTo(-24, -40, 0, -58); c.moveTo(20, -6); c.quadraticCurveTo(24, -40, 0, -58); stroke(c, '#2F6FD6', 3);
    },
    star: function (c) {
      c.beginPath(); K.starPath(c, 0, 4, 58, 26, 5); fl(c, '#FFCD2E');
      eye(c, -12, 2, 5); eye(c, 12, 2, 5); smile(c, 0, 10, 8);
    },
    cake: function (c) {
      c.beginPath(); c.moveTo(-36, 0); c.lineTo(-28, 50); c.lineTo(28, 50); c.lineTo(36, 0); c.closePath(); fl(c, '#FF9EBB');
      c.beginPath(); c.moveTo(-22, 4); c.lineTo(-18, 46); c.moveTo(0, 4); c.lineTo(0, 46); c.moveTo(22, 4); c.lineTo(18, 46); stroke(c, '#E5708F', 3);
      c.beginPath(); c.moveTo(-42, 2); c.quadraticCurveTo(-46, -40, 0, -40); c.quadraticCurveTo(46, -40, 42, 2); c.closePath(); fl(c, '#FFF1C1');
      C(c, 0, -46, 9); fl(c, '#E53935', 3);
      c.fillStyle = '#7AC943'; C(c, -18, -18, 3); c.fill(); C(c, 16, -22, 3); c.fill(); c.fillStyle = '#3D8BFD'; C(c, 2, -14, 3); c.fill();
    },
    candy: function (c) {
      c.beginPath(); c.moveTo(-28, 0); c.lineTo(-56, -22); c.lineTo(-56, 22); c.closePath(); fl(c, '#9B5DE5');
      c.beginPath(); c.moveTo(28, 0); c.lineTo(56, -22); c.lineTo(56, 22); c.closePath(); fl(c, '#9B5DE5');
      C(c, 0, 0, 32); fl(c, '#FF7AB6');
      c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 1.4); stroke(c, '#ffffff', 6);
    },
    heart: function (c) {
      c.beginPath(); K.heartPath(c, 0, 4, 120); fl(c, '#FF5A7A');
      shine(c, -24, -18, 10, 7, -0.6);
    }
  };

  function draw(c, name, x, y, size, o) {
    var f = items[name];
    if (!f) return;
    c.save();
    c.translate(x, y);
    var s = size / 120;
    c.scale(o && o.flip ? -s : s, s);
    if (o && o.rot) c.rotate(o.rot);
    f(c, o && o.t ? o.t : 0);
    c.restore();
  }

  var sil = {};
  /** Offscreen canvas (size x size) with the item's shape in one flat color. */
  function silhouette(name, size, color) {
    var key = name + '|' + size + '|' + (color || '');
    if (sil[key]) return sil[key];
    var cv = document.createElement('canvas');
    cv.width = cv.height = size;
    var c = cv.getContext('2d');
    draw(c, name, size / 2, size / 2, size * 0.92);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = color || '#4A4560';
    c.fillRect(0, 0, size, size);
    sil[key] = cv;
    return cv;
  }

  return { items: items, draw: draw, silhouette: silhouette, names: Object.keys(items) };
})();
