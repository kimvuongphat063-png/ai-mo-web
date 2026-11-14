/*
 * Chạm bong bóng — Canvas 2D + Web Audio sample game for Kids Games Player.
 * Tap the rising balloons. Every 5 pops earns a star; 20 pops finish the round.
 * There is no losing: balloons that escape simply float away.
 */
(function () {
  'use strict';

  var W = 1280;
  var H = 720;
  var GOAL = 20;
  var SAVE_VERSION = 1;
  var COLORS = ['#E8534A', '#F2B630', '#3D8BD9', '#3BAE5A', '#E5679E', '#8E6BD1', '#F28C38'];

  var canvas = document.getElementById('game');
  var view = KidsSDK.fitCanvas(canvas, W, H, 2);
  var ctx = view.ctx;

  // ------------------------------------------------------------------ assets
  var images = {};
  var sounds = {};
  var music = null; // { source }
  var musicWanted = false;

  function loadImage(name, src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { images[name] = im; resolve(); };
      im.onerror = function () { resolve(); }; // a missing picture must not stop the game
      im.src = src;
    });
  }

  function loadSound(name, src) {
    return KidsSDK.audio.loadBuffer(src).then(function (buf) { sounds[name] = buf; }, function () { /* silent fallback */ });
  }

  var ready = Promise.all([
    loadImage('sky', 'assets/sky.webp'),
    loadImage('gi', 'assets/gi.webp'),
    loadImage('giCheer', 'assets/gi-cheer.webp'),
    loadImage('shi', 'assets/shi.webp'),
    loadImage('shiCheer', 'assets/shi-cheer.webp'),
    loadSound('pop', 'assets/pop.ogg'),
    loadSound('chime', 'assets/chime.ogg'),
    loadSound('music', 'assets/music.ogg')
  ]);

  function playSound(name, rate, volume) {
    if (sounds[name]) KidsSDK.audio.playBuffer(sounds[name], { rate: rate || 1, volume: volume === undefined ? 1 : volume });
  }

  function startMusic() {
    musicWanted = true;
    if (music || !sounds.music || !KidsSDK.isActive()) return;
    var actx = KidsSDK.audio.context();
    if (!actx) return;
    var src = actx.createBufferSource();
    src.buffer = sounds.music;
    src.loop = true;
    var gain = actx.createGain();
    gain.gain.value = 0.35;
    src.connect(gain);
    gain.connect(KidsSDK.audio.output());
    src.start();
    music = { source: src };
  }

  function stopMusic() {
    musicWanted = false;
    if (music) {
      try { music.source.stop(); } catch (e) { /* already stopped */ }
      music = null;
    }
  }

  // ------------------------------------------------------------------ state
  var state = {
    screen: 'start', // start | play | done
    popped: 0,
    roundsCompleted: 0,
    totalPopped: 0,
    balloons: [],
    particles: [],
    spawnIn: 0,
    cheerFor: 0,
    time: 0
  };

  // Sprites are rendered once per color for a cheap draw loop.
  var sprites = {};
  function balloonSprite(color) {
    if (sprites[color]) return sprites[color];
    var c = document.createElement('canvas');
    c.width = 140;
    c.height = 190;
    var g = c.getContext('2d');
    g.strokeStyle = 'rgba(80,80,80,0.9)';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(70, 150);
    g.quadraticCurveTo(60, 170, 72, 188);
    g.stroke();
    var grad = g.createRadialGradient(52, 50, 8, 70, 70, 75);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.18, color);
    grad.addColorStop(1, shade(color, -0.25));
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(70, 75, 56, 68, 0, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = 'rgba(60,40,40,0.55)';
    g.stroke();
    g.fillStyle = shade(color, -0.2);
    g.beginPath();
    g.moveTo(62, 142);
    g.lineTo(78, 142);
    g.lineTo(70, 154);
    g.closePath();
    g.fill();
    sprites[color] = c;
    return c;
  }

  function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255;
    var gg = (n >> 8) & 255;
    var b = n & 255;
    var f = function (v) { return Math.max(0, Math.min(255, Math.round(v + v * amount))); };
    return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(b) + ')';
  }

  function spawnBalloon() {
    var size = 0.8 + Math.random() * 0.5;
    state.balloons.push({
      x: 260 + Math.random() * (W - 520),
      y: H + 120,
      vy: -(70 + Math.random() * 70),
      phase: Math.random() * Math.PI * 2,
      size: size,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
  }

  function pop(b) {
    for (var i = 0; i < 16; i++) {
      var a = (Math.PI * 2 * i) / 16;
      var sp = 160 + Math.random() * 160;
      state.particles.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.6, color: b.color });
    }
    playSound('pop', 0.85 + Math.random() * 0.35);
    state.popped++;
    state.totalPopped++;
    if (state.popped % 5 === 0) {
      state.cheerFor = 1.4;
      playSound('chime', 1, 0.8);
      save();
    }
    if (state.popped >= GOAL) finishRound();
  }

  function finishRound() {
    state.screen = 'done';
    state.roundsCompleted++;
    state.balloons = [];
    state.cheerFor = 999;
    stopMusic();
    playSound('chime', 1.25, 1);
    save();
  }

  function startRound(resume) {
    if (!resume) state.popped = 0;
    state.screen = 'play';
    state.balloons = [];
    state.particles = [];
    state.spawnIn = 0.2;
    state.cheerFor = 0;
    startMusic();
    save();
  }

  // ------------------------------------------------------------------ save / restore
  function save() {
    KidsSDK.save.write({
      saveSchemaVersion: SAVE_VERSION,
      roundsCompleted: state.roundsCompleted,
      totalPopped: state.totalPopped,
      inRound: state.screen === 'play',
      popped: state.popped
    });
  }

  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved) {
    state.roundsCompleted = saved.roundsCompleted | 0;
    state.totalPopped = saved.totalPopped | 0;
    if (saved.inRound && saved.popped > 0 && saved.popped < GOAL) state.popped = saved.popped | 0;
  }

  KidsSDK.onSave(function () { save(); });
  KidsSDK.onActiveChange(function (active) {
    if (active && state.screen === 'play' && musicWanted) startMusic();
    if (!active && music) {
      // The SDK suspends the AudioContext; restart the loop cleanly on resume.
      try { music.source.stop(); } catch (e) { /* ignore */ }
      music = null;
    }
  });

  // ------------------------------------------------------------------ input
  var PLAY_BTN = { x: W / 2, y: 470, r: 92 };

  canvas.addEventListener('pointerdown', function (ev) {
    ev.preventDefault();
    if (!KidsSDK.isActive()) return;
    var p = view.toLogical(ev.clientX, ev.clientY);
    if (state.screen !== 'play') {
      var dx = p.x - PLAY_BTN.x;
      var dy = p.y - PLAY_BTN.y;
      if (dx * dx + dy * dy <= (PLAY_BTN.r + 30) * (PLAY_BTN.r + 30)) {
        KidsSDK.audio.context(); // created inside a real tap, helps browsers unlock audio
        startRound(state.screen === 'start' && state.popped > 0);
      }
      return;
    }
    for (var i = state.balloons.length - 1; i >= 0; i--) {
      var b = state.balloons[i];
      var rx = 60 * b.size;
      var ry = 72 * b.size;
      var nx = (p.x - b.x) / rx;
      var ny = (p.y - b.y) / ry;
      if (nx * nx + ny * ny <= 1.25) {
        state.balloons.splice(i, 1);
        pop(b);
        return;
      }
    }
  });

  // ------------------------------------------------------------------ loop
  function update(dt) {
    state.time += dt;
    if (state.cheerFor > 0 && state.cheerFor < 999) state.cheerFor = Math.max(0, state.cheerFor - dt);
    if (state.screen === 'play') {
      state.spawnIn -= dt;
      if (state.spawnIn <= 0 && state.balloons.length < 7) {
        spawnBalloon();
        state.spawnIn = 0.7 + Math.random() * 0.6;
      }
    }
    for (var i = state.balloons.length - 1; i >= 0; i--) {
      var b = state.balloons[i];
      b.y += b.vy * dt;
      b.phase += dt * 1.6;
      b.x += Math.sin(b.phase) * 22 * dt;
      if (b.y < -160) state.balloons.splice(i, 1);
    }
    for (var j = state.particles.length - 1; j >= 0; j--) {
      var pt = state.particles[j];
      pt.life -= dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 400 * dt;
      if (pt.life <= 0) state.particles.splice(j, 1);
    }
  }

  function drawCover(img) {
    if (!img) {
      ctx.fillStyle = '#9AD7FF';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    var s = Math.max(W / img.width, H / img.height);
    var w = img.width * s;
    var h = img.height * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  function drawCharacter(img, x, bottom, height, flip) {
    if (!img) return;
    var w = img.width * height / img.height;
    ctx.save();
    ctx.translate(x, bottom);
    if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -w / 2, -height, w, height);
    ctx.restore();
  }

  function drawStars(cx, y, earned, total) {
    for (var i = 0; i < total; i++) {
      var x = cx + (i - (total - 1) / 2) * 70;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      for (var k = 0; k < 10; k++) {
        var a = -Math.PI / 2 + k * Math.PI / 5;
        var r = k % 2 === 0 ? 28 : 12;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = i < earned ? '#F5B84B' : 'rgba(255,255,255,0.65)';
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#7A5A20';
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPlayButton(label) {
    var pulse = 1 + Math.sin(state.time * 3) * 0.04;
    ctx.save();
    ctx.translate(PLAY_BTN.x, PLAY_BTN.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.arc(4, 8, PLAY_BTN.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#227C78';
    ctx.beginPath();
    ctx.arc(0, 0, PLAY_BTN.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    if (label === 'replay') {
      ctx.lineWidth = 18;
      ctx.strokeStyle = '#fff';
      ctx.arc(0, 0, 44, -0.4, Math.PI * 1.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(52, -42);
      ctx.lineTo(56, 4);
      ctx.lineTo(16, -14);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.moveTo(-28, -44);
      ctx.lineTo(48, 0);
      ctx.lineTo(-28, 44);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawTitle(text, y, size) {
    ctx.font = '800 ' + size + 'px system-ui, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = '#ffffff';
    ctx.strokeText(text, W / 2, y);
    ctx.fillStyle = '#185C59';
    ctx.fillText(text, W / 2, y);
  }

  function render() {
    drawCover(images.sky);
    var cheering = state.cheerFor > 0;
    drawCharacter(cheering ? images.giCheer : images.gi, 150, H - 10, 330, false);
    drawCharacter(cheering ? images.shiCheer : images.shi, W - 140, H - 10, 300, false);

    for (var i = 0; i < state.balloons.length; i++) {
      var b = state.balloons[i];
      var sp = balloonSprite(b.color);
      var w = 140 * b.size;
      var h = 190 * b.size;
      ctx.drawImage(sp, b.x - w / 2, b.y - 75 * b.size, w, h);
    }
    for (var j = 0; j < state.particles.length; j++) {
      var p = state.particles[j];
      ctx.globalAlpha = Math.max(0, p.life / 0.6);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (state.screen === 'play') {
      drawStars(W / 2, 54, Math.floor(state.popped / 5), GOAL / 5);
    } else if (state.screen === 'start') {
      drawTitle('Chạm bong bóng', 200, 92);
      if (state.roundsCompleted > 0) drawStars(W / 2, 320, Math.min(state.roundsCompleted, 5), 5);
      drawPlayButton('play');
    } else {
      drawTitle('Giỏi quá!', 200, 110);
      drawStars(W / 2, 320, GOAL / 5, GOAL / 5);
      drawPlayButton('replay');
    }
  }

  ready.then(function () {
    KidsSDK.loop(update, render);
  });
})();
