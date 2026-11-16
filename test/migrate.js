// Settings move from the two old files into plugin.fpp-wled-remote.json without losing anything.
const { chromium } = require('playwright');
const M = 'http://localhost:8765', URL = M + '/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1';
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // An older install: one preset, and Kids mode with no PIN but a custom brightness limit.
  await p.request.post(M + '/__store', { data: JSON.stringify({
    '/api/configfile/fpp-wled-remote-presets.json': JSON.stringify({ version: 1, presets: [{ name: 'Old preset', targets: ['Rakes'], effect: 'WLED - Twinkle', values: {}, autoEnable: 'Enabled' }] }),
    '/api/configfile/fpp-wled-remote-kids.json': JSON.stringify({ version: 1, salt: 'abc', maxBright: 40, zones: [{ name: 'Rakes', label: 'Big Rakes', icon: '🏠' }], effects: [] })
  }) });
  await p.goto(URL); await p.waitForSelector('[data-t="Rakes"]'); await p.waitForTimeout(800);
  await p.click('nav [data-v=presets]'); await p.waitForTimeout(500);
  const presetShown = (await p.textContent('#presets')).includes('Old preset');
  await p.click('nav [data-v=kids]'); await p.waitForTimeout(300);
  const maxShown = await p.inputValue('#kMax');
  // First save (a new PIN) writes the new file and removes the old ones.
  await p.fill('#kPin1', '2468'); await p.fill('#kPin2', '2468'); await p.click('#kSavePin'); await p.waitForTimeout(800);
  const store = await (await p.request.get(M + '/__store')).json();
  const keys = Object.keys(store).filter(k => k.startsWith('/api/configfile/'));
  const s = JSON.parse(store['/api/configfile/plugin.fpp-wled-remote.json'] || '{}');
  console.log({ errs, presetShown, maxShown, files: keys,
    newHasPreset: (s.presets || [])[0]?.name, newKidsMax: s.kids?.maxBright, newKidsZone: s.kids?.zones?.[0]?.label, newHasPin: !!s.kids?.pinHash });
  // Saving a preset afterwards keeps the kids settings.
  await p.click('nav [data-v=effects]'); await p.click('[data-t="Rakes"]'); await p.fill('#presetName', 'New one'); await p.click('#savePresetBtn'); await p.waitForTimeout(600);
  const s2 = JSON.parse((await (await p.request.get(M + '/__store')).json())['/api/configfile/plugin.fpp-wled-remote.json']);
  console.log({ presetsAfter: s2.presets.map(x => x.name), kidsKept: !!s2.kids?.pinHash && s2.kids.maxBright === 40 });
  await b.close();
})();
