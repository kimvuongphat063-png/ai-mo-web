// DanGo scripted test: real taps, two fingers at once, glissando, follow-the-light songs.
export async function run(t) {
  const { page, sleep } = t;
  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  await t.shot('02_menu');
  await page.tap(290, 360);
  await sleep(400);
  let info = await t.info();
  t.check('free play opens', info.mode === 'free' && (await t.screen()) === 'play');
  for (const k of info.keys) { await page.tap(k[0], k[1], 40); }
  info = await t.info();
  t.check('each of the 8 bars plays', info.played === 8, `played ${info.played}`);
  // two fingers at the same time
  let two;
  if (t.remote) {
    await page.tap(info.keys[0][0], info.keys[0][1], 40);
    await page.tap(info.keys[4][0], info.keys[4][1], 40);
    two = (await t.info()).played;
    t.notRun('two fingers -> two notes', 'multi-touch cannot be injected into WebView 69 over DevTools (passed on desktop Chrome)');
  } else {
    await page.touch('touchStart', [{ x: info.keys[0][0], y: info.keys[0][1], id: 1 }, { x: info.keys[4][0], y: info.keys[4][1], id: 2 }]);
    await sleep(80);
    await page.touch('touchEnd', []);
    await sleep(80);
    two = (await t.info()).played;
    t.check('two fingers -> two notes', two === 10, `played ${two}`);
  }
  // glissando: slide over all bars
  const pts = [];
  for (let x = info.keys[0][0]; x <= info.keys[7][0]; x += 16) pts.push([x, 470]);
  await page.drag(pts, 12);
  await sleep(150);
  await t.shot('03_free_glissando');
  const gl = (await t.info()).played - two;
  t.check('glissando across the bars plays every bar once', gl === 8, `played ${gl}`);
  await t.button('grid');
  // follow the light: twinkle
  await page.tap(660, 245);
  await sleep(400);
  info = await t.info();
  t.check('song opens', info.mode === 'follow' && info.song === 'twinkle');
  await t.shot('04_follow_start');
  const wrongKey = (info.next + 3) % 8;
  const before = info.played;
  await page.tap(info.keys[wrongKey][0], info.keys[wrongKey][1], 40);
  await sleep(80);
  const after = await t.info();
  t.check('another bar still sounds, the light waits', after.pos === 0 && after.played === before + 1);
  for (let guard = 0; guard < 80; guard++) {
    info = await t.info();
    if (info.finish) break;
    await page.tap(info.keys[info.next][0], info.keys[info.next][1] + 60, 40);
    if (info.pos === 12) await t.shot('05_follow_progress');
  }
  info = await t.info();
  t.check('twinkle played to the end', info.finish && info.pos === info.len);
  await sleep(1800);
  t.check('celebration', await t.isDone());
  await t.shot('06_song_done');
  // the other songs
  for (let s = 1; s < 5; s++) {
    await t.button('next');
    for (let guard = 0; guard < 80; guard++) {
      info = await t.info();
      if (info.finish) break;
      await page.tap(info.keys[info.next][0], info.keys[info.next][1] - 40, 30);
    }
    info = await t.info();
    t.check(`song ${info.song} finished`, info.finish);
    await sleep(1800);
  }
  await t.button('grid');
  await t.shot('07_menu_stars');
  await page.tap(660, 245);
  await sleep(5300);
  await t.shot('08_hint');
  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('songs restored after reload', ['twinkle', 'jacques', 'rowboat', 'farm', 'joy'].every((k) => save.songs[k] === 1), JSON.stringify(save));
  for (const [w, h] of [[800, 360], [2400, 1080]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    await page.tap(890, 245);
    await sleep(400);
    for (let guard = 0; guard < 60; guard++) {
      info = await t.info();
      if (info.finish) break;
      await page.tap(info.keys[info.next][0], info.keys[info.next][1], 30);
      if (info.pos === 6) await t.shot(`09_${w}x${h}`);
    }
    t.check(`${w}x${h}: song finished`, (await t.info()).finish);
    await sleep(1800);
  }
  await page.size(1280, 720);
}
