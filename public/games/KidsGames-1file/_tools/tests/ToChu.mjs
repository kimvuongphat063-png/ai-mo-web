// ToChu scripted test (real touch events through CDP).
export async function run(t) {
  const { page, sleep } = t;
  const tile = async (k) => page.eval(`(function(){var r=K.grid(32,8,122,110,22,24,{x:0,y:0,w:1280,h:720})[${k}];return [r.x+r.w/2,r.y+r.h/2];})()`);
  const noisy = (pts, every, noise) => {
    const out = [];
    for (let i = 0; i < pts.length / 2; i += every) out.push([pts[i * 2] + (Math.random() - 0.5) * noise, pts[i * 2 + 1] + (Math.random() - 0.5) * noise]);
    out.push([pts[pts.length - 2], pts[pts.length - 1]]);
    return out;
  };
  async function traceAll(shotAfterFirst) {
    const info = await t.info();
    for (let s = 0; s < info.strokes.length; s++) {
      const st = info.strokes[s];
      if (st.dot) await page.tap(st.pts[0] + 6, st.pts[1] - 5);
      else await page.drag(noisy(st.pts, 3, 30), 10);
      await sleep(150);
      if (s === 0 && shotAfterFirst) await t.shot(shotAfterFirst);
    }
    return t.info();
  }

  await t.debugShot('debug', true);
  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> grid', (await t.screen()) === 'grid');
  await t.shot('02_grid_upper');

  // A: three strokes traced by finger with +-15 px wobble
  let [x, y] = await tile(0);
  await page.tap(x, y);
  await sleep(400);
  t.check('grid tile A -> trace screen', (await t.screen()) === 'trace' && (await t.info()).ch === 'A');
  await t.shot('03_A_start');
  let r = await traceAll('04_A_stroke1_done');
  await sleep(600);
  await t.shot('05_A_finished_bounce');
  await sleep(1800);
  t.check('A traced -> done overlay', r.done && (await t.isDone()));
  await t.shot('06_A_celebration');

  // next letter Ă including the breve stroke
  await t.button('next');
  t.check('next -> Ă', (await t.info()).ch === 'Ă');
  r = await traceAll();
  await sleep(2300);
  t.check('Ă traced (4 strokes incl. breve)', r.done && (await t.isDone()));
  await t.button('next');

  // Â: scribbling away from the path never advances the stroke
  r = await t.info();
  await page.drag([[1150, 600], [1000, 650], [1200, 500], [300, 650], [320, 100]], 20);
  await sleep(200);
  r = await t.info();
  t.check('off-path scribble does not progress', r.cur === 0 && !r.done);
  // a shortcut straight line from start to end of stroke 1 of Â is on-path (straight stroke) -> ok; test O instead
  // hint hand after 4.5 s idle
  await sleep(5200);
  await t.shot('07_hint_hand');

  // back to grid: A and Ă have stars
  await t.button('grid');
  t.check('grid button -> grid', (await t.screen()) === 'grid');
  await t.shot('08_grid_stars');

  // O: a straight shortcut across the circle must not complete it
  [x, y] = await tile(16);
  await page.tap(x, y);
  await sleep(400);
  r = await t.info();
  const o = r.strokes[0].pts;
  const n = o.length / 2;
  await page.drag([[o[0], o[1]], [o[0] - 60, o[1] + 150], [o[(n >> 1) * 2], o[(n >> 1) * 2 + 1]], [o[o.length - 2], o[o.length - 1]]], 30);
  await sleep(200);
  r = await t.info();
  t.check('O: shortcut across the circle does not complete', !r.done);
  r = await traceAll();
  await sleep(300);
  t.check('O traced along the circle', r.done);
  await sleep(2000);
  await t.button('grid');

  // lowercase switch
  const pill = await page.eval('(function(){var a=K.grid(32,8,122,110,22,24,{x:0,y:0,w:1280,h:720});return [a[31].x+a[31].w/2,a[31].y+a[31].h/2];})()');
  await page.tap(pill[0] - 40, pill[1]);
  await sleep(300);
  let save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('lowercase switch saved', save.mode === 'lo');
  await t.shot('09_grid_lower');
  [x, y] = await tile(0);
  await page.tap(x, y);
  await sleep(400);
  t.check('lowercase a opened', (await t.info()).ch === 'a');
  r = await traceAll();
  await sleep(2300);
  t.check('a traced', r.done && (await t.isDone()));
  await t.shot('10_a_celebration');
  await t.button('replay');
  t.check('replay restarts the same letter', (await t.info()).ch === 'a' && !(await t.info()).done);
  // i: stem + dot (tap)
  await t.button('grid');
  [x, y] = await tile(11);
  await page.tap(x, y);
  await sleep(400);
  r = await traceAll();
  await sleep(300);
  t.check('i traced (stroke + tapped dot)', r.ch === 'i' && r.done);
  await sleep(2000);

  await t.pauseChecks();

  // save survives a reload
  await page.goto(t.url);
  save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.mode === 'lo' && save.up[0] === 1 && save.up[1] === 1 && save.up[16] === 1 && save.lo[0] === 1 && save.lo[11] === 1, JSON.stringify(save));

  // other screen sizes: trace one letter each
  for (const [w, h, k] of [[800, 360, 3], [2400, 1080, 9]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = await tile(k);
    await page.tap(x, y);
    await sleep(400);
    r = await traceAll();
    await sleep(300);
    t.check(`${w}x${h}: letter ${r.ch} traced`, r.done);
    await t.shot(`11_${w}x${h}_${r.ch}`);
    await sleep(2000);
  }
  await page.size(1280, 720);
}
