// Terrain (topography) of the site model: ONE serialisable elevation grid on project.site.terrain, read by everything that needs
// the ground — the 2D contours, the slope map, the 3D surface, the ground height of every plant object, the slope gate of the
// planting engine and the evaluation. Nothing here knows about pixels or three.js, and nothing here is a plant fact.
//
//   terrain = { schema, status: 'unknown' | 'conceptual' | 'measured',
//               source_type: 'none' | 'user-drawn-heightmap' | 'imported-grayscale' | 'procedural-demo' | 'dem',
//               origin_m: [x0, y0], extent_m: [w, h],            the site's bounding box in the model's local metres
//               elevation_range_m: [zMin, zMax] | null,          null = the heights are relative only: no metre value, no slope
//               grid: { cols, rows, values: [0…1] },             nodes; row 0 = the south edge, col 0 = the west edge
//               provenance: { source, method, assumptions: [], confirmed_by_user },
//               gate: { enabled, max_slope_pct } }               the slope planting gate — a DESIGN HEURISTIC, see HEURISTICS
//
// z is never mixed into the x/y of the 2D model: geometry stays planar, and height is always asked for with sampleZ(terrain, x, y).
// Slope, aspect, contours and low spots are derived from the grid each time; they are not stored and cannot be typed in.
// What is NOT here: drainage, soil moisture, sun exposure from aspect, cut and fill. A low spot is geometry only.

export const SCHEMA = 'planting-intelligence/terrain/0.1';
/** HEURISTICS — chosen by the implementer for this proof of concept. None is a species tolerance or a measured property of the site. */
export const HEURISTICS = {
  max_plantable_slope_pct: { value: 33, text: 'design heuristic: no plant is placed on ground steeper than this slope (default 33 %, about 1 : 3). It is a working limit for planting and upkeep chosen by the implementer — not a slope tolerance recorded for any species, and not from a source. Adjustable.' },
  cell_m: { value: 0.25, text: 'grid resolution: about one elevation node every 0.25 m (9 to 65 nodes per side)' },
  low_spot_min_m: { value: 0.02, text: 'a node counts as a potential low spot when every neighbour is at least 2 cm higher' },
  display_relief_m: { value: 1, text: 'when no elevation range is set, the 3D view draws the relative heights over a nominal 1 m — a display assumption, not a height' },
};
export const SLOPE_OPTIONS = [20, 25, 33, 50];   /* % — the choices offered for the gate */
const r4 = v => Math.round(v * 1e4) / 1e4, r2 = v => Math.round(v * 100) / 100;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function emptyTerrain() { return { schema: SCHEMA, status: 'unknown', source_type: 'none', origin_m: null, extent_m: null, elevation_range_m: null, grid: null, provenance: { source: null, method: null, assumptions: [], confirmed_by_user: false }, gate: { enabled: false, max_slope_pct: HEURISTICS.max_plantable_slope_pct.value } }; }
export const terrainOf = site => site?.terrain || null;
export const hasGrid = t => !!(t && t.grid && t.grid.values && t.grid.values.length === t.grid.cols * t.grid.rows && t.extent_m);
/** heights in metres exist only when a grid AND an elevation range exist */
export const hasMetres = t => hasGrid(t) && Array.isArray(t.elevation_range_m) && t.elevation_range_m[0] != null && t.elevation_range_m[1] != null;
export const reliefOf = t => hasMetres(t) ? r2(t.elevation_range_m[1] - t.elevation_range_m[0]) : null;
export const cellOf = t => hasGrid(t) ? [t.extent_m[0] / (t.grid.cols - 1), t.extent_m[1] / (t.grid.rows - 1)] : null;
export function gridSize(w, h) { const c = HEURISTICS.cell_m.value; return { cols: clamp(Math.round(w / c) + 1, 9, 65), rows: clamp(Math.round(h / c) + 1, 9, 65) }; }
const bboxOf = P => { const xs = P.map(p => p[0]), ys = P.map(p => p[1]); const minx = Math.min(...xs), miny = Math.min(...ys); return { minx, miny, w: Math.max(...xs) - minx, h: Math.max(...ys) - miny }; };

