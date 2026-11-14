/* Opens one game full screen: play.html?g=<slug>.
   All pages of a GitHub Pages site share one origin, so games that use the same localStorage key
   (every SDK game uses "kgp.save.v1") would overwrite each other's progress. The game is therefore
   loaded into a same-origin iframe whose Storage methods are scoped to "kgp-web/<slug>/".
   If that is not possible (old browser, file://), the game opens directly instead. */
(function () {
  'use strict';
  var msg = document.getElementById('msg');
  var slug = new URLSearchParams(location.search).get('g');
  var game = ((window.KGP && window.KGP.games) || []).filter(function (g) { return g.slug === slug; })[0];

  function show(html) { msg.innerHTML = html; }
  if (!game) {
    show('Không tìm thấy game này.<a href="./#choi">Về danh sách game</a>');
    return;
  }
  document.title = game.title + ' · AI Mở Studio';

  var folder = new URL(game.dir.split('/').map(encodeURIComponent).join('/') + '/', location.href).href;
  var entry = folder + 'index.html';
  function openDirect() { location.replace(entry); }

  // Runs inside the game document before any game script. Kept ES5 for old browsers.
  function scopeStorage(ns) {
    var P = window.Storage && window.Storage.prototype;
    if (!P) return;
    var get = P.getItem, set = P.setItem, del = P.removeItem, key = P.key;
    var lenDesc = Object.getOwnPropertyDescriptor(P, 'length');
    if (!lenDesc || !lenDesc.get) return;
    var len = lenDesc.get;
    function own(st) {
      var out = [], n = len.call(st), k, i;
      for (i = 0; i < n; i++) {
        k = key.call(st, i);
        if (k !== null && k.indexOf(ns) === 0) out.push(k.slice(ns.length));
      }
      return out;
    }
    P.getItem = function (k) { return get.call(this, ns + k); };
    P.setItem = function (k, v) { return set.call(this, ns + k, v); };
    P.removeItem = function (k) { return del.call(this, ns + k); };
    P.key = function (i) { var a = own(this); return i >= 0 && i < a.length ? a[i] : null; };
    P.clear = function () { var a = own(this), i; for (i = 0; i < a.length; i++) del.call(this, ns + a[i]); };
    Object.defineProperty(P, 'length', { configurable: true, get: function () { return own(this).length; } });
  }

  if (!('srcdoc' in document.createElement('iframe')) || !window.fetch || location.protocol === 'file:') {
    openDirect();
    return;
  }

  fetch(entry, { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    })
    .then(function (html) {
      var inject = '<base href="' + folder.replace(/"/g, '%22') + '">' +
        '<script>(' + scopeStorage.toString() + ')(' + JSON.stringify('kgp-web/' + game.slug + '/') + ');<\/script>';
      var head = /<head(\s[^>]*)?>/i.exec(html);
      var at;
      if (head) {
        at = head.index + head[0].length;
      } else {
        var doctype = /<!doctype[^>]*>/i.exec(html);
        at = doctype ? doctype.index + doctype[0].length : 0;
      }
      var frame = document.createElement('iframe');
      frame.id = 'game';
      frame.title = game.title;
      frame.setAttribute('allow', 'fullscreen; autoplay');
      frame.setAttribute('allowfullscreen', '');
      frame.addEventListener('load', function () {
        msg.style.display = 'none';
        try { frame.contentWindow.focus(); } catch (e) { /* ignore */ }
      });
      frame.srcdoc = html.slice(0, at) + inject + html.slice(at);
      document.body.appendChild(frame);
    })
    .catch(openDirect);
})();
