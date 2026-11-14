// GhepBong scripted test: real touch drags of things onto shadows.
export async function run(t) {
  const { page, sleep } = t;
  const tileXY = (th, l) => [260 + l * 236 + 100, 92 + th * 138 + 58];
  async function solve(shotName) {
    for (let guard = 0; guard < 8; guard++) {
      const info = await t.info();
      const th = info.things.find((x) => !x.placed);
      if (!th) break;
      const sl = info.slots.find((s) => s.name === th.name);
      const pts = [];
      for (let k = 0; k <= 12; k++) pts.push([th.x + (sl.x - th.x) * k / 12 + (Math.random() - 0.5) * 10, th.y + (sl.y - th.y) * k / 12 + (Math.random() - 0.5) * 10]);
      await page.drag(pts, 14);
      await sleep(250);
      if (shotName && guard === 0) await t.shot(shotName);
    }
    await sleep(200);
    return t.info();
  }
  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  await t.shot('02_menu');
  let [x, y] = tileXY(0, 0);
  await page.tap(x, y);
  await sleep(400);
  await t.shot('03_animals_2');
  let info = await t.info();
  // wrong shadow first
  const th = info.things[0];
  const wrong = info.slots.find((s) => s.name !== th.name);
  const pts = [];
  for (let k = 0; k <= 10; k++) pts.push([th.x + (wrong.x - th.x) * k / 10, th.y + (wrong.y - th.y) * k / 10]);
  await page.drag(pts, 14);
  await sleep(700);
  info = await t.info();
  const back = info.things.find((x) => x.name === th.name);
  t.check('wrong shadow: the thing slides back home, nothing filled', !back.placed && Math.abs(back.y - 560) < 2 && info.slots.every((s) => !s.filled));
  info = await solve('04_first_snap');
  t.check('animals 2: solved', info.finish);
  await sleep(1900);
  t.check('celebration', await t.isDone());
  await t.shot('05_done');
  await t.button('next');
  info = await solve();
  t.check('animals 3: solved', info.finish && info.li === 1);
  await sleep(1900);
  await t.button('grid');
  [x, y] = tileXY(0, 3);
  await page.tap(x, y);
  await sleep(400);
  info = await t.info();
  t.check('level 5 contains look-alike shadows (cat + dog)', info.slots.some((s) => s.name === 'cat') && info.slots.some((s) => s.name === 'dog'));
  await t.shot('06_animals_5');
  info = await solve();
  t.check('animals 5: solved', info.finish);
  await sleep(1900);
  for (let th2 = 1; th2 < 4; th2++) {
    await t.button('grid');
    [x, y] = tileXY(th2, 2);
    await page.tap(x, y);
    await sleep(400);
    await t.shot(`07_theme${th2}_4`);
    info = await solve();
    t.check(`theme ${th2} level 4: solved`, info.finish);
    await sleep(1900);
  }
  await t.button('grid');
  await t.shot('08_menu_stars');
  [x, y] = tileXY(3, 3);
  await page.tap(x, y);
  await sleep(5600);
  await t.shot('09_hint');
  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.done['0-0'] && save.done['0-1'] && save.done['0-3'] && save.done['1-2'] && save.done['2-2'] && save.done['3-2'], JSON.stringify(save));
  for (const [w, h, a, b] of [[800, 360, 1, 3], [2400, 1080, 2, 3]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = tileXY(a, b);
    await page.tap(x, y);
    await sleep(400);
    info = await solve(`10_${w}x${h}`);
    t.check(`${w}x${h}: solved`, info.finish);
    await sleep(1800);
  }
  await page.size(1280, 720);
}
