// ToMau scripted test: real taps, pixel checks, fill timing, undo, eraser, replay after reload.
export async function run(t) {
  const { page, sleep } = t;
  const tile = async (k) => page.eval(`(function(){var r=K.grid(6,3,262,262,46,40,{x:0,y:0,w:1280,h:720})[${k}];return [r.x+r.w/2,r.y+r.h/2];})()`);
  const px = (x, y) => page.eval(`__kg.pixel(${x},${y})`);
  const P = { x: 196, y: 52, s: 616 };
  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const same = (a, b) => a && Math.abs(a[0] - b[0]) < 3 && Math.abs(a[1] - b[1]) < 3 && Math.abs(a[2] - b[2]) < 3;
  async function waitReady() { for (let k = 0; k < 50; k++) { if ((await t.info()).ready) return true; await sleep(100); } return false; }

  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> picture list', (await t.screen()) === 'pick');
  await t.shot('02_pick');
  let [x, y] = await tile(0);
  await page.tap(x, y);
  t.check('picture 1 decoded and ready', await waitReady());
  await t.shot('03_paint_blank');
  let info = await t.info();
  const pal = info.pal;
  // red background (outside the cloud frame of picture 1)
  await page.tap(pal[0].x, pal[0].y);
  const bg = [P.x + 12, P.y + 12];
  await page.tap(bg[0], bg[1]);
  await sleep(150);
  t.check('tap fills the background red', same(await px(bg[0], bg[1]), hex('#F44336')));
  info = await t.info();
  const firstMs = info.lastFillMs;
  // blue inside the cloud (center top, inside the frame)
  await page.tap(pal[6].x, pal[6].y);
  const inner = [P.x + P.s * 0.5, P.y + P.s * 0.09];
  const before = await px(inner[0], inner[1]);
  await page.tap(inner[0], inner[1]);
  await sleep(150);
  const afterBlue = await px(inner[0], inner[1]);
  t.check('second region filled blue, background stays red', same(afterBlue, hex('#1E63D6')) && same(await px(bg[0], bg[1]), hex('#F44336')), JSON.stringify({ before, afterBlue }));
  await t.shot('04_two_fills');
  // undo
  await t.button('undo');
  t.check('undo restores the previous color', same(await px(inner[0], inner[1]), before) && (await t.info()).ops === 1);
  // eraser on the background
  await t.button('eraser');
  await page.tap(bg[0], bg[1]);
  await sleep(150);
  t.check('eraser turns the area white again', same(await px(bg[0], bg[1]), [255, 255, 255]));
  // many fills, random colors, random places (timing)
  for (let k = 0; k < 36; k++) {
    const c = k % 12;
    await page.tap(pal[c].x, pal[c].y, 30);
    await page.tap(P.x + 30 + Math.random() * (P.s - 60), P.y + 30 + Math.random() * (P.s - 60), 30);
  }
  await sleep(300);
  info = await t.info();
  const budget = t.remote ? 150 : 30;   // brief budget 150 ms on a weak phone; desktop must be far below
  t.check(`flood fill time per tap < ${budget} ms (${t.remote ? 'Android 8 emulator WebView 69' : 'desktop Chrome'})`, info.maxFillMs < budget,
    `first ${firstMs.toFixed(1)} ms, max ${info.maxFillMs.toFixed(1)} ms over ${info.ops} fills (budget on a weak phone: 150 ms)`);
  await t.shot('05_colored');
  const probe = [P.x + P.s * 0.5, P.y + P.s * 0.5];
  const probeColor = await px(probe[0], probe[1]);
  const opsBefore = info.ops;
  // hint after idle on a fresh picture
  await t.button('check');
  await sleep(1300);
  t.check('done -> frame + celebration', await t.isDone());
  await t.shot('06_done_frame');
  await t.button('next');
  t.check('next picture opens', (await t.info()).pic === 1 && (await waitReady()));
  await sleep(5600);
  await t.shot('07_hint');
  await t.button('grid');
  await t.shot('08_pick_with_thumb');

  await t.pauseChecks();
  // reload: ops are replayed
  await page.goto(t.url);
  await t.button('play');
  [x, y] = await tile(0);
  await page.tap(x, y);
  await waitReady();
  info = await t.info();
  const replayed = await px(probe[0], probe[1]);
  t.check('after reload the picture is rebuilt from saved taps', info.ops === opsBefore && same(replayed, probeColor) && info.finished[0] === 1,
    `ops ${info.ops}/${opsBefore}, replay ${info.lastFillMs.toFixed(1)} ms per tap`);
  await t.shot('09_after_reload');

  for (const [w, h, k] of [[800, 360, 2], [2400, 1080, 3]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = await tile(k);
    await page.tap(x, y);
    await waitReady();
    await page.tap(pal[2].x, pal[2].y);
    const pt = [P.x + 10, P.y + 10];
    await page.tap(pt[0], pt[1]);
    await sleep(150);
    t.check(`${w}x${h}: taps map to the right pixels`, same(await px(pt[0], pt[1]), hex('#FFEB3B')));
    await page.tap(pal[9].x, pal[9].y);
    await page.tap(P.x + P.s * 0.5, P.y + P.s * 0.3);
    await sleep(150);
    await t.shot(`10_${w}x${h}`);
  }
  await page.size(1280, 720);
}
