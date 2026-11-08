const { chromium } = require('playwright');
const SP = process.env.OUT || __dirname;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  p.on('dialog', d => d.accept());
  await p.goto('http://localhost:8765/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1');
  await p.waitForSelector('[data-t="Rakes"]');
  await p.click('[data-t="Rakes"]'); await p.click('[data-t="Real_Big_Lights"]'); await p.click('#propsBox summary'); await p.click('[data-t="Star"]');
  await p.click('#quick [data-e="WLED - Candle Multi"]');
  await p.click('#goBtn'); await p.waitForTimeout(400);
  // live change: move brightness slider
  await p.$eval('[data-arg="brightness"]', el => { el.value = 200; el.dispatchEvent(new Event('input', { bubbles: true })) });
  await p.waitForTimeout(500);
  // pick palette and a swatch
  await p.selectOption('[data-arg="palette"]', 'Ocean'); await p.waitForTimeout(400);
  await p.click('input[data-arg="color1"]').catch(()=>{}); await p.keyboard.press('Escape');
  await p.click('[data-sw="#00c832"]'); await p.waitForTimeout(400);
  await p.screenshot({ path: SP + '/s1-effects.png', fullPage: true });
  // search + solid color
  await p.fill('#effSearch', 'solid'); await p.click('#effList [data-e="Solid Color"]'); await p.waitForTimeout(400);
  await p.fill('#presetName', 'Green glow'); await p.click('#savePresetBtn'); await p.waitForTimeout(400);
  await p.click('#quick [data-e="WLED - Fireworks"]'); await p.waitForTimeout(400);
  await p.fill('#presetName', 'Fireworks show'); await p.click('#savePresetBtn'); await p.waitForTimeout(400);
  await p.click('#stopAll'); await p.waitForTimeout(400);
  await p.click('nav [data-v=presets]'); await p.waitForTimeout(400);
  await p.click('.preset[data-p="0"]'); await p.waitForTimeout(400);
  await p.click('nav [data-v=presets]'); await p.waitForTimeout(300);
  await p.screenshot({ path: SP + '/s2-presets.png' });
  await p.click('nav [data-v=show]'); await p.waitForTimeout(300);
  await p.click('#plStart'); await p.waitForTimeout(900);
  await p.screenshot({ path: SP + '/s3-show.png' });
  await p.click('#plStopG'); await p.waitForTimeout(300);
  // try every non-sound WLED effect, checking arg counts against the real descriptions
  await p.click('nav [data-v=effects]');
  const names = await p.$$eval('#effList [data-e]', els => els.map(e => e.dataset.e));
  await p.fill('#effSearch', '');
  const all = await p.$$eval('#effList [data-e]', els => els.map(e => e.dataset.e));
  for (const n of all){ await p.$eval(`#effList [data-e="${n.replace(/"/g,'\\"')}"]`, el => el.click()); await p.click('#goBtn'); }
  await p.waitForTimeout(800);
  const log = await (await p.request.get('http://localhost:8765/__log')).json();
  const cmds = log.filter(l => l.p === '/api/command').map(l => JSON.parse(l.body));
  console.log('page errors:', errs);
  console.log('effects tried:', all.length, 'command calls:', cmds.length);
  for (const l of log.slice(0, 12)) console.log(l.m, l.p, l.body.slice(0, 230));
  console.log('non-command calls:', log.filter(l => l.p !== '/api/command').map(l => l.m + ' ' + l.p));
  await b.close();
})();
