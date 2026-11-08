# WLED Remote for FPP (with Kids mode)

A phone remote for [Falcon Player (FPP)](https://github.com/FalconChristmas/fpp) 10.3 and newer.

- **Effects:** pick your xLights props or groups, pick one of FPP's 200+ built-in WLED effects, and
  adjust brightness, speed, colors and palette live.
- **Stop all effects:** one big button hands every light back to your show.
- **Show:** start, stop after the current song, or stop a playlist, and see what's playing.
- **Presets:** save a look and bring it back with one tap. Saved on the Pi, so every phone sees them.
- **Kids mode:** a simple screen for kids, with big picture buttons, a color wheel, 🐢🐇🚀 speed,
  🌙☀️ brightness and a giant STOP. You choose which lights and effects they get, and set a
  brightness limit. Grown-up controls are behind a 4-digit PIN.

It runs as an FPP plugin, so it works with whatever controllers your FPP drives, and needs no
internet connection. Everything works with FPP's web password turned on.

> **Early version.** Built and tested on one show (FPP 10.3, Raspberry Pi 5, xLights props and
> groups). Other setups may turn up bugs. Please report them under **Issues**.

## Install

### From FPP's Plugin Manager (easiest)

FPP only lets you paste a plugin link when its interface level is set to **Developer**:

1. In FPP, open **FPP Settings → User Interface** and set **User Interface Level** to **Developer**.
2. Open **Content Setup → Plugin Manager** and paste this into the search box at the top:

   ```
   https://github.com/sorrypoundsand/fpp-wled-remote
   ```

3. Click **Install** on the plugin that appears. FPP warns that it isn't in its official plugin
   list and shows what the plugin declares about privacy. This one sends no data anywhere.
4. Optional: set **User Interface Level** back to **Basic**. The plugin keeps working.
5. On your phone, open:

   ```
   http://<your-pi-ip>/plugin.php?plugin=fpp-wled-remote&page=app.php&nopage=1
   ```

   It's also in FPP's **Status** menu as "WLED Remote". On a phone, use **Add to Home Screen**.

Updates show up in the Plugin Manager like any other plugin.

### By hand

Download this repository (**Code → Download ZIP**), unzip it, rename the folder to
`fpp-wled-remote`, and copy it to the Pi:

```
scp -r fpp-wled-remote fpp@<your-pi-ip>:/home/fpp/media/plugins/
```

## Before you start

- **FPP 10.3 or newer.** The WLED effects and some of the calls the app uses are new in 10.3.
- **Overlay models.** Your props need to be in FPP as Pixel Overlay Models. Upload them from
  xLights with FPP Connect. xLights groups show up automatically.
- **Same network.** The app works on your home network. To use it away from home, use a VPN such as
  Tailscale. Don't open FPP to the internet with port forwarding.

## Using it

**Effects:** tap groups or props, pick an effect, press **Run effect**. With **Live** on, every change
goes to the lights right away. Under **Advanced**, *Replace* takes over those lights, and *Blend*
lets the show show through wherever the effect is dark.

**Kids mode:** set it up on the **👧 Kids** tab:

1. Set a 4-digit PIN. From then on, any phone or tablet opens in Kids mode until someone enters
   the PIN on it.
2. Entering the PIN logs that device in. It stays in grown-up mode, even after closing the browser,
   until you tap **🔓 Log out**. Changing the PIN logs out every other device.
3. Choose the lights and effects the kids get, with an icon and name for each, and a brightness
   limit. To give them an effect tuned your way, set it up on the Effects tab and tap
   **Add this effect to Kids mode**.

The PIN is a kid lock, not security: anyone with your FPP web password can still get in.

## Where things are saved

- Presets: `config/fpp-wled-remote-presets.json`
- Kids settings: `config/fpp-wled-remote-kids.json`
- Kids' ❤️ favorites and the login on each device: that device's browser

Both config files are included in FPP backups. Uninstalling the plugin leaves them in place.

## How it talks to FPP

Every call goes to the FPP that served the page, and every change is a POST:

| Action | Call |
|---|---|
| Run effect | `POST /api/command` → `Overlay Model Effect` [models, AutoEnable, effect, args...] |
| Solid color | `POST /api/command` → `Overlay Model Fill` [models, Enabled, #RRGGBB] |
| Stop | `POST /api/command` → `Overlay Model Effect` [`--All Models--` / models, Enabled, `Stop Effects`] |
| Playlists | `POST /api/playlist/{name}/start[/true]`, `POST /api/playlists/stopgracefully`, `POST /api/playlists/stop` |
| Presets / Kids settings | `GET/POST /api/configfile/fpp-wled-remote-{presets,kids}.json` |

Effect controls are built from `GET /api/overlays/effects?full=true`. Groups come from
`config/xlights-modelgroups.json`, because FPP leaves groups out of `/api/models`. See
[`docs/API-NOTES.md`](docs/API-NOTES.md) for details.

## Testing without a Pi

`tools/probe-fpp.sh` saves read-only API answers from a real player. `test/mock.js` replays them,
and the Playwright scripts click through the app:

```
node test/mock.js fpp-probe.txt www/index.html &
node test/e2e.js
node test/kids.js
```

## License

MIT. See [LICENSE](LICENSE).
