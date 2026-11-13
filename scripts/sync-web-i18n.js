#!/usr/bin/env node
// Copies the website's translations (vue-i18n, resources/lang/i18n/{en,ka}.json
// in github.com/temo-123/climbing.ge) into locales/site.{en,ka}.json, so the
// app's wording for shared features (route ascents, conditions, partners,
// gym hours…) matches the site exactly in both languages. Loaded under the
// `site` key: t('site.guide.gym_hours.title').
//
// Usage: node scripts/sync-web-i18n.js <path to the web repo's resources/lang/i18n>
//
// Conversions: vue-i18n `{name}` → i18next `{{name}}`, linked messages
// `@:path` are resolved to their text, `{'@'}` literal escapes → `@`.
const fs = require('fs');
const path = require('path');

// Top-level namespaces taken whole, and `user.*` sub-namespaces taken one by one.
const NAMESPACES = ['guide', 'common'];
const USER_KEYS = [
  'route_ascents', 'mtp_ascents', 'climbing_stats', 'preferences',
  'notification_settings', 'favorites', 'overview', 'ascents', 'my_comments',
];
// Single sub-trees taken by dotted path (kept at the same path under `site`).
const EXTRA_PATHS = [
  'global.age_restriction', 'global.email_verify', 'global.follow',
  'shop.product.feedback.reasons', 'user.nav.account_alert', 'user.nav.account_alerts',
];

const src = process.argv[2];
if (!src) {
  console.error('usage: node scripts/sync-web-i18n.js <web repo>/resources/lang/i18n');
  process.exit(1);
}

function get(obj, dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function convert(value, root, depth = 0) {
  if (typeof value !== 'string') return value;
  let v = value.replace(/\{'@'\}/g, '@');
  // Whole-string link (`@:common.date`) or inline link (`… @:a.b …`).
  v = v.replace(/@:([A-Za-z0-9_.]+[A-Za-z0-9_])/g, (m, key) => {
    const target = get(root, key);
    return typeof target === 'string' && depth < 5 ? convert(target, root, depth + 1) : m;
  });
  return v.replace(/\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g, '{{$1}}');
}

function mapTree(node, root) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, mapTree(v, root)]));
  }
  return convert(node, root);
}

for (const lang of ['en', 'ka']) {
  const root = JSON.parse(fs.readFileSync(path.join(src, `${lang}.json`), 'utf8'));
  const out = {};
  for (const ns of NAMESPACES) if (root[ns]) out[ns] = mapTree(root[ns], root);
  out.user = {};
  for (const k of USER_KEYS) if (root.user?.[k]) out.user[k] = mapTree(root.user[k], root);
  for (const p of EXTRA_PATHS) {
    const v = get(root, p);
    if (v === undefined) continue;
    const keys = p.split('.');
    let node = out;
    for (const k of keys.slice(0, -1)) node = node[k] = node[k] || {};
    node[keys[keys.length - 1]] = mapTree(v, root);
  }
  const dest = path.join(__dirname, '..', 'locales', `site.${lang}.json`);
  fs.writeFileSync(dest, JSON.stringify(out, null, 1) + '\n');
  console.log(`${lang}: ${(fs.statSync(dest).size / 1024).toFixed(1)} KB → ${path.relative(process.cwd(), dest)}`);
}
