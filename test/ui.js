// Effect chooser sheet, favorites and live preview.
const { chromium } = require('playwright');
const OUT = process.env.OUT || __dirname, URL = 'http://localhost:8765/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForSelector('[data-t="Rakes"]');
  await p.click('[data-t="Rakes"]'); await p.waitForTimeout(800);
  const label1 = await p.textContent('#pvLabel');
  await p.click('#openEff'); await p.waitForTimeout(300);
  const sheetOpen = await p.isVisible('#effSheet');
  await p.click('#effList [data-fav="WLED - Fireworks"]'); await p.click('#effList [data-fav="WLED - Aurora"]');
  await p.screenshot({ path: OUT + '/u1-sheet.png' });
  await p.click('#effList .effsec + .eff [data-fav]', { trial: true });
  await p.click('#effList [data-e="WLED - Aurora"] .nm'); await p.waitForTimeout(300);
  const sheetClosed = !(await p.isVisible('#effSheet'));
  const picked = await p.textContent('#effPickName');
  const chips = await p.$$eval('#quick .chip', els => els.slice(0, 3).map(e => e.textContent));
  await p.click('#goBtn'); await p.waitForTimeout(900);
  await p.evaluate(() => document.querySelector('#v-effects .card:nth-child(2)').scrollIntoView());
  await p.screenshot({ path: OUT + '/u2-effects.png' });
  await p.reload(); await p.waitForSelector('[data-t="Rakes"]'); await p.waitForTimeout(400);
  const favsKept = await p.$$eval('#quick .chip', els => els.slice(0, 2).map(e => e.textContent));
  console.log({ errs, label1, sheetOpen, sheetClosed, picked, chips, favsKept });
  await b.close();
})();