// ---------------------------------------------------------------- sampling: the one xy → z function
/** the relative height 0…1 at a point (bilinear between the four nodes around it; a point outside the grid reads the nearest edge) */
export function sampleNorm(t, x, y) {
  if (!hasGrid(t)) return null; const { cols, rows, values } = t.grid;
  const u = clamp((x - t.origin_m[0]) / t.extent_m[0], 0, 1) * (cols - 1), v = clamp((y - t.origin_m[1]) / t.extent_m[1], 0, 1) * (rows - 1);
  const i = Math.min(cols - 2, Math.floor(u)), j = Math.min(rows - 2, Math.floor(v)), fu = u - i, fv = v - j;
  const a = values[j * cols + i], b = values[j * cols + i + 1], c = values[(j + 1) * cols + i], d = values[(j + 1) * cols + i + 1];
  return a * (1 - fu) * (1 - fv) + b * fu * (1 - fv) + c * (1 - fu) * fv + d * fu * fv;
}
/** ground height in metres at (x, y), or null when the terrain has no grid or no elevation range. THE xy → z function. */
export function sampleZ(t, x, y) { if (!hasMetres(t)) return null; const n = sampleNorm(t, x, y); return t.elevation_range_m[0] + n * (t.elevation_range_m[1] - t.elevation_range_m[0]); }
/** the height a VIEW draws at (x, y): metres when they exist; otherwise the relative height over a nominal relief (flagged), 0 without a grid */
export function displayZ(t, x, y) { if (!hasGrid(t)) return 0; if (hasMetres(t)) return sampleZ(t, x, y) - t.elevation_range_m[0]; return sampleNorm(t, x, y) * HEURISTICS.display_relief_m.value; }
/** slope at a point from the elevation grid: rise over run by central differences one cell wide. pct = 100 × rise / run; deg = atan(rise / run).
 *  aspect_deg = the compass bearing the ground FALLS toward (0 = north, 90 = east), null on flat ground. Null without metres. */
export function slopeAt(t, x, y, northDeg = 0) {
  if (!hasMetres(t)) return null; const [cx, cy] = cellOf(t); const hx = cx / 2, hy = cy / 2;
  /* at the edge of the grid the difference is taken over the part that lies inside it (one-sided), so the slope is not understated there */
  const x0 = Math.max(t.origin_m[0], x - hx), x1 = Math.min(t.origin_m[0] + t.extent_m[0], x + hx), y0 = Math.max(t.origin_m[1], y - hy), y1 = Math.min(t.origin_m[1] + t.extent_m[1], y + hy);
  const dzdx = x1 - x0 > 1e-9 ? (sampleZ(t, x1, y) - sampleZ(t, x0, y)) / (x1 - x0) : 0, dzdy = y1 - y0 > 1e-9 ? (sampleZ(t, x, y1) - sampleZ(t, x, y0)) / (y1 - y0) : 0; const g = Math.hypot(dzdx, dzdy);
  return { pct: r2(g * 100), deg: r2(Math.atan(g) * 180 / Math.PI), ratio: g > 1e-6 ? `1 : ${r2(1 / g)}` : 'level', aspect_deg: g > 1e-4 ? r2((Math.atan2(-dzdx, -dzdy) * 180 / Math.PI + 360 - northDeg) % 360) : null, dzdx, dzdy };
}
export const COMPASS8 = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
export const aspectWord = deg => deg == null ? 'level' : COMPASS8[Math.round(deg / 45) % 8];

