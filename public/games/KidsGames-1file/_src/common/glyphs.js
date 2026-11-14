/*
 * GLYPHS — print letters (kindergarten style) and digits as ordered strokes for T (trace.js).
 * Units: caps from y=30 (top) to y=130 (baseline); lowercase x-height 70..130, ascenders from 30,
 * descenders to 168; marks above (breve, circumflex) are separate strokes traced last; the horn of
 * Ơ/Ư and the bar of Đ/đ too. Arcs: E cx cy rx ry a0 a1, angles in degrees, 0 = right, 90 = down,
 * decreasing angle = counter-clockwise on screen. Round letters start at the upper right and run
 * counter-clockwise; strokes go top to bottom, left to right.
 * Lowercase uses the single-storey "a" and "g" of Vietnamese handwriting/tracing books.
 */
var GLYPHS = (function () {
  'use strict';
  var O = 'E50 80 42 50 -60 -420';
  var CIRC = 'M28 8 L50 -14 L72 8';          // ^ above caps
  var BREVE = 'E50 -8 22 16 180 0';          // ˘ above caps
  var o = 'E50 100 28 30 -60 -420';
  var ring = 'E50 100 28 30 -30 -390';
  var circ = 'M30 46 L50 26 L70 46';         // ^ above lowercase
  var breve = 'E50 32 18 13 180 0';
  var A = ['M50 30 L14 130', 'M50 30 L86 130', 'M27 96 L73 96'];
  var D = ['M22 30 L22 130', 'M22 30 L44 30 E44 80 40 50 -90 90 L22 130'];
  var E = ['M24 30 L24 130', 'M24 30 L78 30', 'M24 80 L70 80', 'M24 130 L78 130'];
  var U = ['M18 30 L18 96 E50 96 32 34 180 0 L82 30'];
  var a = [ring, 'M78 70 L78 130'];
  var d = [ring, 'M78 30 L78 130'];
  var e = ['M22 100 L78 100 E50 100 28 30 0 -320'];
  var u = ['M22 70 L22 102 E50 102 28 28 180 0 L78 70', 'M78 70 L78 130'];

  var upper = {
    'A': A,
    'Ă': A.concat([BREVE]),
    'Â': A.concat([CIRC]),
    'B': ['M22 30 L22 130', 'M22 30 L50 30 E50 54 24 24 -90 90 L22 78', 'M22 78 L54 78 E54 104 26 26 -90 90 L22 130'],
    'C': ['E56 80 40 50 -40 -320'],
    'D': D,
    'Đ': D.concat(['M6 80 L42 80']),
    'E': E,
    'Ê': E.concat(['M29 8 L51 -14 L73 8']),
    'G': ['E56 80 40 50 -40 -355', 'M64 84 L96 84'],
    'H': ['M20 30 L20 130', 'M80 30 L80 130', 'M20 80 L80 80'],
    'I': ['M50 30 L50 130'],
    'K': ['M22 30 L22 130', 'M78 30 L24 84', 'M42 66 L80 130'],
    'L': ['M24 30 L24 130', 'M24 130 L76 130'],
    'M': ['M14 30 L14 130', 'M14 30 L50 104 L86 30', 'M86 30 L86 130'],
    'N': ['M18 30 L18 130', 'M18 30 L82 130', 'M82 30 L82 130'],
    'O': [O],
    'Ô': [O, CIRC],
    'Ơ': [O, 'M84 50 Q102 46 100 24'],
    'P': ['M22 30 L22 130', 'M22 30 L52 30 E52 56 26 26 -90 90 L22 82'],
    'Q': [O, 'M62 104 L90 136'],
    'R': ['M22 30 L22 130', 'M22 30 L52 30 E52 56 26 26 -90 90 L22 82', 'M46 82 L82 130'],
    'S': ['E50 55 28 25 -30 -270 E50 105 30 25 -90 150'],
    'T': ['M14 30 L86 30', 'M50 30 L50 130'],
    'U': U,
    'Ư': U.concat(['M84 36 Q102 34 100 14']),
    'V': ['M14 30 L50 130 L86 30'],
    'X': ['M16 30 L84 130', 'M84 30 L16 130'],
    'Y': ['M14 30 L50 80', 'M86 30 L50 80 L50 130']
  };

  var lower = {
    'a': a,
    'ă': a.concat([breve]),
    'â': a.concat([circ]),
    'b': ['M22 30 L22 130', 'E50 100 28 30 190 530'],
    'c': ['E52 100 28 30 -40 -320'],
    'd': d,
    'đ': d.concat(['M62 48 L94 48']),
    'e': e,
    'ê': e.concat([circ]),
    'g': [ring, 'M78 70 L78 148 E58 148 20 20 0 150'],
    'h': ['M22 30 L22 130', 'E48 98 26 28 180 360 L74 130'],
    'i': ['M50 70 L50 130', 'D50 44'],
    'k': ['M24 30 L24 130', 'M72 70 L26 108', 'M42 95 L76 130'],
    'l': ['M50 30 L50 130'],
    'm': ['M14 70 L14 130', 'E32 90 18 20 180 360 L50 130', 'E68 90 18 20 180 360 L86 130'],
    'n': ['M20 70 L20 130', 'E48 98 28 28 180 360 L76 130'],
    'o': [o],
    'ô': [o, circ],
    'ơ': [o, 'M72 80 Q88 74 86 54'],
    'p': ['M22 70 L22 168', 'E50 100 28 30 190 530'],
    'q': [ring, 'M78 70 L78 168'],
    'r': ['M24 70 L24 130', 'E50 98 26 28 180 300'],
    's': ['E50 85 22 15 -20 -270 E50 115 24 15 -90 160'],
    't': ['M44 44 L44 112 E60 112 16 18 180 80', 'M24 70 L68 70'],
    'u': u,
    'ư': u.concat(['M80 74 Q96 72 94 52']),
    'v': ['M18 70 L50 130 L82 70'],
    'x': ['M20 70 L80 130', 'M80 70 L20 130'],
    'y': ['M18 70 L50 130', 'M82 70 L34 168']
  };

  var digits = {
    '0': ['E50 80 32 50 -90 -450'],
    '1': ['M30 54 L56 30 L56 130'],
    '2': ['E50 56 27 26 200 390 L22 130 L80 130'],
    '3': ['E50 54 24 24 210 450 E50 104 27 26 -90 150'],
    '4': ['M58 30 L18 100 L84 100', 'M66 62 L66 130'],
    '5': ['M28 30 L28 78 E50 100 28 30 -140 150', 'M28 30 L76 30'],
    '6': ['M72 32 Q28 40 22 102 E50 102 28 28 180 -170'],
    '7': ['M20 30 L80 30 L40 130'],
    '8': ['E50 53 22 23 -45 -270 E50 103 27 27 -90 270 E50 53 22 23 90 -45'],
    '9': ['E50 54 26 24 -20 -360 L76 130']
  };

  var cache = {};
  /**
   * Draws a glyph from its own strokes (so pictures always match what is traced), centered on
   * (cx, cy); h = cap height in px (100 glyph units).
   */
  function draw(c, ch, cx, cy, h, color, lw) {
    var st = cache[ch];
    if (!st) st = cache[ch] = T.compile(upper[ch] || lower[ch] || digits[ch], 3);
    var placed = T.fit(st, h / 100, { x: cx, y: cy, w: 0, h: 0 });
    c.save();
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = lw || h * 0.17;
    for (var i = 0; i < placed.length; i++) {
      var p = placed[i].pts;
      if (placed[i].dot) {
        c.beginPath();
        c.arc(p[0], p[1], c.lineWidth * 0.62, 0, Math.PI * 2);
        c.fill();
        continue;
      }
      T.polyline(c, p, 0, p.length / 2 - 1);
      c.stroke();
    }
    c.restore();
  }

  return {
    draw: draw,
    UPPER: 'A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y'.split(' '),
    LOWER: 'a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y'.split(' '),
    DIGITS: '0 1 2 3 4 5 6 7 8 9'.split(' '),
    upper: upper,
    lower: lower,
    digits: digits,
    get: function (ch) { return upper[ch] || lower[ch] || digits[ch]; }
  };
})();
