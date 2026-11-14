// ToNet scripted test (real touch events through CDP).
export async function run(t) {
  const { page, sleep } = t;
  const tileXY = (k) => { const x0 = (1280 - (4 * 236 + 3 * 34)) / 2, y0 = 30 + (690 - (3 * 162 + 2 * 30)) / 2; return [x0 + (k % 4) * 270 + 118, y0 + Math.floor(k / 4) * 192 + 81]; };
  const noisy = (pts, every, noise) => {
    const out = [];
    for (let i = 0; i < pts.length / 2; i += every) out.push([pts[i * 2] + (Math.random() - 0.5) * noise, pts[i * 2 + 1] + (Math.random() - 0.5) * noise]);
    out.push([pts[pts.length - 2], pts[pts.length - 1]]);
    return out;
  };
  await t.debugShot('debug');
  await t.fresh();
  await t.shot('t01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  for (let k = 0; k < 11; k++) {
    const [x, y] = tileXY(k);
    await page.tap(x, y);
    await sleep(400);
    const info = await t.info();
    await page.drag(noisy(info.pts, 2, 34), 8);
    await sleep(300);
    const done = (await t.info()).done;
    if (k === 4) await t.shot('t02_wave_done');
    await sleep(1800);
    t.check(`level ${k + 1} traced by finger`, done && (await t.isDone()));
    await t.button('grid');
  }
  // maze: branch -> dead end -> auto back, then the main road
  let [x, y] = tileXY(11);
  await page.tap(x, y);
  await sleep(400);
  let info = await t.info();
  const main = info.pts;
  const b0 = info.branches[0];
  const path = [];
  for (let i = 0; i < main.length / 2; i += 2) { path.push([main[i * 2], main[i * 2 + 1]]); if (Math.abs(main[i * 2] - 430) < 5 && Math.abs(main[i * 2 + 1] - 450) < 6) break; }
  for (let j = 0; j < b0.length / 2; j += 2) path.push([b0[j * 2], b0[j * 2 + 1]]);
  path.push([b0[b0.length - 2], b0[b0.length - 1]]);
  await page.drag(path, 8);
  await sleep(150);
  await t.shot('t03_maze_dead_end');
  info = await t.info();
  t.check('maze: dead end sends the rabbit back by itself', info.retreat || info.mode === -1);
  await sleep(2500);
  info = await t.info();
  t.check('maze: back at the junction', info.mode === -1 && !info.retreat);
  let s0 = 0, bd = 1e9;
  for (let i = 0; i < main.length / 2; i++) { const d = Math.hypot(main[i * 2] - 430, main[i * 2 + 1] - 450); if (d < bd) { bd = d; s0 = i; } }
  const rest = [];
  for (let i = s0; i < main.length / 2; i += 2) rest.push([main[i * 2], main[i * 2 + 1]]);
  rest.push([main[main.length - 2], main[main.length - 1]]);
  await page.drag(rest, 8);
  await sleep(1800);
  t.check('maze finished', (await t.info()).done && (await t.isDone()));
  await t.shot('t04_maze_done');
  await t.button('grid');
  await t.shot('t05_menu_all_stars');
  // shortcut must fail on the spiral
  [x, y] = tileXY(7);
  await page.tap(x, y);
  await sleep(400);
  info = await t.info();
  const p = info.pts;
  const line = [];
  for (let i = 0; i <= 30; i++) line.push([p[0] + (p[p.length - 2] - p[0]) * i / 30, p[1] + (p[p.length - 1] - p[1]) * i / 30]);
  await page.drag(line, 10);
  await sleep(200);
  t.check('spiral: straight shortcut does not finish', !(await t.info()).done);
  await sleep(5000);
  await t.shot('t06_hint');
  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.done.every((v) => v === 1), JSON.stringify(save));
  for (const [w, h, k] of [[800, 360, 6], [2400, 1080, 9]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = tileXY(k);
    await page.tap(x, y);
    await sleep(400);
    info = await t.info();
    await page.drag(noisy(info.pts, 2, 30), 8);
    await sleep(500);
    t.check(`${w}x${h}: level ${k + 1} traced`, (await t.info()).done);
    await t.shot(`t07_${w}x${h}`);
    await sleep(1500);
  }
  await page.size(1280, 720);
}
