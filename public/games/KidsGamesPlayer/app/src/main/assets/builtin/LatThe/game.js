/*
 * Lật thẻ con vật — find the pairs of animal cards.
 * Exercises: DOM/CSS flip, HTML audio through the SDK registry, board checkpoint in
 * localStorage (a resumed session restores the same board with found pairs face up).
 */
(function () {
  'use strict';

  var SAVE_VERSION = 1;
  var ANIMALS = ['cat', 'dog', 'duck', 'pig', 'cow', 'frog', 'fish', 'bunny'];
  var LEVELS = [
    { pairs: 3, cols: 3, rows: 2 },
    { pairs: 4, cols: 4, rows: 2 },
    { pairs: 6, cols: 4, rows: 3 }
  ];
  var BOARD_W = 860;
  var BOARD_H = 640;

  var stage = document.getElementById('stage');
  KidsSDK.fitStage(stage, 1280, 720);
  var board = document.getElementById('board');
  var progressEl = document.getElementById('progress');
  var overlay = document.getElementById('overlay');
  var overlayTitle = document.getElementById('overlay-title');
  var overlayArt = document.getElementById('overlay-art');
  var goButton = document.getElementById('go');
  var gi = document.getElementById('gi');
  var shi = document.getElementById('shi');

  var sfx = {
    flip: KidsSDK.audio.createAudio('assets/flip.ogg'),
    match: KidsSDK.audio.createAudio('assets/match.ogg'),
    win: KidsSDK.audio.createAudio('assets/win.ogg')
  };

  var game = {
    level: 0,
    order: null,   // animal name per card position
    matched: [],   // card indices already found
    roundsCompleted: 0
  };
  var open = [];   // indices currently face up and not matched
  var busy = false;
  var cards = [];

  function play(name) {
    KidsSDK.audio.play(sfx[name]);
  }

  function save() {
    KidsSDK.save.write({
      saveSchemaVersion: SAVE_VERSION,
      level: game.level,
      order: game.order,
      matched: game.matched,
      roundsCompleted: game.roundsCompleted
    });
  }

  function validSave(s) {
    if (!s || typeof s.level !== 'number' || s.level < 0 || s.level >= LEVELS.length) return false;
    if (s.order === null || s.order === undefined) return true;
    if (!Array.isArray(s.order) || s.order.length !== LEVELS[s.level].pairs * 2) return false;
    return s.order.every(function (a) { return ANIMALS.indexOf(a) >= 0; }) && Array.isArray(s.matched);
  }

  var saved = KidsSDK.save.read(SAVE_VERSION);
  if (validSave(saved)) {
    game.level = saved.level;
    game.order = saved.order || null;
    game.matched = (saved.matched || []).filter(function (i) { return typeof i === 'number'; });
    game.roundsCompleted = saved.roundsCompleted | 0;
  }
  KidsSDK.onSave(save);
  KidsSDK.onActiveChange(function (active) {
    // While paused, unmatched open cards are turned back so no half-turn is left.
    if (!active) closeOpenCards(0);
  });

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function newOrder(level) {
    var picks = shuffle(ANIMALS.slice()).slice(0, LEVELS[level].pairs);
    return shuffle(picks.concat(picks));
  }

  function renderProgress() {
    progressEl.innerHTML = '';
    LEVELS.forEach(function (_, i) {
      var d = document.createElement('div');
      d.className = 'dot' + (i < game.level ? ' done' : '');
      progressEl.appendChild(d);
    });
  }

  function buildBoard() {
    var cfg = LEVELS[game.level];
    if (!game.order) {
      game.order = newOrder(game.level);
      game.matched = [];
    }
    board.innerHTML = '';
    cards = [];
    open = [];
    busy = false;
    var gap = 22;
    var size = Math.min((BOARD_W - gap * (cfg.cols - 1)) / cfg.cols, (BOARD_H - gap * (cfg.rows - 1)) / cfg.rows);
    var offX = (BOARD_W - (size * cfg.cols + gap * (cfg.cols - 1))) / 2;
    var offY = (BOARD_H - (size * cfg.rows + gap * (cfg.rows - 1))) / 2;
    game.order.forEach(function (animal, i) {
      var c = document.createElement('div');
      c.className = 'card';
      c.style.width = size + 'px';
      c.style.height = size + 'px';
      c.style.left = offX + (i % cfg.cols) * (size + gap) + 'px';
      c.style.top = offY + Math.floor(i / cfg.cols) * (size + gap) + 'px';
      c.innerHTML = '<div class="inner"><div class="face back"></div>' +
        '<div class="face front"><img alt="" draggable="false" src="assets/animals/' + animal + '.svg"></div></div>';
      if (game.matched.indexOf(i) >= 0) c.classList.add('up', 'matched');
      c.addEventListener('pointerup', function (ev) {
        ev.preventDefault();
        onCard(i);
      });
      board.appendChild(c);
      cards.push(c);
    });
    renderProgress();
  }

  function onCard(i) {
    if (!KidsSDK.isActive() || busy) return;
    if (game.matched.indexOf(i) >= 0 || open.indexOf(i) >= 0) return;
    cards[i].classList.add('up');
    open.push(i);
    play('flip');
    if (open.length < 2) return;
    var a = open[0];
    var b = open[1];
    if (game.order[a] === game.order[b]) {
      game.matched.push(a, b);
      open = [];
      cards[a].classList.add('matched');
      cards[b].classList.add('matched');
      setTimeout(function () { play('match'); }, 250);
      cheer();
      save(); // checkpoint after every found pair
      if (game.matched.length === game.order.length) levelDone();
    } else {
      busy = true;
      closeOpenCards(900);
    }
  }

  function closeOpenCards(delay) {
    var toClose = open.slice();
    open = [];
    setTimeout(function () {
      toClose.forEach(function (i) { if (cards[i]) cards[i].classList.remove('up'); });
      busy = false;
    }, delay);
  }

  function cheer() {
    var who = Math.random() < 0.5 ? gi : shi;
    who.classList.add('bounce');
    setTimeout(function () { who.classList.remove('bounce'); }, 320);
  }

  function levelDone() {
    busy = true;
    setTimeout(function () {
      game.level++;
      game.order = null;
      game.matched = [];
      if (game.level >= LEVELS.length) {
        game.level = 0;
        game.roundsCompleted++;
        save();
        play('win');
        renderProgress();
        showOverlay('Giỏi quá!', true);
      } else {
        save();
        buildBoard();
      }
    }, 1100);
  }

  function showOverlay(title, finished) {
    overlayTitle.textContent = title;
    overlayArt.classList.toggle('hidden', !finished);
    goButton.innerHTML = finished ? '<span class="replay-icon"></span>' : '<span class="play-icon"></span>';
    goButton.setAttribute('aria-label', finished ? 'Chơi lại' : 'Chơi');
    overlay.classList.remove('hidden');
  }

  goButton.addEventListener('click', function () {
    if (!KidsSDK.isActive()) return;
    overlay.classList.add('hidden');
    buildBoard();
    save();
  });

  renderProgress();
  showOverlay('Lật thẻ con vật', false);
})();
