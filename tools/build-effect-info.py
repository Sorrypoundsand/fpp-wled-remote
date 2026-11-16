#!/usr/bin/env python3
"""Build www/effect-info.json: type, description and a small preview for each WLED effect.

Inputs (all MIT licensed, cloned next to each other):
  FPP's WLED port  fpp/src/overlays/wled/FX.cpp     -> 1D/2D/audio flags, effect names
  WLED-Docs        docs/features/effects.md          -> IDs, descriptions, "new in 16.0"
  WLED-Utils       effect_descriptions.json, gifs/   -> older descriptions and preview GIFs

Usage: build-effect-info.py FX.cpp WLED-Docs-dir WLED-Utils-dir out.json
"""
import base64, io, json, re, sys
from PIL import Image, ImageSequence

FXCPP, DOCS, UTILS, OUT = sys.argv[1:5]
THUMB_W, THUMB_H, MAX_FRAMES = 112, 40, 28

# 1. Flags from WLED's metadata strings: "Name@sliders;colors;palette;FLAGS;defaults".
#    Flags: 1 = made for a row of LEDs, 2 = made for a matrix, v/f = reacts to sound.
src = open(FXCPP, encoding='utf-8', errors='replace').read()
flags = {}
for m in re.findall(r'_data_FX_MODE_\w+\[\]\s*PROGMEM\s*=\s*"((?:[^"\\]|\\.)*)"', src):
    parts = m.split(';')
    flags[m.split('@')[0]] = (parts[3].split(',')[0] if len(parts) > 3 else '')

# 2. IDs and descriptions. WLED-Docs first (newer), WLED-Utils for the rest.
def clean(t):
    t = re.sub(r'!\[[^\]]*\]\([^)]*\)(\{[^}]*\})?', '', t)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = re.sub(r'\*\*|`', '', t)
    return re.sub(r'\s+', ' ', t).strip(' .') + '.' if t.strip() else ''

info = {}
docs = open(DOCS + '/docs/features/effects.md', encoding='utf-8').read()
new16 = set()
sect = docs[docs.find('### Effects available since 16.0'):]
sect = sect[:sect.find('### Retired Effects')]
for row in re.findall(r'^\|\s*(\d+)\s*\|\s*\**([^|*]+?)\**\s*\|([^|]*)\|', sect, re.M):
    new16.add(row[1].strip())
for fid, name, desc in re.findall(r'^\|\s*(\d+)\s*\|\s*\**([^|*]+?)\**\s*\|([^|]*)\|', docs, re.M):
    info.setdefault(name.strip(), {'id': fid, 'd': clean(desc)})
for e in json.load(open(UTILS + '/effect_descriptions.json')):
    n = e['name'].strip()
    if n not in info or not info[n]['d']:
        info[n] = {'id': str(e['id']), 'd': clean(e.get('description', '')) or (info.get(n) or {}).get('d', '')}
new16.add('Copy Segment')

# 3. Small looping previews.
def thumb(fid):
    n = int(fid)
    for path in (f'{DOCS}/docs/assets/images/content/effect_gifs/FX_{n}.gif', f'{UTILS}/gifs/FX_{n:03d}.gif', f'{UTILS}/gifs/FX_{n}.gif'):
        try:
            im = Image.open(path)
        except OSError:
            continue
        frames = [f.convert('RGB') for f in ImageSequence.Iterator(im)]
        step = max(1, -(-len(frames) // MAX_FRAMES))
        frames = frames[::step]
        w, h = frames[0].size
        s = min(THUMB_W / w, THUMB_H / h)
        size = (max(1, round(w * s)), max(1, round(h * s)))
        small = [f.resize(size, Image.NEAREST).convert("P", palette=Image.ADAPTIVE, colors=32) for f in frames]
        for f in small: f.info.pop("transparency", None)
        dur = (im.info.get('duration', 50) or 50) * step
        buf = io.BytesIO()
        small[0].save(buf, 'GIF', save_all=True, append_images=small[1:], loop=0, duration=dur, optimize=True, disposal=1)
        return base64.b64encode(buf.getvalue()).decode()
    return None

out = {}
for name, fl in sorted(flags.items()):
    if name in ('RSVD',):
        continue
    key = name.replace('+', '-Plus')            # FPP's spelling
    i = info.get(name) or info.get(key) or {}
    kind = 'matrix' if ('2' in fl and '1' not in fl) else ('both' if ('1' in fl and '2' in fl) else 'row')
    e = {'k': kind}
    if 'v' in fl or 'f' in fl: e['m'] = 1
    if name in new16: e['n'] = 1
    if i.get('d'): e['d'] = i['d']
    if i.get('id'):
        g = thumb(i['id'])
        if g: e['g'] = g
    out[key] = e

json.dump({'source': 'FPP 10.3 WLED port; descriptions and previews from WLED-Docs and WLED-Utils (MIT)',
           'effects': out}, open(OUT, 'w'), separators=(',', ':'))
n = len(out); g = sum('g' in e for e in out.values()); d = sum('d' in e for e in out.values())
print(f'{n} effects, {d} with descriptions, {g} with previews, {sum(e["k"]=="matrix" for e in out.values())} matrix, '
      f'{sum("m" in e for e in out.values())} music, {sum("n" in e for e in out.values())} new')
