/*
 * MẪU GAME — "Bim bim cho Shi" (template for new Kids Games Player games).
 *
 * This is a complete, working mini game. To make a new game, keep the structure and replace
 * the parts marked  >>> THAY GAMEPLAY <<<  . Everything else (loading, saving, pause, audio,
 * resize, start/replay screens) already follows the player contract:
 *   - KidsSDK.loop(update, render): update() is not called while the game is inactive.
 *   - Sounds go through KidsSDK.audio (registry) so pause/mute always works.
 *   - Progress is a small JSON with saveSchemaVersion, written at checkpoints, never per frame.
 *   - Logical size 1280x720, letterboxed; pointer coordinates via view.toLogical().
 */
(function () {
  'use strict';

  var W = 1280;
  var H = 720;
  var GOAL = 10;           // >>> THAY GAMEPLAY <<< how many actions finish a round
  var SAVE_VERSION = 1;    // bump when the save shape changes, and migrate in readSave()

  var canvas = document.getElementById('game');
  var view = KidsSDK.fitCanvas(canvas, W, H, 2);
  var ctx = view.ctx;

  // ------------------------------------------------------------------ assets (all local)
  var images = {};
  var sounds = {};

  function loadImage(name, src) {
    return new Promise(function (resolve) {
      var im = new Image();
      im.onload = function () { images[name] = im; resolve(); };
      im.onerror = function () { resolve(); };
      im.src = src;
    });
  }

  function loadSound(name, src) {
    return KidsSDK.audio.loadBuffer(src).then(function (b) { sounds[name] = b; }, function () {});
  }

  var ready = Promise.all([
    loadImage('shiOpen', 'assets/shi-open.webp'),
    loadImage('shiMunch', 'assets/shi-munch.webp'),
    loadImage('shiCheer', 'assets/shi-cheer.webp'),
    loadImage('bag', 'assets/bag.webp'),
    loadImage('puff1', 'assets/puff-1.webp'),
    loadImage('puff2', 'assets/puff-2.webp'),
    loadImage('puff3', 'assets/puff-3.webp'),
    loadSound('crunch', 'assets/crunch.ogg'),
    loadSound('chime', 'assets/chime.ogg')
  ]);

  function playSound(name, rate) {
    if (sounds[name]) KidsSDK.audio.playBuffer(sounds[name], { rate: rate || 1 });
  }

  // ------------------------------------------------------------------ state
  var MOUTH = { x: 1010, y: 300 }; // where Shi's mouth is on the 1280x720 stage
  var PLAY_BTN = { x: W / 2 - 120, y: 430, r: 90 };
  var state = {
    screen: 'start',  // start | play | done
    fed: 0,
    totalFed: 0,
    rounds: 0,
    puffs: [],        // >>> THAY GAMEPLAY <<< your game objects
    flying: [],
    munchFor: 0,
    time: 0
  };

  // ------------------------------------------------------------------ save (checkpoints)
  function readSave() {
    return KidsSDK.save.read(SAVE_VERSION, function migrate(old) {
      // Example migration hook: convert an older save into the current shape.
      return null;
    });
  }

  function save() {
    KidsSDK.save.write({
      saveSchemaVersion: SAVE_VERSION,
      totalFed: state.totalFed,
      rounds: state.rounds,
      inRound: state.screen === 'play',
      fed: state.fed
    });
  }

  var saved = readSave();
  if (saved) {
    state.totalFed = saved.totalFed | 0;
    state.rounds = saved.rounds | 0;
    if (saved.inRound && saved.fed > 0 && saved.fed < GOAL) state.fed = saved.fed | 0;
  }
  KidsSDK.onSave(save); // the player asks for a save when leaving / pausing

  // ------------------------------------------------------------------ gameplay
  // >>> THAY GAMEPLAY <<< spawn / hit / score logic of your game
  function spawnPuff() {
    state.puffs.push({
      x: 160 + Math.random() * 560,
      y: 140 + Math.random() * 330,
      kind: 1 + Math.floor(Math.random() * 3),
      bob: Math.random() * Math.PI * 2,
      born: state.time
    });
  }

  function feed(p) {
    state.flying.push({ kind: p.kind, sx: p.x, sy: p.y, t: 0 });
  }

  function arrive() {
    if (state.screen !== 'play') return; // a puff still in the air when the round ended
    state.fed++;
    state.totalFed++;
    state.munchFor = 0.6;
    playSound('crunch', 0.9 + Math.random() * 0.2);
    if (state.fed % 5 === 0) save();
    if (state.fed >= GOAL) {
      state.screen = 'done';
      state.rounds++;
      state.puffs = [];
      state.flying = [];
      playSound('chime');
      save();
    }
  }

  function startRound(resume) {
    if (!resume) state.fed = 0;
    state.screen = 'play';
    state.puffs = [];
    state.flying = [];
    save();
  }

  // ------------------------------------------------------------------ input
  canvas.addEventListener('pointerdown', function (ev) {
    ev.preventDefault();
    if (!KidsSDK.isActive()) return;    // never react while paused behind a native screen
    var pt = view.toLogical(ev.clientX, ev.clientY);
    if (state.screen !== 'play') {
      var dx = pt.x - PLAY_BTN.x;
      var dy = pt.y - PLAY_BTN.y;
      if (dx * dx + dy * dy < (PLAY_BTN.r + 30) * (PLAY_BTN.r + 30)) {
        KidsSDK.audio.context();
        startRound(state.screen === 'start' && state.fed > 0);
      }
      return;
    }
    for (var i = state.puffs.length - 1; i >= 0; i--) {
      var p = state.puffs[i];
      var px = p.x;
      var py = p.y + Math.sin(p.bob) * 10;
      if ((pt.x - px) * (pt.x - px) + (pt.y - py) * (pt.y - py) < 85 * 85) {
        state.puffs.splice(i, 1);
        feed(p);
        return;
      }
    }
  });

  // ------------------------------------------------------------------ update / render
  function update(dt) {
    state.time += dt;
    state.munchFor = Math.max(0, state.munchFor - dt);
    if (state.screen === 'play' && state.puffs.length < 3 && state.flying.length === 0) spawnPuff();
    state.puffs.forEach(function (p) { p.bob += dt * 2.2; });
    for (var i = state.flying.length - 1; i >= 0; i--) {
      var f = state.flying[i];
      f.t += dt / 0.55;
      if (f.t >= 1) {
        state.flying.splice(i, 1);
        arrive();
      }
    }
  }

  function drawImg(img, cx, cy, h, alpha) {
    if (!img) return;
    var w = img.width * h / img.height;
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
    ctx.globalAlpha = 1;
  }

  function text(t, x, y, size, color) {
    ctx.font = '800 ' + size + 'px system-ui, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = size / 6;
    ctx.strokeStyle = '#fff';
    ctx.strokeText(t, x, y);
    ctx.fillStyle = color || '#185C59';
    ctx.fillText(t, x, y);
  }

  function drawButton(replay) {
    var s = 1 + Math.sin(state.time * 3) * 0.04;
    ctx.save();
    ctx.translate(PLAY_BTN.x, PLAY_BTN.y);
    ctx.scale(s, s);
    ctx.fillStyle = '#227C78';
    ctx.beginPath();
    ctx.arc(0, 0, PLAY_BTN.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    if (replay) {
      ctx.lineWidth = 16;
      ctx.beginPath();
      ctx.arc(0, 0, 42, -0.4, Math.PI * 1.55);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(50, -40);
      ctx.lineTo(54, 4);
      ctx.lineTo(14, -14);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.moveTo(-26, -42);
      ctx.lineTo(46, 0);
      ctx.lineTo(-26, 42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function drawProgress() {
    for (var i = 0; i < GOAL; i++) {
      var x = W / 2 - (GOAL - 1) * 28 + i * 56 - 120;
      drawImg(images.puff2, x, 50, 40, i < state.fed ? 1 : 0.25);
    }
  }

  function render() {
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFF6E6');
    g.addColorStop(1, '#FFD9A0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    drawImg(images.bag, 120, 580, 250);
    var shi = state.screen === 'done' ? images.shiCheer : (state.munchFor > 0 ? images.shiMunch : images.shiOpen);
    drawImg(shi, 1040, 430, 560);

    state.puffs.forEach(function (p) {
      var appear = Math.min(1, (state.time - p.born) * 4);
      drawImg(images['puff' + p.kind], p.x, p.y + Math.sin(p.bob) * 10, 110 * appear);
    });
    state.flying.forEach(function (f) {
      var t = f.t;
      var x = f.sx + (MOUTH.x - f.sx) * t;
      var y = f.sy + (MOUTH.y - f.sy) * t - Math.sin(t * Math.PI) * 160;
      drawImg(images['puff' + f.kind], x, y, 110 * (1 - t * 0.5));
    });

    if (state.screen === 'play') {
      drawProgress();
    } else if (state.screen === 'start') {
      text('Bim bim cho Shi', W / 2 - 120, 200, 84);
      drawButton(false);
    } else {
      text('Shi no rồi!', W / 2 - 120, 200, 96);
      drawButton(true);
    }
  }

  ready.then(function () { KidsSDK.loop(update, render); });
})();
