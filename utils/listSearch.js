// Port of the website's services/guide/listSearch.js: every typed word must
// appear in the item's titles / names / short descriptions / url_title (any
// shape the list APIs return). Case- and accent-insensitive.
const FIELDS = ['title', 'short_description', 'name', 'us_name', 'ka_name', 'url_title', 'us_title', 'ka_title'];
const fold = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/<[^>]+>/g, ' ').replace(/[_\-()]+/g, ' ');

function collect(obj, out, depth) {
  if (!obj || typeof obj !== 'object' || depth > 3) return;
  for (const key of Object.keys(obj)) {
    const v = obj[key];
    if (typeof v === 'string' && FIELDS.includes(key)) out.push(v);
    else if (v && typeof v === 'object' && !Array.isArray(v)) collect(v, out, depth + 1);
  }
}

const cache = new WeakMap();
function textOf(item) {
  if (!item || typeof item !== 'object') return fold(item || '');
  if (!cache.has(item)) {
    const out = [];
    collect(item, out, 0);
    cache.set(item, fold(out.join(' ')));
  }
  return cache.get(item);
}

export function searchItems(items, query) {
  const words = fold(query || '').split(/\s+/).filter(Boolean);
  if (!words.length) return items || [];
  return (items || []).filter((item) => {
    const t = textOf(item);
    return words.every((w) => t.includes(w));
  });
}
