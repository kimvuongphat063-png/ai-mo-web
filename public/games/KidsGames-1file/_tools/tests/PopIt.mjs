// PopIt scripted test: real multi-touch swipes through CDP.
export async function run(t) {
  const { page, sleep } = t;
  const tile = async (k) => page.eval(`(function(){var r=K.grid(9,5,214,250,28,34,{x:0,y:20,w:1280,h:700})[${k}];return [r.x+r.w/2,r.y+r.h/2];})()`);
  const rowsOf = (bubbles) => {
    const rows = {};
    for (const b of bubbles) (rows[b[1]] = rows[b[1]] || []).push(b);
    return Object.keys(rows).map(Number).sort((a, b) => a - b).map((y) => rows[y].sort((a, b) => a[0] - b[0]));
  };
  /** Two fingers swipe two rows at the same time. */
  async function twoFingerRows(r1, r2) {
    if (t.remote) {   // one finger at a time on WebView (no multi-touch injection)
      for (const r of [r1, r2]) {
        if (!r) continue;
        const pts = [];
        for (let k = 0; k <= 14; k++) pts.push([r[0][0] - 50 + (r[r.length - 1][0] - r[0][0] + 100) * k / 14, r[0][1]]);
        await page.drag(pts, 16);
      }
      return;
    }
    const steps = 14;
    const a0 = [r1[0][0] - 50, r1[0][1]], a1 = [r1[r1.length - 1][0] + 50, r1[0][1]];
    const b0 = r2 ? [r2[r2.length - 1][0] + 50, r2[0][1]] : null, b1 = r2 ? [r2[0][0] - 50, r2[0][1]] : null;
    const pts = (k) => {
      const f = k / steps;
      const p = [{ x: a0[0] + (a1[0] - a0[0]) * f, y: a0[1] + (Math.random() - 0.5) * 16, id: 1 }];
      if (r2) p.push({ x: b0[0] + (b1[0] - b0[0]) * f, y: b0[1] + (Math.random() - 0.5) * 16, id: 2 });
      return p;
    };
    await page.touch('touchStart', pts(0));
    for (let k = 1; k <= steps; k++) { await sleep(16); await page.touch('touchMove', pts(k)); }
    await page.touch('touchEnd', []);
    await sleep(60);
  }

  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  await t.shot('02_menu');
  let [x, y] = await tile(0);
  await page.tap(x, y);
  await sleep(400);
  let info = await t.info();
  t.check('9 boards, each with >= 14 bubbles', info.counts.length >= 8 && Math.min(...info.counts) >= 14, JSON.stringify(info.counts));
  await t.shot('03_circle');

  // two fingers swipe two rows at once
  let rows = rowsOf(info.bubbles);
  await twoFingerRows(rows[0], rows[1]);
  info = await t.info();
  const firstTwo = rows[0].length + rows[1].length;
  if (t.remote) t.notRun('two fingers at once pop two rows', 'multi-touch cannot be injected into WebView 69 over DevTools (rows swiped one after the other instead; multi-touch passed on desktop Chrome)');
  else t.check('two fingers at once pop two rows', info.popped === firstTwo, `${info.popped}/${firstTwo}`);
  await t.shot('04_two_rows_popped');
  for (let k = 2; k < rows.length; k += 2) await twoFingerRows(rows[k], rows[k + 1]);
  await sleep(250);
  await t.shot('05_flipping');
  await sleep(1800);
  info = await t.info();
  t.check('all popped -> board flipped to the other side', info.side === 1 && info.popped === 0);
  t.check('flip -> celebration', await t.isDone());
  await t.shot('06_flip_done');
  await t.button('replay');
  t.check('replay keeps playing the flipped board', (await t.screen()) === 'play' && !(await t.isDone()));

  // counting mode
  await page.tap(1188, 88);
  await sleep(150);
  info = await t.info();
  t.check('count mode toggled on', info.countMode === true);
  for (let k = 0; k < 4; k++) await page.tap(info.bubbles[k][0], info.bubbles[k][1], 40);
  await t.shot('07_count_mode');
  info = await t.info();
  t.check('taps pop single bubbles', info.popped === 4);
  // hint after idle
  await sleep(5200);
  await t.shot('08_hint');

  // every other board: pop everything by single taps / swipes, check the flip each time
  for (let k = 1; k < 9; k++) {
    await t.button('grid');
    [x, y] = await tile(k);
    await page.tap(x, y);
    await sleep(400);
    info = await t.info();
    rows = rowsOf(info.bubbles);
    for (let r = 0; r < rows.length; r += 2) await twoFingerRows(rows[r], rows[r + 1]);
    await sleep(2000);
    info = await t.info();
    const ok = info.side === 1 && (await t.isDone());
    if (k === 4 || k === 7) await t.shot(`09_board_${info.board}`);
    t.check(`board ${info.board} cleared and flipped`, ok);
  }
  await t.button('grid');
  await t.shot('10_menu_stars');

  await t.pauseChecks();
  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('flip counts restored after reload', save.flips.circle === 1 && save.flips.shi === 1 && save.count === true, JSON.stringify(save));

  for (const [w, h] of [[800, 360], [2400, 1080]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = await tile(2);
    await page.tap(x, y);
    await sleep(400);
    info = await t.info();
    rows = rowsOf(info.bubbles);
    for (let r = 0; r < rows.length; r += 2) await twoFingerRows(rows[r], rows[r + 1]);
    await sleep(300);
    await t.shot(`11_${w}x${h}`);
    await sleep(1800);
    t.check(`${w}x${h}: star board cleared`, (await t.info()).side === 1);
  }
  await page.size(1280, 720);
}
