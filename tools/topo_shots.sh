#!/bin/sh
# Headless-Chrome screenshots of the topography + planting-system demonstration (2026-11-21). Each URL replays
# design/js/toposcript.js (?script=topo) to a stop point and captures the page at 1440 x 900. Needs the design server:
#   python3 -I tools/design_server.py --port 8768      then      sh tools/topo_shots.sh [out-dir] [WxH] [base-url]
OUT="${1:-docs/topography-presets/screenshots}"
SIZE="${2:-1440,900}"
URL="${3:-http://127.0.0.1:8768}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"
# 2D stops are captured with the GPU off (the software-GL flags leave the Grow plan blank); the three.js views need software GL.
shot() {
  TD=$(mktemp -d); case "$1" in *3d*) GL="--use-angle=swiftshader --enable-unsafe-swiftshader" ;; *) GL="--disable-gpu" ;; esac
  "$CH" --headless=new $GL --no-first-run --user-data-dir="$TD" --hide-scrollbars --force-prefers-reduced-motion --window-size="$SIZE" --virtual-time-budget="${3:-16000}" --screenshot="$OUT/$1.png" "$URL/design/index.html?fresh=1&script=topo&stop=$2" >/dev/null 2>&1
  rm -rf "$TD"; echo "$OUT/$1.png"
}
shot A01-shape-elevation-unknown      a-unknown
shot A02-photo-not-analysed           a-photo
shot A03-grayscale-needs-confirmation a-gray
shot A04-slope-preview                a-slope-preview
shot A05-slope-plan-contours          a-slope-plan
shot A06-slope-heightmap              a-heightmap
shot A07-slope-terrain-3d             a-slope-3d 22000
shot A08-edit-heightmap-preview       a-edit-preview 22000
shot A09-edit-terrain-3d              a-edit-3d 24000
shot A10-gate-preview-excluded        a-gate-preview 26000
shot A11-gate-applied                 a-gate-applied 26000
shot A12-compose-on-terrain           a-compose 28000
shot A13-grow-plan-on-terrain         a-grow-plan 30000
shot A14-grow-3d-on-terrain           a-grow-3d 36000
shot B00-compose-system-strip         b-strip 40000
shot B01-compose-north-no-system      b-north-none 40000
shot B02-compose-north-layered        b-north-layered 42000
shot B03-compose-north-woodland       b-north-woodland 44000
shot B04-compose-island-no-system     b-island-none 46000
shot B05-compose-island-woodland      b-island-woodland 48000
shot B06-grow-plan-systems            b-grow-plan 52000
shot B07-grow-why-chain               b-grow-why 54000
shot B08-grow-algorithm               b-grow-algo 56000
shot B09-grow-presentation            b-grow-present 58000
shot B10-grow-3d                      b-grow-3d 64000
shot AB1-compose-terrain-and-systems  ab-compose 68000
shot AB2-grow-plan                    ab-grow-plan 72000
shot AB3-grow-3d                      ab-grow-3d 140000
