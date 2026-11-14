// NoiDiem scripted test: drag dot to dot with real touches; taps; wrong dots ignored.
export async function run(t) {
  const { page, sleep } = t;
  const tileXY = (k) => { const x0 = (1280 - (4 * 236 + 3 * 34)) / 2, y0 = 30 + (690 - (3 * 162 + 2 * 30)) / 2; return [x0 + (k % 4) * 270 + 118, y0 + Math.floor(k / 4) * 192 + 81]; };
  async function dragAll(info, wobble) {
    const pts = [];
    for (let k = 0; k < info.dots.length; k++) {
      const a = info.dots[k], b = info.dots[(k + 1) % info.dots.length];
      for (let s = 0; s < 6; s++) pts.push([a[0] + (b[0] - a[0]) * s / 6 + (Math.random() - 0.5) * wobble, a[1] + (b[1] - a[1]) * s / 6 + (Math.random() - 0.5) * wobble]);
      if (k === info.dots.length - 1) break;
    }
    pts.push(info.dots[info.dots.length - 1]);
    await page.drag(pts, 10);
  }
  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  await t.shot('02_menu');
  let [x, y] = tileXY(0);
  await page.tap(x, y);
  await sleep(400);
  let info = await t.info();
  t.check('12 figures, dots 5..20', info.counts.length === 12 && info.counts[0] === 5 && info.counts[11] === 20, JSON.stringify(info.counts));
  await t.shot('03_star_start');
  // touching dot 3 first does nothing
  await page.tap(info.dots[2][0], info.dots[2][1]);
  await sleep(100);
  t.check('a wrong dot is ignored (no penalty)', (await t.info()).next === 0);
  // star: drag 1 -> 5 in one stroke
  await dragAll(info, 20);
  await sleep(300);
  info = await t.info();
  t.check('star joined by dragging', info.closing);
  await sleep(900);
  await t.shot('04_star_revealed');
  await sleep(2400);
  t.check('celebration', await t.isDone());
  await t.button('next');
  // house: tap the dots one by one
  info = await t.info();
  for (let k = 0; k < info.n; k++) {
    await page.tap(info.dots[k][0] + 10, info.dots[k][1] - 8);
    if (k === 3) await t.shot('05_house_taps');
  }
  await sleep(300);
  t.check('house joined by tapping', (await t.info()).closing);
  await sleep(3400);
  await t.button('grid');
  // all other figures by dragging, lifting the finger in the middle once
  for (let k = 2; k < 12; k++) {
    [x, y] = tileXY(k);
    await page.tap(x, y);
    await sleep(400);
    info = await t.info();
    const half = Math.floor(info.n / 2);
    await dragAll({ dots: info.dots.slice(0, half + 1) }, 18);
    await sleep(100);
    const mid = (await t.info()).next;
    await dragAll({ dots: info.dots.slice(half) }, 18);
    await sleep(1200);
    info = await t.info();
    if (k === 6 || k === 11 || k === 9) await t.shot(`06_${info.id}`);
    t.check(`${info.id} (${info.n} dots) joined, finger lifted at ${mid} and resumed`, info.closing);
    await sleep(2400);
    await t.button('grid');
  }
  await t.shot('07_menu_done');
  // hint
  [x, y] = tileXY(5);
  await page.tap(x, y);
  await sleep(5300);
  await t.shot('08_hint');
  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.done.every((v) => v === 1), JSON.stringify(save));
  for (const [w, h, k] of [[800, 360, 6], [2400, 1080, 10]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = tileXY(k);
    await page.tap(x, y);
    await sleep(400);
    info = await t.info();
    await dragAll(info, 16);
    await sleep(1300);
    await t.shot(`09_${w}x${h}`);
    t.check(`${w}x${h}: ${info.id} joined`, (await t.info()).closing);
    await sleep(2200);
  }
  await page.size(1280, 720);
}