// ---------------------------------------------------------------- the slope planting gate (a design heuristic)
export const gateOf = t => ({ enabled: !!t?.gate?.enabled && hasMetres(t), max_slope_pct: +t?.gate?.max_slope_pct > 0 ? +t.gate.max_slope_pct : HEURISTICS.max_plantable_slope_pct.value, usable: hasMetres(t) });
/** may a plant stand at p? { ok, slope_pct, limit_pct }. Always ok when there is no terrain in metres or the gate is off. */
export function plantableAt(site, p) {
  const t = terrainOf(site); const g = gateOf(t); if (!g.enabled) return { ok: true, slope_pct: hasMetres(t) ? slopeAt(t, p[0], p[1]).pct : null, limit_pct: null };
  const s = slopeAt(t, p[0], p[1]).pct; return { ok: s <= g.max_slope_pct, slope_pct: s, limit_pct: g.max_slope_pct };
}
/** what a plant object carries about the ground under it (nothing when the terrain has no metres) */
export function groundAt(site, p) { const t = terrainOf(site); if (!hasMetres(t)) return null; const s = slopeAt(t, p[0], p[1], site.orientation?.north_angle_degrees || 0); return { z_m: r2(sampleZ(t, p[0], p[1])), slope_pct: s.pct, aspect: aspectWord(s.aspect_deg), terrain_status: t.status }; }

// ---------------------------------------------------------------- building a terrain
function make(site, source_type, status, values, cols, rows, range, provenance) {
  const B = bboxOf(site.boundary); const prev = terrainOf(site);
  return { schema: SCHEMA, status, source_type, origin_m: [r2(B.minx), r2(B.miny)], extent_m: [r2(B.w), r2(B.h)], elevation_range_m: range ? [r2(range[0]), r2(range[1])] : null, grid: { cols, rows, values: values.map(r4) }, provenance: { confirmed_by_user: false, assumptions: [], ...provenance }, gate: prev?.gate ? { ...prev.gate } : { enabled: false, max_slope_pct: HEURISTICS.max_plantable_slope_pct.value } };
}
/** normalise metre heights into the grid's 0…1 values and the range that goes with them */
function fromMetres(z) { let lo = Infinity, hi = -Infinity; for (const v of z) { if (v < lo) lo = v; if (v > hi) hi = v; } const d = hi - lo; return { values: z.map(v => d > 1e-9 ? (v - lo) / d : 0.5), range: [lo, hi] }; }
export const metresOf = t => { const [lo, hi] = t.elevation_range_m; return t.grid.values.map(v => lo + v * (hi - lo)); };

