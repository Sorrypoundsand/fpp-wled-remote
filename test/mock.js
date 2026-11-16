// Replays the real Pi's probe responses; logs every state-changing call.
const http = require('http'), fs = require('fs');
const L = fs.readFileSync(process.argv[2], 'utf8').split('\n');
const APP = process.argv[3];
const R = { status: JSON.parse(L[1]), playlists: L[5], christmas: L[7], simple: L[9], ovm: JSON.parse(L[13]), effFull: L[19] };
// The probe didn't fetch the group/submodel files; these names stand in for them.
const groups = { modelgroups: ['All','Brows','Flats','Front_to_Back','House_+RBB','Left_Rakes','Rakes','Real_Big_Lights','Right_Rakes','Stars','Trees'].map(Name => ({ Name })) };
const subs = { submodels: [{ Name: 'Mega_Star/Outline' }, { Name: 'Mega_Star/Center' }] };
const store = {}; const log = [];
http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const u = new URL(req.url, 'http://x'), p = u.pathname;
    const send = (code, data, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type }); res.end(typeof data === 'string' ? data : JSON.stringify(data)) };
    if (req.method !== 'GET') log.push({ m: req.method, p: decodeURIComponent(p), body });
    if (p === '/plugin.php') return send(200, fs.readFileSync(APP, 'utf8'), 'text/html');
    if (p === '/__log') return send(200, log);
    if (p === '/api/fppd/status') return send(200, R.status);
    if (p === '/api/playlists') return send(200, R.playlists);
    if (p === '/api/playlist/Christmas') return send(200, R.christmas);
    if (p === '/api/models') return send(200, R.simple);
    if (p === '/api/overlays/models') return send(200, R.ovm);
    // Fake moving pixels for the live preview: a strip for props, a 2D grid for groups.
    let mm = p.match(/^\/api\/overlays\/model\/([^/]+)\/data\/raw$/);
    if (mm){
      const name = decodeURIComponent(mm[1]), grid = groups.modelgroups.some(g => g.Name === name);
      const w = grid ? 48 : 60, h = grid ? 14 : 1, t = Date.now() / 120, buf = Buffer.alloc(w * h * 3);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
        const i = (y * w + x) * 3, hue = ((x + y * 2 + t) % w) / w * 6, f = n => Math.round(255 * Math.max(0, Math.min(1, Math.abs((hue + n) % 6 - 3) - 1)));
        const tw = Math.sin(x * 12.9 + y * 78.2 + t) > 0.6 ? 1 : 0.35;
        buf[i] = f(0) * tw; buf[i + 1] = f(4) * tw; buf[i + 2] = f(2) * tw;
      }
      res.writeHead(200, { 'Content-Type': 'application/octet-stream', 'X-FPP-Model-Width': w, 'X-FPP-Model-Height': h, 'X-FPP-Model-BytesPerPixel': 3 });
      return res.end(buf);
    }
    if (p === '/api/overlays/effects') return send(200, R.effFull);
    if (p === '/api/configfile/xlights-modelgroups.json') return send(200, groups);
    if (p === '/api/configfile/xlights-submodels.json') return send(200, subs);
    if (p.startsWith('/api/configfile/fpp-wled-remote-')){
      if (req.method === 'POST'){ store[p] = body; return send(200, { Status: 'OK' }) }
      return store[p] ? send(200, store[p]) : send(404, { Status: 'Error', Message: 'not found' });
    }
    if (p === '/api/command'){
      const c = JSON.parse(body);
      if (c.command === 'Overlay Model Effect' && c.args[2] !== 'Stop Effects'){
        const d = JSON.parse(R.effFull).find(e => e.name === c.args[2]);
        if (!d) return send(500, 'Could not start effect: ' + c.args[2], 'text/plain');
        if (c.args.length !== 3 + d.args.length) return send(500, `arg count ${c.args.length - 3} != ${d.args.length}`, 'text/plain');
      }
      return send(200, { status: 'OK', message: 'Model Effect Started' });
    }
    if (p.startsWith('/api/playlist/') && p.includes('/start')){ Object.assign(R.status, { status_name: 'playing', current_playlist: { playlist: 'Christmas', index: '1', count: '4' }, current_sequence: 'Blue and White twinkle.fseq', seconds_played: '12', seconds_remaining: '78' }); return send(200, { Status: 'OK' }) }
    if (p.startsWith('/api/playlists/stop')){ Object.assign(R.status, { status_name: 'idle', current_playlist: { playlist: '' }, current_sequence: '', seconds_played: '0', seconds_remaining: '0' }); return send(200, { Status: 'OK' }) }
    send(404, 'not found', 'text/plain');
  });
}).listen(8765, () => console.log('mock up'));
