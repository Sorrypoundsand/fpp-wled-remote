// Kids-mode walk-through: set a PIN, lock, use kids controls, unlock.
const { chromium } = require('playwright');
const OUT = process.env.OUT || __dirname, URL = 'http://localhost:8765/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1';
(async () => {
  const b = await chromium.launch();
  const ctxA = await b.newContext(), ctxB = await b.newContext();
  const p = await ctxA.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const log = async () => (await (await p.request.get('http://localhost:8765/__log')).json()).filter(l => l.p === '/api/command').map(l => JSON.parse(l.body));
  await p.goto(URL); await p.waitForSelector('[data-t="Rakes"]');
  // grown-up: tweak an effect and add it to kids, then set a PIN
  await p.click('#quick [data-e="WLED - Colorwaves"]'); await p.click('#addKidsBtn'); await p.waitForTimeout(300);
  await p.click('nav [data-v=kids]'); await p.waitForTimeout(300);
  await p.fill('#kPin1', '1234'); await p.fill('#kPin2', '1234'); await p.click('#kSavePin'); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/k0-setup.png', fullPage: true });
  // this phone stays logged in after a reload; a second device (a kid's tablet) opens in Kids mode
  await p.reload(); await p.waitForTimeout(1500);
  const phoneStaysAdult = await p.isVisible('#parentApp') && await p.isVisible('#lockBtn');
  const tab = await ctxB.newPage({ viewport: { width: 800, height: 1100 } });
  await tab.goto(URL); await tab.waitForTimeout(1500);
  const tabletIsKids = await tab.isVisible('#kidsApp') && !(await tab.isVisible('#parentApp'));
  await p.click('#lockBtn'); await p.waitForSelector('#kidsApp:not([hidden]) [data-kz]');
  await p.reload(); await p.waitForTimeout(1500);
  const loggedOutStays = await p.isVisible('#kidsApp');
  const n0 = (await log()).length;
  await p.click('[data-ke]:nth-child(2)'); await p.waitForTimeout(400);           // no zone yet -> nudge, no command
  const nudged = (await log()).length === n0;
  await p.click('[data-kz="Rakes"]'); await p.click('[data-kz="Trees"]');
  await p.click('[data-ke]:nth-child(2)'); await p.waitForTimeout(400);           // Twinkle
  const wb = await p.$('#wheel').then(e => e.boundingBox());
  await p.mouse.click(wb.x + wb.width * 0.85, wb.y + wb.height * 0.5); await p.waitForTimeout(400); // red-ish edge... right = hue 0
  await p.click('[data-ks="fast"]'); await p.click('[data-kb="low"]'); await p.waitForTimeout(400);
  await p.click('[data-kc="rainbow"]'); await p.waitForTimeout(400);
  await p.click('[data-heart="Fireworks"]'); await p.waitForTimeout(200);
  await p.screenshot({ path: OUT + '/k1-kids.png' });
  await p.screenshot({ path: OUT + '/k2-kids-full.png', fullPage: true });
  await p.click('#kStop'); await p.waitForTimeout(300);
  // unlock: wrong then right
  await p.click('#unlockBtn'); for (const d of '1111') await p.click(`#pinKeys button:text-is("${d}")`); await p.waitForTimeout(400);
  const stillLocked = await p.isVisible('#pinPad');
  await p.screenshot({ path: OUT + '/k3-pin.png' });
  for (const d of '1234') await p.click(`#pinKeys button:text-is("${d}")`); await p.waitForTimeout(300);
  const unlocked = await p.isVisible('#parentApp') && !(await p.isVisible('#kidsApp'));
  await p.reload(); await p.waitForTimeout(1500);
  const rememberedAfterUnlock = await p.isVisible('#parentApp');
  // tablet unlocks with the old PIN, then the phone changes the PIN: the tablet is logged out
  await tab.click('#unlockBtn'); for (const d of '1234') await tab.click(`#pinKeys button:text-is("${d}")`); await tab.waitForTimeout(300);
  const tabUnlocked = await tab.isVisible('#parentApp');
  await p.click('nav [data-v=kids]'); await p.fill('#kPin1', '9876'); await p.fill('#kPin2', '9876'); await p.click('#kSavePin'); await p.waitForTimeout(300);
  await tab.reload(); await tab.waitForTimeout(1500);
  const tabKickedOut = await tab.isVisible('#kidsApp');
  await p.reload(); await p.waitForTimeout(1500);
  const phoneKeptIn = await p.isVisible('#parentApp');
  console.log({ phoneStaysAdult, tabletIsKids, loggedOutStays, rememberedAfterUnlock, tabUnlocked, tabKickedOut, phoneKeptIn });
  const cmds = (await log()).slice(n0);
  console.log('errors', errs, '| nudge without zone:', nudged, '| wrong PIN kept lock:', stillLocked, '| right PIN unlocked:', unlocked);
  for (const c of cmds) console.log(c.command, JSON.stringify(c.args).slice(0, 200));
  await b.close();
})();