/** CONCEPTUAL FORMS — a starting shape the user edits; every number is an assumption and is listed as one. Never a measured terrain. */
export const FORMS = {
  flat: { label: 'Flat', text: 'level ground, stated as a concept', params: {} },
  'gentle-slope': { label: 'Gentle slope', text: 'one even fall across the site', params: { falls_toward: 'south', relief_m: null /* 5 % of the run when not given */ } },
  berm: { label: 'Berm', text: 'a rounded mound', params: { at: null, radius_m: null, height_m: 0.6 } },
  swale: { label: 'Swale', text: 'a shallow linear hollow', params: { axis: 'east-west', depth_m: 0.3, width_m: null } },
};
const DIRV = { north: [0, 1], south: [0, -1], east: [1, 0], west: [-1, 0], 'north-east': [.7071, .7071], 'north-west': [-.7071, .7071], 'south-east': [.7071, -.7071], 'south-west': [-.7071, -.7071] };
export function conceptual(site, form, params = {}) {
  if (!site.boundary) return null; const F = FORMS[form]; if (!F) return null; const B = bboxOf(site.boundary); const { cols, rows } = gridSize(B.w, B.h); const P = { ...F.params, ...params }; const z = new Array(cols * rows).fill(0); const assumptions = [];
  const each = fn => { for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) z[j * cols + i] = fn(B.minx + B.w * i / (cols - 1), B.miny + B.h * j / (rows - 1)); };
  if (form === 'flat') { each(() => 0); assumptions.push('level ground is a concept the user chose, not a survey'); }
  if (form === 'gentle-slope') { const d = DIRV[P.falls_toward] || DIRV.south; const run = Math.abs(d[0]) * B.w + Math.abs(d[1]) * B.h; const relief = P.relief_m ?? r2(run * 0.05); each((x, y) => -((x - B.minx - B.w / 2) * d[0] + (y - B.miny - B.h / 2) * d[1]) / run * relief); assumptions.push(`falls toward the ${P.falls_toward} by ${relief} m over ${r2(run)} m (${r2(relief / run * 100)} %) — ${params.relief_m != null ? 'relief set by the user' : 'an assumed 5 % fall'}`); }
  if (form === 'berm') { const c = P.at || [B.minx + B.w / 2, B.miny + B.h / 2]; const R = P.radius_m ?? r2(Math.min(B.w, B.h) * 0.3); each((x, y) => P.height_m * Math.exp(-((x - c[0]) ** 2 + (y - c[1]) ** 2) / (2 * (R / 2) ** 2))); assumptions.push(`a mound ${P.height_m} m high, about ${R} m in radius, centred at ${r2(c[0])}, ${r2(c[1])} m — assumed dimensions`); }
  if (form === 'swale') { const ew = P.axis !== 'north-south'; const W = P.width_m ?? r2((ew ? B.h : B.w) * 0.3); const mid = ew ? B.miny + B.h / 2 : B.minx + B.w / 2; each((x, y) => -P.depth_m * Math.exp(-(((ew ? y : x) - mid) ** 2) / (2 * (W / 2.5) ** 2))); assumptions.push(`a hollow ${P.depth_m} m deep, about ${W} m wide, running ${ew ? 'east–west' : 'north–south'} through the middle — assumed dimensions; no drainage is implied`); }
  const n = fromMetres(z); const flat = form === 'flat';
  return make(site, 'procedural-demo', 'conceptual', flat ? z.map(() => 0.5) : n.values, cols, rows, flat ? [0, 0] : [0, n.range[1] - n.range[0]], { source: `conceptual form: ${F.label}`, method: `generated from the form “${F.label}” on a ${cols} × ${rows} grid`, form, form_params: P, assumptions });
}
/** GRAYSCALE HEIGHTMAP — black = low, white = high. `img` = { data (RGBA bytes), width, height }. The image is stretched over the site's
 *  bounding box (its top edge is the north edge). `stats` says what the pixels are; whether the picture IS a heightmap only the user knows. */
export function imageStats(img) {
  const { data, width, height } = img; const n = width * height; let colour = 0, lo = 255, hi = 0; const seen = new Set(); const step = Math.max(1, Math.floor(n / 40000));
  let count = 0; for (let k = 0; k < n; k += step) { const r = data[k * 4], g = data[k * 4 + 1], b = data[k * 4 + 2]; if (Math.max(r, g, b) - Math.min(r, g, b) > 12) colour++; const l = Math.round(.299 * r + .587 * g + .114 * b); if (l < lo) lo = l; if (l > hi) hi = l; seen.add(l); count++; }
  const colour_share = r4(colour / count); return { width, height, colour_share, grayscale: colour_share < 0.02, levels: seen.size, luminance_range: [lo, hi] };
}
/** what the page may do with an uploaded picture. A colour picture is never read as elevation. A grayscale one MAY be a heightmap — or a
 *  black-and-white photograph: the pixels cannot tell, so it is used only after the user says it is a heightmap. Nothing is "recognised". */
