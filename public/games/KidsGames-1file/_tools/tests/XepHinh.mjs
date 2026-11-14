// XepHinh scripted test: drag puzzle pieces with real touches.
export async function run(t) {
  const { page, sleep } = t;
  const tileXY = (p, l) => [76 + p * 192 + 85, 104 + l * 178 + 78];
  async function waitReady() { for (let k = 0; k < 40; k++) { if ((await t.info()).ready) return true; await sleep(100); } return false; }
  async function solve(shotAt) {
    for (let guard = 0; guard < 12; guard++) {
      const info = await t.info();
      const q = info.pieces.filter((x) => !x.placed).pop();
      if (!q) break;
      const pts = [];
      const ex = q.tx + (Math.random() - 0.5) * 60, ey = q.ty + (Math.random() - 0.5) * 60; // land within ~42 px
      for (let k = 0; k <= 12; k++) pts.push([q.x + (ex - q.x) * k / 12, q.y + (ey - q.y) * k / 12]);
      await page.drag(pts, 14);
      await sleep(200);
      if (shotAt && guard === shotAt) await t.shot('04_half');
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
  t.check('picture decoded', await waitReady());
  await sleep(300);
  await t.shot('03_2x2_start');
  let info = await t.info();
  // a piece dropped far from its place slides back
  const q = info.pieces[info.pieces.length - 1];
  const far = [q.tx > 640 ? q.tx - 220 : q.tx + 220, q.ty];
  await page.drag([[q.x, q.y], [(q.x + far[0]) / 2, (q.y + far[1]) / 2], far], 30);
  await sleep(900);
  info = await t.info();
  const q2 = info.pieces.find((p) => p.tx === q.tx && p.ty === q.ty);
  t.check('a piece dropped in the wrong place slides home', !q2.placed && Math.abs(q2.x - far[0]) > 60);
  info = await solve(2);
  t.check('2x2 solved', info.finish);
  await sleep(2100);
  t.check('celebration', await t.isDone());
  await t.shot('05_2x2_done');
  await t.button('next');
  await waitReady();
  info = await solve();
  t.check('3x2 solved', info.finish && info.li === 1);
  await sleep(2100);
  await t.button('next');
  await waitReady();
  await sleep(200);
  await t.shot('06_3x3_start');
  info = await solve(4);
  t.check('3x3 solved', info.finish && info.li === 2);
  await sleep(2100);
  await t.button('grid');
  for (const p of [3, 5]) {
    [x, y] = tileXY(p, 2);
    await page.tap(x, y);
    await waitReady();
    info = await solve();
    t.check(`picture ${p + 1} 3x3 solved`, info.finish);
    await sleep(2100);
    await t.button('grid');
  }
  await t.shot('07_menu_stars');
  [x, y] = tileXY(1, 2);
  await page.tap(x, y);
  await waitReady();
  await sleep(5600);
  await t.shot('08_hint');
  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.done['0-0'] && save.done['0-1'] && save.done['0-2'] && save.done['3-2'] && save.done['5-2'], JSON.stringify(save));
  for (const [w, h, p, l] of [[800, 360, 2, 1], [2400, 1080, 4, 2]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = tileXY(p, l);
    await page.tap(x, y);
    await waitReady();
    info = await solve(2);
    await t.shot(`09_${w}x${h}`);
    t.check(`${w}x${h}: solved`, info.finish);
    await sleep(2100);
  }
  await page.size(1280, 720);
}
