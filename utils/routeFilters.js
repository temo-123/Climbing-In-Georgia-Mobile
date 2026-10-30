// Port of the website's services/guide/routeFilters.js — the area route
// finder (grade bands, classics, hide climbed, name/grade search) and the
// tick / star helpers the sector tables use. Keep the rules identical.

// French grade → sortable number: "6a" = 60, "6a+" = 61, "6b" = 62 … "4" = 40.
// Projects and unknown values return null.
export function gradeRank(grade) {
  if (!grade) return null;
  const m = String(grade).trim().toLowerCase().match(/^([3-9])([abc])?(\+)?$/);
  if (!m) return null;
  const letter = m[2] ? { a: 0, b: 2, c: 4 }[m[2]] : 0;
  return Number(m[1]) * 10 + letter + (m[3] ? 1 : 0);
}

// Grade bands shown as filter chips. `max` is inclusive.
export const GRADE_BANDS = [
  { key: 'easy', label: '≤ 5c+', min: 0, max: 55, color: '#2fa36b' },
  { key: 'mid', label: '6a – 6b+', min: 60, max: 63, color: '#1f93b0' },
  { key: 'hard', label: '6c – 7a+', min: 64, max: 71, color: '#e08a1e' },
  { key: 'expert', label: '7b +', min: 72, max: 999, color: '#c43c3c' },
];
export const PROJECT_COLOR = '#87939b';

export function bandOf(route) {
  const rank = gradeRank(route && route.grade);
  if (rank === null) return 'project';
  const band = GRADE_BANDS.find((b) => rank >= b.min && rank <= b.max);
  return band ? band.key : 'project';
}

// Community rating first (reviews), the admin "stars" column as fallback.
export function routeStars(route) {
  if (!route) return 0;
  if (route.reviews_stars) return Number(route.reviews_stars);
  return Number(route.stars) || 0;
}

export const CLASSIC_STARS = 4;

export function newRouteTools() {
  return { band: 'all', classics: false, hideTicked: false, query: '' };
}

export function isFiltering(tools) {
  return !!tools && (tools.band !== 'all' || tools.classics || tools.hideTicked || !!tools.query.trim());
}

// `ticked` = route_id → best ascent style (from the climber's logbook).
export function routeMatches(route, tools, ticked = {}) {
  if (!tools) return true;
  if (tools.band !== 'all' && bandOf(route) !== tools.band) return false;
  if (tools.classics && routeStars(route) < CLASSIC_STARS) return false;
  if (tools.hideTicked && ticked[route.id]) return false;
  const q = tools.query.trim().toLowerCase();
  if (q && !queryMatches(route, q)) return false;
  return true;
}

// Name contains the text, or the text is a grade the route's grade starts
// with ("6b" finds 6b and 6b+, "7" finds every 7th grade).
function queryMatches(route, q) {
  if (String(route.name || '').toLowerCase().includes(q)) return true;
  return /^[3-9][abc]?\+?$/.test(q) && String(route.grade || '').trim().toLowerCase().startsWith(q);
}

// Every sport + boulder route of an area (get_sector_and_routes payload).
export function flatRoutes(data) {
  const out = [];
  for (const item of data || []) {
    const sectors = item.local_images ? item.sectors || [] : [item];
    for (const s of sectors) {
      (s.sport_routes || []).forEach((r) => out.push(r));
      (s.boulder_route || []).forEach((r) => out.push(r));
    }
  }
  return out;
}

// Best style wins when a route has several logged ascents.
const STYLE_ORDER = ['onsight', 'flash', 'redpoint', 'toprope'];
export function bestStyle(a, b) {
  if (!a) return b;
  if (!b) return a;
  return STYLE_ORDER.indexOf(a) <= STYLE_ORDER.indexOf(b) ? a : b;
}