export function classifyImage(stats) {
  if (!stats.grayscale) return { use: 'reference-only', analysed: false, text: `This picture has colour (${Math.round(stats.colour_share * 100)} % of the sampled pixels): it is kept as a reference and is not analysed. Brightness in a photograph is light and material, not height.` };
  if (stats.levels < 3 || stats.luminance_range[1] - stats.luminance_range[0] < 8) return { use: 'reference-only', analysed: false, text: 'This picture is one flat grey: there is no height information in it.' };
  return { use: 'needs-confirmation', analysed: false, text: 'This picture is grayscale. It can be read as a heightmap (black = low, white = high) only if that is what it is — a black-and-white photograph looks the same to this page. Confirm it is a heightmap to use it.' };
}
export function fromImage(site, img, { confirmed = false, range = null, name = 'image' } = {}) {
  if (!site.boundary) return null; const stats = imageStats(img); const cls = classifyImage(stats); if (cls.use !== 'needs-confirmation' || !confirmed) return { terrain: null, stats, classification: cls };
  const B = bboxOf(site.boundary); const { cols, rows } = gridSize(B.w, B.h); const { data, width, height } = img; const lum = (px, py) => { const k = (clamp(Math.round(py), 0, height - 1) * width + clamp(Math.round(px), 0, width - 1)) * 4; return (.299 * data[k] + .587 * data[k + 1] + .114 * data[k + 2]) / 255; };
  const values = []; const fx = (width - 1) / (cols - 1), fy = (height - 1) / (rows - 1);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let s = 0, m = 0; for (const dy of [-.33, 0, .33]) for (const dx of [-.33, 0, .33]) { s += lum((i + dx) * fx, (rows - 1 - j + dy) * fy); m++; } values.push(s / m); }   /* row 0 of the grid is the south edge = the bottom of the picture */
  const t = make(site, 'imported-grayscale', 'conceptual', values, cols, rows, range, { source: `uploaded image “${name}” (${width} × ${height} px)`, method: `luminance resampled to a ${cols} × ${rows} grid, stretched over the site's bounding box; black = low, white = high`, confirmed_by_user: true, assumptions: ['the user confirmed the picture is a heightmap; the page did not verify it', 'the picture is assumed to cover exactly the site\'s bounding box with north up', range ? `elevation range ${range[0]}–${range[1]} m set by the user` : 'no elevation range set: heights are relative only, no slope in % can be computed'] });
  return { terrain: t, stats, classification: cls };
}
/** a measured grid (a DEM tile already cut to the site): metres in, row 0 = south. The only way a terrain becomes 'measured'. */
export function fromDem(site, { cols, rows, z, source }) { if (!site.boundary || z.length !== cols * rows) return null; const n = fromMetres(z); return make(site, 'dem', 'measured', n.values, cols, rows, n.range, { source: source || 'elevation grid', method: `elevation grid ${cols} × ${rows}, metres, placed over the site's bounding box`, confirmed_by_user: true, assumptions: ['the grid is assumed to be georeferenced to the site outline by whoever supplied it'] }); }

// ---------------------------------------------------------------- editing (each returns a NEW terrain; the caller commits it)
const clone = t => JSON.parse(JSON.stringify(t));
const edited = (t, how) => { const n = clone(t); if (n.source_type !== 'dem') n.source_type = n.source_type === 'imported-grayscale' ? 'imported-grayscale' : 'user-drawn-heightmap'; if (n.status === 'measured') n.status = 'conceptual'; n.provenance = { ...n.provenance, edits: [...(n.provenance.edits || []), how].slice(-12) }; if (t.status === 'measured') n.provenance.assumptions = [...n.provenance.assumptions, 'edited by hand after import: no longer a measured terrain']; return n; };
/** raise (+) or lower (−) the ground under a soft round brush. With an elevation range the amount is metres and the range follows the
 *  result; without one the amount is a share of the relative range. */
