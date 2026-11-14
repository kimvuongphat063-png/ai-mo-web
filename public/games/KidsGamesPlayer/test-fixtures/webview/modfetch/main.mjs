// Test fixture (not a game): exercises module loading, fetch, Range/HEAD, storage and CSP.
import { answer } from './util.mjs';

const r = window.__results;
r.module = answer === 42;
r.origin = location.origin;
r.css = getComputedStyle(document.getElementById('probe')).color === 'rgb(1, 2, 3)';

async function attempt(name, fn) {
  try {
    r[name] = await fn();
  } catch (e) {
    r[name] = 'err:' + (e && e.message);
  }
}

async function run() {
  await attempt('fetchJson', async () => (await (await fetch('data.json')).json()).ok === true);
  await attempt('unicode', async () => {
    const res = await fetch('t%E1%BA%A3i%20v%E1%BB%81%2Bplus.json');
    return res.ok && (await res.json()).name === 'unicode';
  });
  await attempt('range', async () => {
    const res = await fetch('range.txt', { headers: { Range: 'bytes=10-19' } });
    const text = await res.text();
    return res.status + '|' + text + '|' + res.headers.get('Content-Range');
  });
  await attempt('suffix', async () => {
    const res = await fetch('range.txt', { headers: { Range: 'bytes=-5' } });
    return res.status + '|' + (await res.text());
  });
  await attempt('unsatisfiable', async () => {
    const res = await fetch('range.txt', { headers: { Range: 'bytes=999-' } });
    return res.status + '|' + res.headers.get('Content-Range');
  });
  await attempt('head', async () => {
    const res = await fetch('range.txt', { method: 'HEAD' });
    return res.status + '|' + res.headers.get('Content-Length');
  });
  await attempt('missing', async () => (await fetch('missing.png')).status);
  await attempt('encodedTraversal', async () => (await fetch('..%2f..%2fetc%2fhosts')).status);
  await attempt('dotTraversal', async () => (await fetch('%2e%2e/%2e%2e/etc/hosts')).status);
  await attempt('post', async () => (await fetch('data.json', { method: 'POST', body: 'x' })).status);
  await attempt('nosniff', async () => (await fetch('data.json')).headers.get('X-Content-Type-Options'));
  await attempt('storage', async () => {
    localStorage.setItem('k', 'v');
    return localStorage.getItem('k') === 'v';
  });
  await attempt('dataImg', async () => {
    const img = document.getElementById('dataimg');
    if (!img.complete) await new Promise((ok, no) => { img.onload = ok; img.onerror = no; });
    return img.naturalWidth === 1;
  });
  await attempt('blobImg', async () => {
    const blob = new Blob([await (await fetch('pixel.png')).arrayBuffer()], { type: 'image/png' });
    const url = URL.createObjectURL(blob);
    const im = new Image();
    await new Promise((ok, no) => { im.onload = ok; im.onerror = no; im.src = url; });
    return im.naturalWidth === 1;
  });
  await attempt('dataHtmlFetch', async () => {
    const res = await fetch('data:text/html,<b>x</b>');
    return 'status:' + res.status;
  });
  try {
    // eslint-disable-next-line no-eval
    eval('1 + 1');
    r.evalBlocked = false;
  } catch (e) {
    r.evalBlocked = true;
  }
  r.done = true;
}

run();
