// 3D garden: three r186 (MIT, vendored in brain/vendor/three) + OrbitControls (three examples, MIT). Every object is built
// from the same DesignVersion the 2D plan draws — plant ids, positions (x east, y north → z = −north), crown radius and
// height proxies from the claims — through the form recipes of plantforms.js. Geometry is a stylised botanical proxy
// (flat-shaded primitives), never a rendering of a real plant; unknown heights are drawn at a nominal height and dashed-looking
// (translucent). Click → the plant id goes back to the app (evidence); preview removals show as red wire, additions glow.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { form, mixHex } from './render.js';
import { seeded, PALETTE } from './plantforms.js';
import * as G from './geom.js';

const toV = (p, z = 0) => new THREE.Vector3(p[0], z, -p[1]);
const col = h => new THREE.Color(h);
const flat = (hex, extra = {}) => new THREE.MeshStandardMaterial({ color: col(hex), flatShading: true, roughness: .85, metalness: 0, ...extra });

export class Garden {
  constructor(container, { K, onSelect, onHover }) {
    this.el = container; this.K = K; this.onSelect = onSelect; this.onHover = onHover; this.key = null; this.plantMeshes = new Map(); this.labelSprites = []; this.hover = null;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'default', failIfMajorPerformanceCaveat: false }); renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0xf6f4ee, 1);
    container.appendChild(renderer.domElement); this.renderer = renderer;
    this.scene = new THREE.Scene(); this.scene.fog = new THREE.Fog(0xf6f4ee, 22, 60);
    this.camera = new THREE.PerspectiveCamera(42, 1, .1, 200); this.camera.position.set(9, 7, 11);
    this.controls = new OrbitControls(this.camera, renderer.domElement); this.controls.enableDamping = true; this.controls.dampingFactor = .08; this.controls.maxPolarAngle = Math.PI / 2 - .04; this.controls.minDistance = 2; this.controls.maxDistance = 40; this.controls.target.set(3, 0, -2);
    this.scene.add(new THREE.HemisphereLight(0xfff6e6, 0xcfd8c4, .95));
    const sun = new THREE.DirectionalLight(0xfff2dc, 1.6); sun.position.set(-8, 14, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.camera.left = -14; sun.shadow.camera.right = 14; sun.shadow.camera.top = 14; sun.shadow.camera.bottom = -14; sun.shadow.camera.near = 1; sun.shadow.camera.far = 50; sun.shadow.bias = -.0008; this.scene.add(sun); this.sun = sun;
    const fill = new THREE.DirectionalLight(0xdfe8f5, .35); fill.position.set(10, 6, -8); this.scene.add(fill);
    this.static = new THREE.Group(); this.plants = new THREE.Group(); this.overlay = new THREE.Group(); this.scene.add(this.static, this.plants, this.overlay);
    this.ray = new THREE.Raycaster(); this.pointer = new THREE.Vector2(); this.down = null;
    renderer.domElement.addEventListener('pointerdown', e => { this.down = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => { if (!this.down || Math.hypot(e.clientX - this.down[0], e.clientY - this.down[1]) > 4) return; const id = this.pick(e); this.onSelect?.(id); });
    renderer.domElement.addEventListener('pointermove', e => { const id = this.pick(e); if (id !== this.hover) { this.hover = id; renderer.domElement.style.cursor = id ? 'pointer' : ''; this.onHover?.(id, e); } });
    this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(container); this.resize();
    this.running = true; const loop = () => { if (!this.running) return; this.controls.update(); if (this.visible) this.renderer.render(this.scene, this.camera); requestAnimationFrame(loop); }; loop();
    this.visible = true;
  }
  resize() { const w = this.el.clientWidth || 800, h = this.el.clientHeight || 500; this.renderer.setSize(w, h, false); this.renderer.domElement.style.width = '100%'; this.renderer.domElement.style.height = '100%'; this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  setVisible(v) { this.visible = v; this.el.style.display = v ? 'block' : 'none'; if (v) { this.resize(); this.renderer.render(this.scene, this.camera); } }
  pick(e) { const r = this.renderer.domElement.getBoundingClientRect(); this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); this.ray.setFromCamera(this.pointer, this.camera); const hits = this.ray.intersectObjects(this.plants.children, true); for (const h of hits) { let o = h.object; while (o && !o.userData.plantId) o = o.parent; if (o?.userData.plantId) return o.userData.plantId; } return null; }
  stats() { return { plants: this.plantMeshes.size, meshes: this.scene.children.reduce((n, c) => n + countMeshes(c), 0) }; }
  focus(id) { const g = this.plantMeshes.get(id); if (!g) return; const p = g.position.clone(); this.controls.target.copy(p); }
  frame(project) { const pts = [...(project.site.boundary || []), ...project.site.beds.flatMap(b => b.polygon)]; if (!pts.length) return; const B = G.bbox(pts); const c = [B.minx + B.w / 2, B.miny + B.h / 2]; const d = Math.max(B.w, B.h); this.controls.target.set(c[0], 0.3, -c[1]); this.camera.position.set(c[0] + d * .9, d * .95 + 1.5, -c[1] + d * 1.55); this.controls.update(); }

  // ---------------------------------------------------------------- scene from the model (static parts rebuilt on site change, plants on version/preview change)
  sync(project, version, S) {
    const siteKey = JSON.stringify([project.site.boundary, project.site.beds.map(b => [b.polygon, b.holes, b.status]), project.site.features]);
    if (this.siteKey !== siteKey) { this.siteKey = siteKey; this.buildStatic(project); if (!this.framed) { this.frame(project); this.framed = true; } }
    const plants = S.preview ? S.preview.version.plant_objects : (version?.plant_objects || []); const removed = S.preview ? S.preview.diff.removed : []; const added = new Set(S.preview?.diff.added || []); const targets = new Set(S.preview?.targets || []);
    const key = JSON.stringify([version?.id, plants.map(p => [p.id, p.species_id, p.position_m]), removed, [...added], [...targets], S.winter, S.labels, S.selectedPlant, project.site.conditions.light?.value]);
    if (key === this.key) return; this.key = key;
    clear(this.plants); clear(this.overlay); this.plantMeshes.clear();
    const light = project.site.conditions.light?.value;
    for (const p of plants) { const f = form(this.K, p.species_id, light); const g = buildPlant(f, p, { winter: S.winter }); g.position.copy(toV(p.position_m)); g.userData.plantId = p.id; this.plants.add(g); this.plantMeshes.set(p.id, g); if (added.has(p.id)) ring(this.overlay, p, 0x44604a, .9); else if (targets.has(p.id)) ring(this.overlay, p, 0xc08a2e, .7); if (S.selectedPlant === p.id) ring(this.overlay, p, 0x2a2723, 1, .08); if (S.labels) this.overlay.add(label(this.K.name(p.species_id), toV(p.position_m, (p.height_m ?? .5) + .35))); }
    if (S.preview && version) for (const id of removed) { const p = version.plant_objects.find(q => q.id === id); if (!p) continue; const f = form(this.K, p.species_id, light); const g = buildPlant(f, p, { winter: S.winter, ghost: true }); g.position.copy(toV(p.position_m)); this.overlay.add(g); }
    if (S.selectedPlant && this.plantMeshes.has(S.selectedPlant) === false && S.labels === false) { /* nothing */ }
    if (this.visible) this.renderer.render(this.scene, this.camera);
  }
  buildStatic(project) {
    clear(this.static); const site = project.site; const pts = [...(site.boundary || []), ...site.beds.flatMap(b => b.polygon)]; const B = pts.length ? G.bbox(pts) : { minx: 0, miny: 0, maxx: 8, maxy: 6, w: 8, h: 6 };
    // graph-paper ground, far beyond the site
    const gw = Math.max(40, B.w * 6), gh = Math.max(40, B.h * 6); const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshStandardMaterial({ map: paperTexture(gw, gh), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.position.set(B.minx + B.w / 2, -.005, -(B.miny + B.h / 2)); ground.receiveShadow = true; this.static.add(ground);
    if (site.boundary) { const lawn = shapeMesh(site.boundary, flat('#d9dec6', { roughness: 1 }), .004); lawn.receiveShadow = true; this.static.add(lawn); this.static.add(outline(site.boundary, 0x5f5a52, .02)); }
    for (const b of site.beds) { if (b.status === 'rejected') continue; const soil = shapeMesh(b.polygon, flat('#a98f6f', { roughness: 1 }), .03, .06, b.holes); soil.receiveShadow = true; soil.castShadow = true; this.static.add(soil); this.static.add(outline(b.polygon, 0x5f7f62, .095)); for (const h of b.holes || []) this.static.add(outline(h, 0x5f7f62, .095)); }
    for (const f of site.features) {
      if (f.kind === 'no-plant-zone' && f.polygon) { const m = shapeMesh(f.polygon, flat('#e6e2d6', { roughness: 1 }), .012); this.static.add(m); this.static.add(outline(f.polygon, 0x9a948a, .02)); }
      if (f.kind === 'existing-tree') { const r = f.radius_m ?? 1.5; const g = buildTree({ foliage: '#4a6a4c', accent: null, density: 1, evergreen: null, id: f.id }, r, Math.max(3, r * 2.6), { nominal: f.radius_m == null }); g.position.copy(toV(f.position_m)); g.userData.feature = f.id; this.static.add(g); this.static.add(label(`${f.label || 'existing tree'} · ${f.radius_m == null ? 'canopy assumed' : 'canopy stated'}`, toV(f.position_m, Math.max(3, r * 2.6) + .5))); }
    }
    this.sun.target.position.set(B.minx + B.w / 2, 0, -(B.miny + B.h / 2)); this.scene.add(this.sun.target);
  }
  dispose() { this.running = false; this.ro.disconnect(); this.renderer.dispose(); }
}

// ---------------------------------------------------------------- builders (stylised proxies)
function buildPlant(f, p, opts = {}) {
  const r = Math.max(.12, p.proxy_radius_m); const unknownH = p.height_m == null; const h = unknownH ? (f.kind === 'tree' ? r * 2.2 : f.kind === 'ground' ? .25 : r * 1.2) : Math.max(.12, p.height_m);
  const winter = opts.winter && f.evergreen === false; const fol = winter ? PALETTE.deciduousWinter : f.foliage;
  let g; const rec = { ...f, foliage: fol, id: p.id, ghost: opts.ghost, nominal: unknownH, winter };
  if (f.kind === 'tree') g = buildTree(rec, r, h, { nominal: unknownH, ghost: opts.ghost, winter }); else if (f.kind === 'shrub') g = buildShrub(rec, r, h); else if (f.kind === 'fern') g = buildFern(rec, r, h); else if (f.kind === 'herb') g = buildHerb(rec, r, h); else g = buildGround(rec, r, h);
  g.traverse(o => { if (o.isMesh) { o.castShadow = !opts.ghost; o.receiveShadow = !opts.ghost; if (opts.ghost) { o.material = new THREE.MeshBasicMaterial({ color: 0xb4553a, wireframe: true, transparent: true, opacity: .55 }); } else if (unknownH) { o.material = o.material.clone(); o.material.transparent = true; o.material.opacity = .55; } } });
  g.userData.height_status = unknownH ? 'nominal (unknown)' : 'claim proxy'; return g;
}
function buildTree(rec, r, h, opts = {}) {
  const g = new THREE.Group(); const rand = seeded(rec.id); const trunkH = h * .38; const bark = flat(mixHex(rec.foliage || '#4f7a4a', '#3a2a1c', .75));
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(r * .07, r * .11, trunkH, 7), bark); trunk.position.y = trunkH / 2; g.add(trunk);
  const crownMat = flat(rec.foliage || '#4f7a4a'); const n = rec.winter ? 0 : 4 + Math.round(rand() * 2);
  if (rec.winter) { for (let i = 0; i < 7; i++) { const a = rand() * Math.PI * 2, t = .4 + rand() * .5; const br = new THREE.Mesh(new THREE.CylinderGeometry(.015, .035, h * .6, 5), flat(PALETTE.winterTwig)); br.position.set(Math.cos(a) * r * .35 * t, trunkH + h * .25, Math.sin(a) * r * .35 * t); br.rotation.set(Math.cos(a) * .7, 0, -Math.sin(a) * .7); g.add(br); } }
  for (let i = 0; i < n; i++) { const t = i / Math.max(1, n - 1); const rr = r * (0.55 + 0.5 * Math.sin(Math.PI * (0.25 + t * .6))) * (0.9 + rand() * .2); const y = trunkH + (h - trunkH) * (0.15 + t * .7); const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 1), i % 2 ? crownMat : flat(mixHex(rec.foliage || '#4f7a4a', '#ffffff', .12))); m.position.set((rand() - .5) * r * .3, y, (rand() - .5) * r * .3); m.scale.y = .72; g.add(m); }
  if (rec.accent && !rec.winter) for (let i = 0; i < 10; i++) { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * .8; const dot = new THREE.Mesh(new THREE.IcosahedronGeometry(r * .07, 0), flat(rec.accent)); dot.position.set(Math.cos(a) * d, trunkH + (h - trunkH) * (0.4 + rand() * .5), Math.sin(a) * d); g.add(dot); }
  return g;
}
function buildShrub(rec, r, h) {
  const g = new THREE.Group(); const rand = seeded(rec.id); const n = rec.density > 1 ? 7 : 5; const mat = flat(rec.foliage), mat2 = flat(mixHex(rec.foliage, '#ffffff', .14)), mat3 = flat(mixHex(rec.foliage, '#1f2a1c', .18));
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rand() * .4, d = r * (0.35 + rand() * .2); const rr = r * (0.5 + rand() * .2); const m = new THREE.Mesh(new THREE.IcosahedronGeometry(rr, 1), [mat, mat2, mat3][i % 3]); m.position.set(Math.cos(a) * d, h * (0.45 + rand() * .2), Math.sin(a) * d); m.scale.set(1, h / r * .55 / (rec.upright ? .8 : 1), 1); g.add(m); }
  const top = new THREE.Mesh(new THREE.IcosahedronGeometry(r * .55, 1), mat2); top.position.y = h * .78; top.scale.y = .7; g.add(top);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * .5, r * .7, h * .3, 8), mat3); base.position.y = h * .15; g.add(base);
  if (rec.accent) for (let i = 0; i < 8; i++) { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * .85; const dot = new THREE.Mesh(new THREE.IcosahedronGeometry(r * .08, 0), flat(rec.accent)); dot.position.set(Math.cos(a) * d, h * (0.5 + rand() * .45), Math.sin(a) * d); g.add(dot); }
  return g;
}
function buildFern(rec, r, h) {
  const g = new THREE.Group(); const rand = seeded(rec.id); const n = 11; const mat = flat(rec.foliage), mat2 = flat(mixHex(rec.foliage, '#1f2a1c', .22));
  const frond = new THREE.ConeGeometry(r * .13, r * 1.05, 4); frond.translate(0, r * .52, 0);
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + rand() * .3; const m = new THREE.Mesh(frond, i % 2 ? mat : mat2); m.position.y = .05; m.rotation.set(0, -a, Math.PI / 2 - (0.55 + rand() * .35)); m.rotation.order = 'YXZ'; m.scale.y = (0.85 + rand() * .3) * Math.min(1.4, h / r); g.add(m); }
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(r * .18, 0), mat2); crown.position.y = r * .12; g.add(crown); return g;
}
function buildHerb(rec, r, h) {
  const g = new THREE.Group(); const rand = seeded(rec.id); const mat = flat(rec.foliage), mat2 = flat(mixHex(rec.foliage, '#ffffff', .16));
  const mound = new THREE.Mesh(new THREE.IcosahedronGeometry(r * .8, 1), mat); mound.scale.set(1, Math.max(.18, h * .35 / r), 1); mound.position.y = h * .18; g.add(mound);
  const stems = rec.accent ? 7 : 4; const stemGeo = new THREE.CylinderGeometry(.012, .018, h, 5);
  for (let i = 0; i < stems; i++) { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * .6; const s = new THREE.Mesh(stemGeo, mat2); s.position.set(Math.cos(a) * d, h / 2, Math.sin(a) * d); s.rotation.set((rand() - .5) * .2, 0, (rand() - .5) * .2); g.add(s); if (rec.accent) { const head = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.max(.04, r * .16), 0), flat(rec.accent)); head.position.set(Math.cos(a) * d, h, Math.sin(a) * d); head.scale.y = .55; g.add(head); } else { const head = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.max(.03, r * .1), 0), mat2); head.position.set(Math.cos(a) * d, h, Math.sin(a) * d); g.add(head); } }
  return g;
}
function buildGround(rec, r, h) {
  const g = new THREE.Group(); const rand = seeded(rec.id); const mat = flat(rec.foliage), mat2 = flat(mixHex(rec.foliage, '#ffffff', .14)); const hh = Math.max(.08, Math.min(h, .45));
  for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + rand() * .5, d = i ? r * .4 : 0; const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r * (i ? .5 : .7), 1), i % 2 ? mat : mat2); m.position.set(Math.cos(a) * d, hh * .45, Math.sin(a) * d); m.scale.y = hh / r * .9; g.add(m); }
  if (rec.accent) for (let i = 0; i < 6; i++) { const a = rand() * Math.PI * 2, d = Math.sqrt(rand()) * r * .85; const dot = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.max(.025, r * .07), 0), flat(rec.accent)); dot.position.set(Math.cos(a) * d, hh * .9, Math.sin(a) * d); g.add(dot); }
  return g;
}
// ---------------------------------------------------------------- helpers
function shapeMesh(polygon, material, y = 0, thickness = 0, holes = []) {
  const sh = new THREE.Shape(polygon.map(p => new THREE.Vector2(p[0], p[1]))); for (const h of holes || []) sh.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1]))));   // rotated −90° about X: shape (x, y_north) → world (x, 0, −y_north) = toV
  const geo = thickness ? new THREE.ExtrudeGeometry(sh, { depth: thickness, bevelEnabled: false }) : new THREE.ShapeGeometry(sh);
  const m = new THREE.Mesh(geo, material); m.rotation.x = -Math.PI / 2; m.position.y = y; return m;
}
function outline(polygon, color, y) { const pts = polygon.map(p => toV(p, y)); pts.push(pts[0].clone()); return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color })); }
function ring(group, p, color, opacity, y = .03) { const m = new THREE.Mesh(new THREE.RingGeometry(p.proxy_radius_m * 1.05, p.proxy_radius_m * 1.05 + .06, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.position.copy(toV(p.position_m, y)); group.add(m); }
function label(text, pos) {
  const px = 40, pad = 10, dpr = 2; const cv = document.createElement('canvas'); const ctx = cv.getContext('2d'); ctx.font = `italic 500 ${px}px -apple-system, Helvetica Neue, Segoe UI, sans-serif`; const w = Math.ceil(ctx.measureText(text).width) + pad * 2, hh = px + pad * 2; cv.width = w * dpr; cv.height = hh * dpr; ctx.scale(dpr, dpr); ctx.font = `italic 500 ${px}px -apple-system, Helvetica Neue, Segoe UI, sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(253,251,247,.85)'; ctx.beginPath(); ctx.roundRect(0, 0, w, hh, 10); ctx.fill(); ctx.fillStyle = '#2a2723'; ctx.fillText(text, w / 2, hh / 2);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })); const s = .32; sp.scale.set(s * w / hh, s, 1); sp.position.copy(pos); return sp;
}
function paperTexture(w, h) { const cv = document.createElement('canvas'); const S = 64; cv.width = Math.min(4096, Math.round(w * S)); cv.height = Math.min(4096, Math.round(h * S)); const ctx = cv.getContext('2d'); ctx.fillStyle = '#efece3'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.strokeStyle = 'rgba(42,39,35,.08)'; ctx.lineWidth = 1; const step = cv.width / w; for (let x = 0; x <= cv.width; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke(); } for (let y = 0; y <= cv.height; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke(); } const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function clear(group) { while (group.children.length) { const c = group.children.pop(); c.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); }); } }
function countMeshes(o) { let n = o.isMesh ? 1 : 0; for (const c of o.children || []) n += countMeshes(c); return n; }