export function brush(t, at, radius_m, amount) {
  if (!hasGrid(t)) return t; const n = edited(t, `brush ${amount > 0 ? '+' : ''}${amount}${hasMetres(t) ? ' m' : ''} at ${r2(at[0])}, ${r2(at[1])} m, radius ${radius_m} m`); const { cols, rows } = n.grid; const m = hasMetres(t); const z = m ? metresOf(t) : t.grid.values.slice(); const s = radius_m / 2;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = t.origin_m[0] + t.extent_m[0] * i / (cols - 1), y = t.origin_m[1] + t.extent_m[1] * j / (rows - 1); const d2 = (x - at[0]) ** 2 + (y - at[1]) ** 2; if (d2 > (radius_m * 1.5) ** 2) continue; z[j * cols + i] += amount * Math.exp(-d2 / (2 * s * s)); }
  if (m) { const f = fromMetres(z); n.grid.values = f.values.map(r4); n.elevation_range_m = [r2(f.range[0]), r2(f.range[1])]; } else n.grid.values = z.map(v => r4(clamp(v, 0, 1)));
  return n;
}
/** set the elevation range the relative heights stand for (zMin < zMax), or null to say it is not known */
export function setRange(t, range) { const n = edited(t, range ? `elevation range set to ${range[0]}–${range[1]} m` : 'elevation range cleared'); n.elevation_range_m = range && range[1] >= range[0] ? [r2(range[0]), r2(range[1])] : null; n.provenance.assumptions = n.provenance.assumptions.filter(a => !/elevation range|relative only/.test(a)).concat(range ? [`elevation range ${range[0]}–${range[1]} m set by the user`] : ['no elevation range set: heights are relative only']); return n; }
export function setGate(t, patch) { const n = clone(t); n.gate = { ...gateOf(t), ...patch }; delete n.gate.usable; n.gate.enabled = !!n.gate.enabled; return n; }
/** the site outline changed: the same surface is resampled over the new bounding box (nothing is invented outside the old one: the edge is extended) */
export function refit(t, site) { if (!hasGrid(t) || !site.boundary) return t; const B = bboxOf(site.boundary); if (Math.abs(B.minx - t.origin_m[0]) < .005 && Math.abs(B.miny - t.origin_m[1]) < .005 && Math.abs(B.w - t.extent_m[0]) < .005 && Math.abs(B.h - t.extent_m[1]) < .005) return t; const { cols, rows } = gridSize(B.w, B.h); const values = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) values.push(r4(sampleNorm(t, B.minx + B.w * i / (cols - 1), B.miny + B.h * j / (rows - 1)))); const n = clone(t); n.origin_m = [r2(B.minx), r2(B.miny)]; n.extent_m = [r2(B.w), r2(B.h)]; n.grid = { cols, rows, values }; n.provenance.assumptions = [...n.provenance.assumptions.filter(a => !/resampled/.test(a)), 'resampled to the changed site outline; ground beyond the earlier outline repeats its edge']; return n; }
// history: the terrain has its own undo stack on the site (capped), so Undo in the Terrain view never touches beds or the outline
export function commit(site, next, label) { const h = site.terrain_history || (site.terrain_history = []); h.push({ label, terrain: site.terrain ? clone(site.terrain) : null }); if (h.length > 20) h.shift(); site.terrain = next; return next; }
export function undo(site) { const h = site.terrain_history || []; const s = h.pop(); if (!s) return null; site.terrain = s.terrain; return s; }
export function reset(site) { return commit(site, emptyTerrain(), 'reset: elevation unknown'); }

// ---------------------------------------------------------------- derived analysis (recomputed from the grid, never stored)
/** a short fingerprint of everything the engine reads from the terrain (null without a grid): part of the preview fingerprint */
export function fingerprint(t) { if (!hasGrid(t)) return null; const s = JSON.stringify([t.origin_m, t.extent_m, t.elevation_range_m, t.grid.cols, t.grid.rows, t.grid.values, t.gate?.enabled && hasMetres(t) ? t.gate.max_slope_pct : null]); let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return `t-${h.toString(36)}`; }
/** slope over an area: sampled every `step` m at the points `inside` accepts. → { samples, mean_pct, max_pct, steep_share, steep_m2 } */
export function slopeStats(t, B, inside = () => true, limit_pct = null, step = 0.1) {
  if (!hasMetres(t)) return null; let n = 0, sum = 0, max = 0, steep = 0; for (let y = B.miny + step / 2; y < B.maxy; y += step) for (let x = B.minx + step / 2; x < B.maxx; x += step) { if (!inside([x, y])) continue; const s = slopeAt(t, x, y).pct; n++; sum += s; if (s > max) max = s; if (limit_pct != null && s > limit_pct) steep++; }
  return n ? { samples: n, mean_pct: r2(sum / n), max_pct: r2(max), steep_share: limit_pct != null ? r4(steep / n) : null, steep_m2: limit_pct != null ? r2(steep * step * step) : null, limit_pct } : null;
}
/** POTENTIAL low spots: interior nodes lower than all eight neighbours. Geometry only — whether water collects there depends on soil,
 *  the surroundings and drains, none of which the model holds. */
