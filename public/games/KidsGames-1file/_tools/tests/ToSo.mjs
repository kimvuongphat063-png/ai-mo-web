// ToSo scripted test (real touch events through CDP).
export async function run(t) {
  const { page, sleep } = t;
  const tile = async (k) => page.eval(`(function(){var r=K.grid(10,5,132,150,24,30,{x:40,y:150,w:800,h:400})[${k}];return [r.x+r.w/2,r.y+r.h/2];})()`);
  const noisy = (pts, every, noise) => {
    const out = [];
    for (let i = 0; i < pts.length / 2; i += every) out.push([pts[i * 2] + (Math.random() - 0.5) * noise, pts[i * 2 + 1] + (Math.random() - 0.5) * noise]);
    out.push([pts[pts.length - 2], pts[pts.length - 1]]);
    return out;
  };
  async function traceAll() {
    const info = await t.info();
    for (const st of info.strokes) {
      await page.drag(noisy(st.pts, 3, 30), 10);
      await sleep(150);
    }
    return t.info();
  }
  async function countAll(shotName) {
    await sleep(900);
    let info = await t.info();
    if (info.screen !== 'count') return false;
    if (info.digit === 0) {
      await page.tap(825, 430);
    } else {
      for (let k = 0; k < info.things.length; k++) {
        await page.tap(info.things[k].x + 8, info.things[k].y - 6);
        await sleep(120);
        if (k === 1 && shotName) await t.shot(shotName);
      }
    }
    await sleep(300);
    info = await t.info();
    return info.countDone && info.counted === info.digit;
  }

  await t.debugShot('debug');
  await t.fresh();
  await t.shot('01_start');
  await t.button('play');
  t.check('start -> menu', (await t.screen()) === 'menu');
  await t.shot('02_menu');

  let [x, y] = await tile(3);
  await page.tap(x, y);
  await sleep(400);
  t.check('tile 3 -> trace 3', (await t.info()).digit === 3 && (await t.screen()) === 'trace');
  await t.shot('03_trace3_start');
  let r = await traceAll();
  t.check('3 traced', r.done);
  await sleep(1500);
  t.check('after tracing -> counting screen', (await t.screen()) === 'count');
  t.check('count 3 things by tapping', await countAll('04_count3_progress'));
  await sleep(1900);
  t.check('count done -> celebration', await t.isDone());
  await t.shot('05_count3_done');

  // a counted thing tapped twice does not count twice; then next digit 4
  await t.button('next');
  r = await traceAll();
  await sleep(1500);
  let info = await t.info();
  await page.tap(info.things[0].x, info.things[0].y);
  await sleep(100);
  await page.tap(info.things[0].x, info.things[0].y);
  await sleep(100);
  info = await t.info();
  t.check('tapping the same thing twice counts once', info.counted === 1);
  for (let k = 1; k < info.things.length; k++) { await page.tap(info.things[k].x, info.things[k].y); await sleep(100); }
  await sleep(300);
  t.check('4 traced and counted', r.done && (await t.info()).countDone);
  await sleep(1800);

  // 0: empty basket
  await t.button('grid');
  [x, y] = await tile(0);
  await page.tap(x, y);
  await sleep(400);
  r = await traceAll();
  await sleep(1500);
  await t.shot('06_zero_basket');
  t.check('0 traced + empty basket tapped', r.done && (await countAll()));
  await sleep(1800);

  // 8 crosses itself: must be traceable in one stroke
  await t.button('grid');
  [x, y] = await tile(8);
  await page.tap(x, y);
  await sleep(400);
  await t.shot('07_trace8');
  r = await traceAll();
  t.check('8 (self-crossing) traced', r.done);
  await sleep(1500);
  t.check('count 8', await countAll());
  await sleep(1800);
  await t.button('grid');
  await t.shot('08_menu_stars');

  // part 2
  await page.tap(1050, 340);
  await sleep(400);
  t.check('part 2 opens (never locked)', (await t.screen()) === 'quiz');
  await t.shot('09_quiz');
  info = await t.info();
  const wrong = info.quiz.cards.findIndex((v) => v !== info.quiz.k);
  await page.tap(info.quiz.cardX[wrong], info.quiz.cardY);
  await sleep(150);
  await t.shot('10_quiz_wrong_shake');
  info = await t.info();
  t.check('wrong card: no penalty, question stays', info.quiz.good === -1 && info.quizCorrect === 0);
  // wait for the counting helper, then answer 5 questions
  await sleep(6500);
  await t.shot('11_quiz_helper');
  for (let qn = 0; qn < 5; qn++) {
    info = await t.info();
    const k = info.quiz.cards.indexOf(info.quiz.k);
    await page.tap(info.quiz.cardX[k], info.quiz.cardY);
    await sleep(1600);
  }
  await sleep(500);
  t.check('5 answers -> celebration', await t.isDone());
  await t.shot('12_quiz_done');
  info = await t.info();
  t.check('correct answers counted', info.quizCorrect === 5);

  await t.button('grid');
  await t.pauseChecks();

  await page.goto(t.url);
  const save = JSON.parse(await page.eval('localStorage.getItem("kgp.save.v1")'));
  t.check('progress restored after reload', save.traced[0] && save.traced[3] && save.traced[4] && save.traced[8] && save.quizCorrect === 5 && save.quizRounds === 1, JSON.stringify(save));

  for (const [w, h, d] of [[800, 360, 1], [2400, 1080, 2]]) {
    await page.size(w, h);
    await page.goto(t.url);
    await t.button('play');
    [x, y] = await tile(d);
    await page.tap(x, y);
    await sleep(400);
    r = await traceAll();
    await sleep(1500);
    const ok = r.done && (await countAll());
    await t.shot(`13_${w}x${h}_digit${d}`);
    t.check(`${w}x${h}: digit ${d} traced and counted`, ok);
    await sleep(1800);
  }
  await page.size(1280, 720);
}
