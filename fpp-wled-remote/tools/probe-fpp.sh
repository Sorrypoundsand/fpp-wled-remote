#!/usr/bin/env bash
# Read-only survey of an FPP 10.3 player for the fpp-wled-remote plugin.
# Run ON THE PI over SSH (localhost needs no web password):
#   ssh fpp@<your-pi-ip> 'bash -s' < tools/probe-fpp.sh > fpp-probe.txt
# Every request is a GET that only reads; nothing on the Pi is changed.
H="${FPP_HOST:-http://localhost}"
get() { echo; echo "===== GET $1"; curl -sS -m 15 "$H$1"; echo; }

get "/api/fppd/status"
get "/api/system/info"
get "/api/playlists"
get "/api/playlist/Christmas"
get "/api/models?simple=true&all=true"
get "/api/models"
get "/api/overlays/models"
get "/api/overlays/running"
get "/api/overlays/effects"
get "/api/overlays/effects?full=true"
get "/api/commandPresets"
get "/api/plugin"
get "/json/info"
get "/json/eff"
get "/json/pal"
echo; echo "===== config files"; ls -la /home/fpp/media/config/ 2>&1 | grep -iE 'model|preset|cross' 
echo; echo "===== plugins dir"; ls /home/fpp/media/plugins 2>&1