export function lowSpots(t) {
  if (!hasMetres(t)) return []; const { cols, rows } = t.grid; const z = metresOf(t); const out = []; const eps = HEURISTICS.low_spot_min_m.value;
  for (let j = 1; j < rows - 1; j++) for (let i = 1; i < cols - 1; i++) { const v = z[j * cols + i]; let low = true, rim = Infinity; for (let dj = -1; dj <= 1 && low; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const w = z[(j + dj) * cols + i + di]; if (w < v + eps) { low = false; break; } if (w < rim) rim = w; } if (low) out.push({ position_m: [r2(t.origin_m[0] + t.extent_m[0] * i / (cols - 1)), r2(t.origin_m[1] + t.extent_m[1] * j / (rows - 1))], z_m: r2(v), depth_m: r2(rim - v) }); }
  return out;
}
/** broad hollows the eight-neighbour test misses (a swale has no single lowest node): the lowest 5 % of the nodes, when the relief is real */
export function lowGround(t) { if (!hasMetres(t) || reliefOf(t) < 0.05) return null; const cut = t.elevation_range_m[0] + reliefOf(t) * 0.1; const { cols, rows } = t.grid; const z = metresOf(t); const pts = []; for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (z[j * cols + i] <= cut) pts.push([r2(t.origin_m[0] + t.extent_m[0] * i / (cols - 1)), r2(t.origin_m[1] + t.extent_m[1] * j / (rows - 1))]); return { below_m: r2(cut), nodes: pts.length, share: r4(pts.length / (cols * rows)), points: pts }; }
export function analyse(site) {
  const t = terrainOf(site); if (!hasGrid(t)) return { status: 'unknown', has_grid: false, has_metres: false, text: 'Elevation unknown. No slope, no aspect, no low spots — nothing is assumed about the ground.' };
  if (!hasMetres(t)) return { status: t.status, has_grid: true, has_metres: false, source_type: t.source_type, text: 'Relative heights only: no elevation range is set, so no height in metres and no slope can be computed.' };
  const B = { minx: t.origin_m[0], miny: t.origin_m[1], maxx: t.origin_m[0] + t.extent_m[0], maxy: t.origin_m[1] + t.extent_m[1] }; const g = gateOf(t); const inSite = site.boundary ? p => pip(p, site.boundary) : () => true;
  const s = slopeStats(t, B, inSite, g.max_slope_pct, 0.1) || { mean_pct: 0, max_pct: 0, steep_share: 0, steep_m2: 0 }; const cx = B.minx + t.extent_m[0] / 2, cy = B.miny + t.extent_m[1] / 2;
  /* the general fall: the mean gradient over the site */
  let gx = 0, gy = 0, n = 0; for (let y = B.miny + .25; y < B.maxy; y += .5) for (let x = B.minx + .25; x < B.maxx; x += .5) { const q = slopeAt(t, x, y); gx += q.dzdx; gy += q.dzdy; n++; } gx /= n || 1; gy /= n || 1; const gm = Math.hypot(gx, gy); const north = site.orientation?.north_angle_degrees || 0;
  return { status: t.status, has_grid: true, has_metres: true, source_type: t.source_type, relief_m: reliefOf(t), elevation_range_m: t.elevation_range_m, slope: s, general_fall: gm > 0.005 ? { pct: r2(gm * 100), toward: aspectWord((Math.atan2(-gx, -gy) * 180 / Math.PI + 360 - north) % 360) } : null, centre_z_m: r2(sampleZ(t, cx, cy)), low_spots: lowSpots(t), low_ground: lowGround(t), gate: g, fingerprint: fingerprint(t), text: null };
}
function pip([x, y], P) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; }

