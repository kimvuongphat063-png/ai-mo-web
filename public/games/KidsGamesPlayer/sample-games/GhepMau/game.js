/*
 * Ghép màu — drag each shape onto the slot with the same shape and color.
 * Slots show the shape outline too, so the game never depends on color alone.
 * Exercises: pointer drag + pointercancel, many local assets, JSON fetch, checkpoint save.
 */
(function () {
  'use strict';

  var SAVE_VERSION = 1;
  var stage = document.getElementById('stage');
  var view = KidsSDK.fitStage(stage, 1280, 720);
  var slotsEl = document.getElementById('slots');
  var piecesEl = document.getElementById('pieces');
  var progressEl = document.getElementById('progress');
  var overlay = document.getElementById('overlay');
  var overlayTitle = document.getElementById('overlay-title');
  var goButton = document.getElementById('go');
  var gi = document.getElementById('gi');
  var shi = document.getElementById('shi');

  var data = null;
  var sounds = {};
  var level = 0;
  var roundsCompleted = 0;
  var placed = 0;
  var drag = null; // { piece, pointerId, dx, dy }
  var playing = false;

  function loadSound(name) {
    return KidsSDK.audio.loadBuffer('assets/' + name + '.ogg').then(function (b) { sounds[name] = b; }, function () {});
  }

  function play(name, volume) {
    if (sounds[name]) KidsSDK.audio.playBuffer(sounds[name], { volume: volume || 1 });
  }

  function save() {
    KidsSDK.save.write({ saveSchemaVersion: SAVE_VERSION, level: level, roundsCompleted: roundsCompleted });
  }

  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (saved) {
    level = Math.max(0, saved.level | 0);
    roundsCompleted = saved.roundsCompleted | 0;
  }
  KidsSDK.onSave(save);
  KidsSDK.onActiveChange(function (active) {
    if (!active) cancelDrag();
  });

  function bounce(el) {
    el.classList.add('bounce');
    setTimeout(function () { el.classList.remove('bounce'); }, 300);
  }

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function renderProgress() {
    progressEl.innerHTML = '';
    for (var i = 0; i < data.levels.length; i++) {
      var d = document.createElement('div');
      d.className = 'dot' + (i < level ? ' done' : '');
      progressEl.appendChild(d);
    }
  }

  function buildLevel() {
    if (level >= data.levels.length) level = 0;
    var shapes = data.levels[level].shapes;
    slotsEl.innerHTML = '';
    piecesEl.innerHTML = '';
    placed = 0;
    renderProgress();
    gi.src = 'assets/gi-think.webp';
    shuffle(shapes.slice()).forEach(function (shape) {
      var slot = document.createElement('div');
      slot.className = 'slot';
      slot.dataset.shape = shape;
      // Tinted card on white so the color reads true over any background.
      slot.style.background = 'linear-gradient(' + data.colors[shape] + '66, ' + data.colors[shape] + '66), #fff';
      var img = document.createElement('img');
      img.src = 'assets/shapes/' + shape + '-slot.svg';
      img.alt = '';
      img.draggable = false;
      slot.appendChild(img);
      slotsEl.appendChild(slot);
    });
    // Pieces on a loose grid in the lower part of the room, in random order.
    var cells = [];
    for (var r = 0; r < 2; r++) {
      for (var c = 0; c < 5; c++) cells.push({ x: 300 + c * 150 + (r % 2) * 60, y: 330 + r * 160 });
    }
    shuffle(cells);
    shuffle(shapes.slice()).forEach(function (shape, i) {
      var p = document.createElement('img');
      p.className = 'piece';
      p.src = 'assets/shapes/' + shape + '.svg';
      p.alt = '';
      p.draggable = false;
      p.dataset.shape = shape;
      p.dataset.homeX = String(cells[i].x + Math.round(Math.random() * 20));
      p.dataset.homeY = String(cells[i].y + Math.round(Math.random() * 20));
      moveTo(p, +p.dataset.homeX, +p.dataset.homeY);
      p.addEventListener('pointerdown', onDown);
      piecesEl.appendChild(p);
    });
  }

  function moveTo(p, x, y) {
    p.style.left = x + 'px';
    p.style.top = y + 'px';
  }

  function onDown(ev) {
    if (!KidsSDK.isActive() || drag || !playing) return;
    var p = ev.currentTarget;
    if (p.classList.contains('placed')) return;
    ev.preventDefault();
    var pt = view.toLogical(ev.clientX, ev.clientY);
    drag = { piece: p, pointerId: ev.pointerId, dx: pt.x - parseFloat(p.style.left), dy: pt.y - parseFloat(p.style.top) };
    p.classList.remove('returning');
    p.classList.add('dragging');
    try { p.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
    p.addEventListener('pointermove', onMove);
    p.addEventListener('pointerup', onUp);
    p.addEventListener('pointercancel', cancelDrag);
    p.addEventListener('lostpointercapture', onLost);
  }

  function onMove(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    var pt = view.toLogical(ev.clientX, ev.clientY);
    moveTo(drag.piece, pt.x - drag.dx, pt.y - drag.dy);
  }

  function slotUnder(p) {
    var pr = p.getBoundingClientRect();
    var cx = pr.left + pr.width / 2;
    var cy = pr.top + pr.height / 2;
    var slots = slotsEl.children;
    for (var i = 0; i < slots.length; i++) {
      var r = slots[i].getBoundingClientRect();
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) return slots[i];
    }
    return null;
  }

  function onUp(ev) {
    if (!drag || ev.pointerId !== drag.pointerId) return;
    var p = drag.piece;
    endDrag();
    var slot = slotUnder(p);
    if (slot && !slot.classList.contains('filled') && slot.dataset.shape === p.dataset.shape) {
      var sr = slot.getBoundingClientRect();
      var tl = view.toLogical(sr.left + sr.width / 2, sr.top + sr.height / 2);
      p.classList.add('placed');
      moveTo(p, tl.x - 60, tl.y - 60);
      slot.classList.add('filled');
      placed++;
      play('snap');
      bounce(shi);
      if (placed === slotsEl.children.length) levelDone();
    } else {
      if (slot) {
        play('try-again', 0.7);
        gi.src = 'assets/gi-think.webp';
        bounce(gi);
      }
      returnHome(p);
    }
  }

  function onLost() {
    if (drag) cancelDrag();
  }

  function returnHome(p) {
    p.classList.add('returning');
    moveTo(p, +p.dataset.homeX, +p.dataset.homeY);
  }

  function endDrag() {
    if (!drag) return;
    var p = drag.piece;
    p.classList.remove('dragging');
    p.removeEventListener('pointermove', onMove);
    p.removeEventListener('pointerup', onUp);
    p.removeEventListener('pointercancel', cancelDrag);
    p.removeEventListener('lostpointercapture', onLost);
    drag = null;
  }

  /** Pointer cancelled, capture lost or game paused: the piece goes back, never sticks mid-air. */
  function cancelDrag() {
    if (!drag) return;
    var p = drag.piece;
    endDrag();
    returnHome(p);
  }

  function levelDone() {
    gi.src = 'assets/gi-clap.webp';
    shi.src = 'assets/shi-cheer.webp';
    bounce(gi);
    bounce(shi);
    level++;
    save();
    renderProgress();
    if (level >= data.levels.length) {
      roundsCompleted++;
      level = 0;
      save();
      play('win');
      playing = false;
      setTimeout(function () { showOverlay('Giỏi quá!', true); }, 900);
    } else {
      play('snap');
      setTimeout(function () {
        shi.src = 'assets/shi-clap.webp';
        buildLevel();
      }, 1100);
    }
  }

  function showOverlay(title, replay) {
    overlayTitle.textContent = title;
    goButton.innerHTML = replay ? '<span class="replay-icon"></span>' : '<span class="play-icon"></span>';
    goButton.setAttribute('aria-label', replay ? 'Chơi lại' : 'Chơi');
    overlay.classList.remove('hidden');
  }

  goButton.addEventListener('click', function () {
    if (!KidsSDK.isActive() || !data) return;
    KidsSDK.audio.context();
    overlay.classList.add('hidden');
    shi.src = 'assets/shi-clap.webp';
    playing = true;
    buildLevel();
    save();
  });

  Promise.all([
    fetch('levels.json').then(function (r) {
      if (!r.ok) throw new Error('levels.json HTTP ' + r.status);
      return r.json();
    }),
    loadSound('snap'),
    loadSound('try-again'),
    loadSound('win')
  ]).then(function (results) {
    data = results[0];
    renderProgress();
    showOverlay('Ghép màu', false);
  }).catch(function (e) {
    overlayTitle.textContent = 'Ghép màu';
    if (window.console) console.error('cannot start: ' + e.message);
  });
})();
