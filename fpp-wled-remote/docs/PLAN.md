# Plan: fpp-wled-remote

## Plugin layout
```
fpp-wled-remote/
  pluginInfo.json      FPP plugin metadata (minFPPVersion 10.3)
  menu.inc             adds "WLED Remote" to FPP's Status menu
  www/index.html       the app (one page, no build step, no outside libraries)
  www/app.js
  www/app.css
  docs/                API notes and this plan
  tools/probe-fpp.sh   read-only survey of a Pi
```
Open on a phone: `http://<your-pi-ip>/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1`

## Screens
1. **Effects:** pick props/groups (multi-select; Groups and Props shown separately), pick an
   effect from a searchable list (WLED effects first; ♪ marks sound-reactive ones). Controls are
   built from that effect's description: brightness, speed, intensity, custom sliders, palette,
   colors. Changes go to FPP live, with a short delay while sliding. A large
   **Stop all effects** button is always visible.
2. **Show:** status of the Christmas playlist (now playing, progress), Start / Stop gracefully /
   Stop now.
3. **Presets:** save the current look (models + effect + args by name). Tap to apply,
   long-press to rename or delete. Stored on the Pi in `config/fpp-wled-remote-presets.json`,
   so every phone sees the same presets.

## Rules
- Every change is a POST (`/api/command`, `/api/playlist/.../start`, `/api/playlists/stop...`).
- All calls go to the same server the page came from. No host setting, no password in the app.
- Effect args are sent in the order the effect describes them, filled from saved values by name
  with defaults for anything missing. That way presets keep working if FPP changes an effect.

## Steps
1. Run the probe and confirm the notes (group names, effect args, playlist name).
2. Build the app and plugin files. Test against a mock that replays the probe's real responses.
3. You install it on the Pi with one `scp`, then test on your phone. I fix whatever you report.
4. Optional: put it on GitHub so FPP's Plugin Manager can install and update it.
