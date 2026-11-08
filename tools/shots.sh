#!/bin/sh
# Headless-Chrome screenshots of the spatial-proposal demos (2026-11-08). Each URL replays a demo script to a stop point
# (design/js/app.js runScriptBody · ?script=demoA|demoB|demoC&stop=<key>) and the page is captured in that state.
#   sh tools/shots.sh [base-url] [out-dir]      defaults: http://127.0.0.1:8768 · brain/screenshots/spatial
set -eu
BASE=${1:-http://127.0.0.1:8768}; OUT=${2:-brain/screenshots/spatial}; mkdir -p "$OUT"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
shot() {   # query · file · WxH
  D=$(mktemp -d)
  "$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --no-first-run --hide-scrollbars --user-data-dir="$D" --window-size="$3" --virtual-time-budget=16000 --screenshot="$OUT/$2" "$BASE/design/index.html?$1" 2>/dev/null
  printf 'shot %s\n' "$2"
}
shot "fresh=1" 01-home-after-desktop.png 1440,900
shot "fresh=1" 01-home-after-phone.png 390,844
shot "script=demoA&stop=shape&fresh=1&solo=1" 10-demoA-shape-desktop.png 1440,900
shot "script=demoA&stop=shape&fresh=1&solo=1" 10-demoA-shape-phone.png 390,844
shot "script=demoA&stop=intent&fresh=1&solo=1" 11-demoA-compose-desktop.png 1440,900
shot "script=demoA&stop=garden&fresh=1" 12-demoA-grow-plan-desktop.png 1440,900
shot "script=demoA&stop=three&fresh=1" 13-demoA-grow-3d-desktop.png 1440,900
shot "script=demoB&stop=shape&fresh=1&solo=1" 20-demoB-concept-desktop.png 1440,900
shot "script=demoB&stop=sized&fresh=1&solo=1" 21-demoB-sized-desktop.png 1440,900
shot "script=demoC&stop=preview&fresh=1&solo=1" 30-demoC-preview-desktop.png 1440,900
shot "script=demoC&stop=applied&fresh=1&solo=1" 31-demoC-applied-desktop.png 1440,900
shot "script=demoC&stop=intent2&fresh=1&solo=1" 32-demoC-compose-updated-desktop.png 1440,900
shot "script=demoC&stop=banner&fresh=1" 33-demoC-grow-banner-desktop.png 1440,900
shot "script=demoC&stop=geom&fresh=1" 34-demoC-grow-update-preview-desktop.png 1440,900
shot "script=demoC&stop=garden2&fresh=1" 35-demoC-grow-updated-plan-desktop.png 1440,900
shot "script=demoC&stop=drawer&fresh=1" 36-demoC-grow-schedule-desktop.png 1440,900
shot "script=demoC&stop=three2&fresh=1" 37-demoC-grow-updated-3d-desktop.png 1440,900
echo "done → $OUT"
