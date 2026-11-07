// The one design model: Project → Site (boundary · features · beds · conditions · sources) → Brief → DesignVersion[] (plant objects).
// Every environmental fact carries value · status (known / stated / assumed / inferred / unknown) · source. Versions are immutable
// snapshots; Undo moves the current pointer. Nothing here knows about pixels: coordinates are local metres, north = +y rotated by
// site.orientation.north_angle_degrees.
import { area, bbox } from './geom.js';

export const STATUS = ['user-stated', 'user-drawn', 'user-calibrated', 'assumed', 'inferred', 'unknown'];
const now = () => new Date().toISOString();
let seq = 0; export const uid = p => `${p}-${(Date.now() % 1e6).toString(36)}${(seq++).toString(36)}`;

export function newProject(name = 'Untitled backyard') {
  return {
    id: uid('proj'), name, created: now(), schema: 'planting-intelligence/design-project/0.1', knowledge_snapshot: null,
    conversation: [], inputs: [],
    site: {
      id: 'site-1', coordinate_system: 'local-meters', orientation: { north_angle_degrees: 0, basis: 'assumption (north = up until stated)' },
      scale: { status: 'unknown', known_length_m: null, source: null }, boundary: null, boundary_status: 'unknown',
      features: [], beds: [],
      conditions: { light: cond(), soil_type: cond(), soil_drainage: cond(), water: cond(), wind: cond(), irrigation: cond() },
      values: [], notes: [],
    },
    brief: emptyBrief(), versions: [], current_version_id: null, redo: [], plant_seq: 0,
  };
}
export const cond = (value = null, status = 'unknown', source = null, note = null) => ({ value, status, source, note });
export function emptyBrief() { return { provenance: null, values: {}, hard_constraints: [], functions: [], composition: [], unknowns: [], evidence: [], updated: null }; }

// ---------------------------------------------------------------- site editing (every mutation records its source)
export function setBoundary(project, polygon, source = 'user-drawn') { project.site.boundary = polygon.map(p => [r2(p[0]), r2(p[1])]); project.site.boundary_status = source; }
export function setScale(project, status, known_length_m, source) { project.site.scale = { status, known_length_m, source }; }
export function addFeature(project, f) { const id = f.id || uid(f.kind === 'existing-tree' ? 'tree' : f.kind === 'no-plant-zone' ? 'open' : 'feat'); project.site.features.push({ locked: true, ...f, id }); return id; }
export function addBed(project, polygon, status = 'user-drawn', name = null, source = 'canvas') { const id = `bed-${project.site.beds.length + 1}`; project.site.beds.push({ id, name: name || `Bed ${project.site.beds.length + 1}`, polygon: polygon.map(p => [r2(p[0]), r2(p[1])]), status, source, goals: [], conditions_overrides: {}, area_m2: r2(area(polygon)) }); return id; }
export function acceptBed(project, bedId) { const b = project.site.beds.find(b => b.id === bedId); if (b) b.status = 'user-accepted'; }
export function setCondition(project, key, value, status, source, note, bedId = null) { const c = cond(value, status, source, note); if (bedId) { const b = project.site.beds.find(b => b.id === bedId); if (b) b.conditions_overrides[key] = c; } else project.site.conditions[key] = c; }
export function effectiveConditions(project, bedId) { const b = project.site.beds.find(b => b.id === bedId); return { ...project.site.conditions, ...(b?.conditions_overrides || {}) }; }
export function addInput(project, input) { const id = uid(input.type); project.inputs.push({ id, added: now(), ...input }); return id; }
export function say(project, role, text, extra = {}) { project.conversation.push({ id: uid('msg'), time: now(), role, text, ...extra }); }
const r2 = v => Math.round(v * 100) / 100;

