// BongBongMau scripted test: tap moving bubbles with real touches.
export async function run(t) {
  const { page, sleep } = t;
  const tileXY = (l, k) => [230 + k * 166 + 70, 112 + l * 184 + 70];
  async function tapTargets(n, shotAt) {
    let got = 0;
    for (let guard = 0; guard < 400 && got < n; guard++) {
      const info = await t.info();
      if (info.finish) break;
      const b = info.bubbles.filter((b) => b.val === info.target && b.y > 140 && b.y < 660).sort((a, b) => b.y - a.y)[0];
      if (!b) { await sleep(250); continue; }
      await page.tap(b.x, b.y - 4, 40);
      await sleep(120);
      const after = await t.info();
      if (after.score > info.score) got++;
      if (shotAt && after.score === shotAt) { await t.shot('04_progress'); shotAt = 0; }
    }
    return t.info();
  }

  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  await t.shot('02_menu');
  let [x, y] = tileXY(0, 0);
  await page.tap(x, y);
  await sleep(700);
  await t.shot('03_play_red');
  // a wrong bubble: no penalty
  let info;
  for (let k = 0; k < 40; k++) {
    info = await t.info();
    const w = info.bubbles.find((b) => b.val !== info.target && b.y > 140 && b.y < 640);
    if (w) {
      await page.tap(w.x, w.y, 40);
      await sleep(100);
      const a = await t.info();
      t.check('wrong bubble: wobble only, score unchanged', a.score === info.score && a.bubbles.length >= info.bubbles.length - 1);
      break;
    }
    await sleep(300);
  }
  info = await tapTargets(10, 5);
  t.check('red: 10 right bubbles -> target complete', info.finish && info.score === 10);
  await sleep(1700);
  t.check('celebration shown', await t.isDone());
  await t.shot('05_red_done');
  await t.button('next');
  info = await t.info();
  t.check('next -> blue target', info.lv === 0 && info.ti === 1);
  info = await tapTargets(10);
  t.check('blue complete', info.finish);
  await sleep(1700);
  await t.button('grid');
  // shapes: triangle
  [x, y] = tileXY(1, 2);
  await page.tap(x, y);
  await sleep(1500);
  await t.shot('06_shapes_triangle');
  info = await tapTargets(10);
  t.check('shape level (triangle) complete', info.finish && info.lv === 1);
  await sleep(1700);
  await t.button('grid');
  // numbers: 4
  [x, y] = tileXY(2, 3);
  await page.tap(x, y);
  await sleep(1500);
  await t.shot('07_numbers_4');
  info = await tapTargets(3);
  await sleep(5200);
  await t.shot('08_hint');
  info = await tapTargets(10);
  t.check('number level (4) complete', info.finish && info.lv === 2);
  await sleep(1700);
  await t.button('grid');
  await t.shot('09_menu_stars');

  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.done['0-0'] && save.done['0-1'] && save.done['1-2'] && save.done['2-3'], JSON.stringify(save));
  for (const [w, h, l, k] of [[800, 360, 0, 3], [2400, 1080, 1, 0]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = tileXY(l, k);
    await page.tap(x, y);
    await sleep(1500);
    info = await tapTargets(4);
    await t.shot(`10_${w}x${h}`);
    info = await tapTargets(10);
    t.check(`${w}x${h}: target complete`, info.finish);
    await sleep(1600);
  }
  await page.size(1280, 720);
}
