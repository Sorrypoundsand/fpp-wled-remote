# FPP 10.3 API notes for fpp-wled-remote

Source: FPP's own source code at tag `10.3` (commit `da997bd`, Oct 21 2026), mainly
`www/api/openapi.json` (what the API help page is built from), `src/overlays/PixelOverlay.cpp`,
`src/overlays/WLEDEffects.cpp`, `src/overlays/PixelOverlayEffects.cpp`, `etc/apache2.site` and
`www/plugin.php`.

**Status:** taken from the source code, then checked against a probe of a real player
(FPP 10.3 on a Raspberry Pi 5) on Nov 5 2026. Corrections from that check are marked **Checked**.

## Running commands (all state changes)

`POST /api/command` with body `{"command": "<name>", "args": ["..."]}`. Args are strings.
`POST /api/command/{command}` with a JSON array body also works.
`GET /api/command/...` is marked **deprecated**.

## Overlay models and groups

- `GET /api/models?simple=true` returns an array of model names.
- `GET /api/models?simple=true&all=true` returns the same list with `"--All Models--"` first.
  This is the list the "Overlay Model Effect" command itself uses.
- `GET /api/models` returns full definitions (Name, StartChannel, ChannelCount, ...).
- **Checked: groups are NOT in `/api/models`.** That list has the 57 props only. Groups live in
  `config/xlights-modelgroups.json` (`modelgroups[].Name`; skip entries with `BufferStyle: "polar"`),
  and submodels in `config/xlights-submodels.json`. fppd loads one on demand the first time a
  command names it, so groups work in every overlay command even though they aren't listed.
  Read both files with `GET /api/configfile/<file>`.
- `--All Models--` only covers models fppd has loaded, so Stop All also stops each group the
  app has used, by name.
- Model names use underscores in place of spaces, e.g. `Real_Big_Lights`.
- Every overlay command takes a **comma-separated list** of models in its first argument, so
  several props can be targeted in one call.

## Overlay commands

| Command | Args |
|---|---|
| `Overlay Model Effect` | `Models`, `AutoEnable` (`False` / `Enabled` / `Transparent` / `Transparent RGB`), `Effect`, then the effect's own args in order |
| `Overlay Model Fill` | `Model`, `State` (`Don't Set` / `Enabled` / `Transparent` / `TransparentRGB`), `Color` (`#RRGGBB`, or `#RRGGBBWW` for RGBW) |
| `Overlay Model Clear` | `Model` |
| `Overlay Model State` | `Model`, `State` (`Disabled` / `Enabled` / `Transparent` / `TransparentRGB`) |

**Stopping:** there is an effect named `Stop Effects`. Running
`Overlay Model Effect` → `["--All Models--", "Enabled", "Stop Effects"]` blanks every model, then
sets it back to Disabled, which hands the pixels back to the running sequence. That is the
"Stop all effects" button.

## WLED effects

- `GET /api/overlays/effects` returns all effect names. `?full=true` returns full descriptions.
- `GET /api/overlays/effects/{effect}` returns one effect's description:
  `{name, args:[{name, type, description, min, max, default, contents}]}`.
  **Checked:** the list of choices is in `contents`. Args without a `default` are strings, so
  use the first item in `contents`. Bools use `"0"/"1"` or `"false"/"true"`, the same form as
  their default.
- WLED effect names are `WLED - <name>`. Sound-reactive ones are `WLED♪ - <name>`.
  A `+` in a WLED name becomes `-Plus`. Plain FPP effects (Color Fade, Bars, Text, ...) appear in
  the same list.
- **Each WLED effect has its own args.** They always start with `BufferMapping` and
  `brightness` (0–255, default 128). After that, each effect sets which sliders it has
  (Speed, Intensity, or custom labels, 0–255, sometimes checkboxes), whether it has a palette,
  and which colors (color1–3), with its own labels and defaults. A few add `Text`.
  **The app must build its controls from each effect's description, not from a fixed list.**
  This also means effect args change between FPP releases, so presets should save args by name.
- **Checked:** your Pi has 218 effects: 184 WLED, 28 WLED♪, and FPP's own Stop Effects, Bars,
  Blink, Color Fade, Image and Text. 198 effects have a palette, with 72 palettes to choose from.
- One exception: Blink (listed as plain `Blink`, not `WLED - Blink`) is FPP's own version, with `Brightness` 0–100,
  `Speed` 1–5000, `Intensity` 0–100, `Color1`, `Color2`.

## Playlists and status

- `GET /api/fppd/status`: what's playing (`status_name`, `current_playlist`,
  `current_sequence`, `seconds_played`, `seconds_remaining`, ...).
- `GET /api/playlists`: playlist names. `GET /api/playlist/Christmas`: its contents.
- `POST /api/playlist/Christmas/start` (or `/start/{Repeat}`): start.
- `POST /api/playlists/stop` (now) / `POST /api/playlists/stopgracefully` (after the current item).
  The GET versions are deprecated.

## Presets storage

`POST /api/configfile/<name>.json` / `GET /api/configfile/<name>.json` stores a JSON file in
FPP's `config/` folder, so presets are shared by every phone and included in FPP backups.
(`/api/plugin/{name}/settings/{key}` is the alternative, for small values.)

## Serving the app and security

- **Menu:** a plugin adds a Status-menu entry with a `status_menu.inc` file.
- A plugin lives in `/home/fpp/media/plugins/<name>/`. `plugin.php?plugin=<name>&file=<path>&nopage=1`
  serves a plain file from it (**checked: `.html` comes back as `text/plain`**, so the app goes through `app.php`), and `&page=<file>.php` runs a PHP page inside FPP's frame.
  `nopage=1` leaves out FPP's header and menus, so the app gets the whole screen.
- Plugin pages are password-protected like the rest of the UI. Because the app is served from
  FPP itself, the browser sends the same login with every API call. No password is stored in the
  app.
- `etc/apache2.site` refuses any POST/PUT/DELETE sent from another site's page (checked with
  `Sec-Fetch-Site` / `Origin`). It also refuses state-changing GETs from other sites. That is why
  the app must be served from FPP itself.
  Requests from the Pi itself (`localhost`) skip the password, which is why the probe script runs
  there.

## Built-in WLED compatibility (worth knowing)

FPP 10.3 also answers WLED's own JSON API at `/json`, `/json/state`, `/json/info`, `/json/eff`,
`/json/pal` and `/win`, mapped onto overlay models. These are left open to other sites so WLED
phone apps can drive them. The probe checks what they return on your Pi. The custom app is still
the better fit for props, groups, presets and playlists.
