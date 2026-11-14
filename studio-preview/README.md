# Studio preview

A self-contained static build of the design studio, published for review beside the production site.

- built from `design/studio-ux-complete @ 8557422 · built 2026-11-14` by `tools/build_preview.py`
- production site: `/design/` (unchanged by this folder)
- everything the page loads is inside this folder: `index.html`, `css/`, `js/`, `vendor/` (polygon-clipping, three.js), `data/explorer.json`
- no server: language is read by the offline rules; the address lookup calls OpenStreetMap Nominatim from the browser
- the preview saves its project under its own browser-storage key, apart from the production site's

Do not edit files here by hand: change `design/` on the development branch and rebuild.
