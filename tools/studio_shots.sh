#!/bin/sh
# Headless-Chrome screenshots of the studio integration (2026-11-14). Each URL replays one of the two demonstration
# scripts (js/app.js: studioA, studioB) to a stop point and captures the page. Needs the design server running:
#   python3 -I tools/design_server.py --port 8768      then      sh tools/studio_shots.sh [out-dir] [WxH] [base-url]
OUT="${1:-brain/screenshots/studio}"
SIZE="${2:-1440,900}"
URL="${3:-http://127.0.0.1:8768}"
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p "$OUT"
shot() {
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion --window-size="$SIZE" --virtual-time-budget="${3:-9000}" --screenshot="$OUT/$1.png" "$URL/design/index.html?$2" >/dev/null 2>&1
  echo "$OUT/$1.png"
}
shot 01-imagine                 "fresh=1"
shot 02-shape-concept           "fresh=1&script=studioB&stop=sketch"
shot 03-shape-concept-placed    "fresh=1&script=studioB&stop=placed"
shot 04-shape-scaled            "fresh=1&script=studioB&stop=sized"
shot 05-shape-proposal          "fresh=1&script=studioA&stop=site"
shot 06-shape-compare-layout    "fresh=1&script=studioA&stop=compare"
shot 07-shape-bed-selected      "fresh=1&script=studioA&stop=bed"
shot 08-compose-function-plan   "fresh=1&script=studioA&stop=compose"
shot 09-compose-bed-arrangement "fresh=1&script=studioA&stop=composeBed"
shot 10-grow                    "fresh=1&script=studioA&stop=garden" 14000
shot 11-compose-demo-b          "fresh=1&script=studioB&stop=compose"