// ---------------------------------------------------------------- versions
export function currentVersion(project) { return project.versions.find(v => v.id === project.current_version_id) || null; }
export function commitVersion(project, version) {
  version.id = version.id || uid('v'); version.created = now(); version.parent_version_id = version.parent_version_id ?? project.current_version_id;
  version.plant_objects = version.plant_objects.map(p => ({ ...p, position_m: [r2(p.position_m[0]), r2(p.position_m[1])] }));
  version.schedule = schedule(version);
  project.versions.push(version); project.current_version_id = version.id; project.redo = []; return version;
}
export function undo(project) { const v = currentVersion(project); if (!v || !v.parent_version_id) return false; project.redo.push(v.id); project.current_version_id = v.parent_version_id; return true; }
export function redo(project) { const id = project.redo.pop(); if (!id) return false; project.current_version_id = id; return true; }
export function schedule(version) { const by = new Map(); for (const p of version.plant_objects) { const s = by.get(p.species_id) || { species_id: p.species_id, count: 0, roles: new Set(), beds: new Set() }; s.count++; s.roles.add(p.role); s.beds.add(p.bed_id); by.set(p.species_id, s); } return [...by.values()].map(s => ({ species_id: s.species_id, count: s.count, roles: [...s.roles], beds: [...s.beds] })).sort((a, b) => b.count - a.count || a.species_id.localeCompare(b.species_id)); }
export function nextPlantId(project) { project.plant_seq += 1; return `plant-${String(project.plant_seq).padStart(3, '0')}`; }
export function clonePlants(version) { return version.plant_objects.map(p => ({ ...p, position_m: [...p.position_m] })); }

// ---------------------------------------------------------------- diff between two versions (by stable ids)
export function diff(a, b) {
  const A = new Map((a?.plant_objects || []).map(p => [p.id, p])), B = new Map((b?.plant_objects || []).map(p => [p.id, p]));
  const added = [...B.keys()].filter(id => !A.has(id)), removed = [...A.keys()].filter(id => !B.has(id));
  const changed = [...B.keys()].filter(id => A.has(id) && (A.get(id).position_m[0] !== B.get(id).position_m[0] || A.get(id).position_m[1] !== B.get(id).position_m[1] || A.get(id).species_id !== B.get(id).species_id));
  const unchanged = [...B.keys()].filter(id => A.has(id) && !changed.includes(id));
  const sa = Object.fromEntries((a ? schedule(a) : []).map(s => [s.species_id, s.count])), sb = Object.fromEntries((b ? schedule(b) : []).map(s => [s.species_id, s.count]));
  const schedule_delta = {}; for (const k of new Set([...Object.keys(sa), ...Object.keys(sb)])) if ((sa[k] || 0) !== (sb[k] || 0)) schedule_delta[k] = (sb[k] || 0) - (sa[k] || 0);
  return { added, removed, changed, unchanged, schedule_delta, count_before: A.size, count_after: B.size };
}

// ---------------------------------------------------------------- readiness: what the model knows, what blocks measured placement
export function readiness(project) {
  const s = project.site; const out = { site_boundary: !!s.boundary, scale: s.scale.status !== 'unknown', beds: s.beds.length, accepted_beds: s.beds.filter(b => b.status === 'user-accepted' || b.status === 'user-drawn').length, unknown_conditions: Object.entries(s.conditions).filter(([, c]) => c.status === 'unknown').map(([k]) => k), measured_placement: false, blockers: [] };
  if (!out.site_boundary) out.blockers.push('no site geometry yet — draw a boundary or state the dimensions');
  if (!out.scale) out.blockers.push('scale unknown — measured spacing and quantities are blocked until a length is stated or calibrated');
  if (!out.beds) out.blockers.push('no planting bed yet — draw one or accept a suggestion');
  out.measured_placement = out.site_boundary && out.scale && out.beds > 0;
  return out;
}
export function siteBBox(project) { return project.site.boundary ? bbox(project.site.boundary) : null; }

// ---------------------------------------------------------------- persistence
const KEY = 'pi.design.project.v1';
export function saveLocal(project) { try { localStorage.setItem(KEY, JSON.stringify(project)); return true; } catch { return false; } }
export function loadLocal() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; } }
export function clearLocal() { try { localStorage.removeItem(KEY); } catch { } }
export async function saveServer(project) { try { const r = await fetch(`/api/designs/${encodeURIComponent(project.id)}`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(project) }); return r.ok ? await r.json() : null; } catch { return null; } }
export async function serverStatus() { try { const r = await fetch('/api/status', { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } }
export async function loadServer(id) { try { const r = await fetch(`/api/designs/${encodeURIComponent(id)}`, { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; } }