// ---------------------------------------------------------------- contours (marching squares over the same grid)
const NICE = [0.02, 0.05, 0.1, 0.2, 0.25, 0.5, 1, 2, 5, 10];
export function contourInterval(t) { if (!hasMetres(t)) return null; const r = reliefOf(t); if (r <= 0) return null; return NICE.find(n => r / n <= 10) || 10; }
/** contour lines as segments in site metres: [{ level (m, or 0…1 when relative), index (every 5th line), a: [x, y], b: [x, y] }] */
export function contours(t, interval = null) {
  if (!hasGrid(t)) return []; const m = hasMetres(t); const { cols, rows, values } = t.grid; let levels = [];
  if (m) { const iv = interval || contourInterval(t); if (!iv) return []; const [lo, hi] = t.elevation_range_m; for (let k = Math.ceil((lo + 1e-9) / iv); k * iv < hi - 1e-9; k++) levels.push({ level: r2(k * iv), v: (k * iv - lo) / (hi - lo), index: k % 5 === 0 }); }
  else for (let k = 1; k < 10; k++) levels.push({ level: k / 10, v: k / 10, index: k === 5 });
  const X = i => t.origin_m[0] + t.extent_m[0] * i / (cols - 1), Y = j => t.origin_m[1] + t.extent_m[1] * j / (rows - 1); const out = [];
  for (const L of levels) for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
    const a = values[j * cols + i], b = values[j * cols + i + 1], c = values[(j + 1) * cols + i + 1], d = values[(j + 1) * cols + i]; const v = L.v;
    const idx = (a > v ? 1 : 0) | (b > v ? 2 : 0) | (c > v ? 4 : 0) | (d > v ? 8 : 0); if (idx === 0 || idx === 15) continue;
    const e = k => { const f = (p, q) => (v - p) / ((q - p) || 1e-9); return k === 0 ? [X(i) + (X(i + 1) - X(i)) * f(a, b), Y(j)] : k === 1 ? [X(i + 1), Y(j) + (Y(j + 1) - Y(j)) * f(b, c)] : k === 2 ? [X(i) + (X(i + 1) - X(i)) * f(d, c), Y(j + 1)] : [X(i), Y(j) + (Y(j + 1) - Y(j)) * f(a, d)]; };
    const seg = (p, q) => out.push({ level: L.level, index: L.index, a: e(p), b: e(q) });
    switch (idx) { case 1: case 14: seg(3, 0); break; case 2: case 13: seg(0, 1); break; case 3: case 12: seg(3, 1); break; case 4: case 11: seg(1, 2); break; case 6: case 9: seg(0, 2); break; case 7: case 8: seg(3, 2); break; case 5: seg(3, 0); seg(1, 2); break; case 10: seg(0, 1); seg(3, 2); break; }
  }
  return out;
}
/** one line of words for a terrain: what it is and how far it can be trusted */
export function describe(t) {
  if (!hasGrid(t)) return { label: 'Elevation unknown', tone: 'unknown', text: 'No terrain has been given. The plan is drawn without heights; the 3D view stands on a flat display plane, which is a drawing assumption and says nothing about the ground.' };
  const src = { 'procedural-demo': 'conceptual form', 'user-drawn-heightmap': 'drawn by hand', 'imported-grayscale': 'uploaded heightmap', dem: 'elevation grid' }[t.source_type] || t.source_type;
  if (!hasMetres(t)) return { label: 'Relative heights', tone: 'conceptual', text: `${src}: the shape of the ground is set, its height in metres is not. Set the elevation range to get heights, slope and the planting gate.` };
  return { label: t.status === 'measured' ? 'Measured terrain' : 'Conceptual terrain', tone: t.status, text: `${src}; relief ${reliefOf(t)} m (${t.elevation_range_m[0]}–${t.elevation_range_m[1]} m). ${t.status === 'measured' ? 'Supplied as measured elevation.' : 'A concept the user set — not a survey.'}` };
}
