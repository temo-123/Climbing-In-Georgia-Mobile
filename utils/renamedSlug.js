import { useCallback, useEffect, useState } from 'react';

// Article / summit slugs (url_title) can be renamed. The website 301s
// /{segment}/{old_slug} to the current slug (RedirectRenamedSlugs middleware,
// segments from Article::slugSegments() / Summit), but the API just answers
// 404 for the old one — so a saved favourite or deep link would open a dead
// page. On a 404, ask the website where the old URL goes now and retry with
// the new slug; if it doesn't redirect, offer the web page instead.
const SEGMENTS = {
  outdoor: 'outdoor',
  ice: 'ice',
  indoor: 'indoor',
  mount_route: 'mountaineering',
  other: 'other',
  summit: 'summit',
};
const HOSTS = { summit: 'https://summit.climbing.ge' };
const DEFAULT_HOST = 'https://climbing.ge';

export function webUrlFor(type, slug, locale) {
  const segment = SEGMENTS[type];
  if (!segment || !slug) return null;
  const ka = locale === 'ka' ? '/ka' : '';
  return `${HOSTS[type] || DEFAULT_HOST}${ka}/${segment}/${encodeURIComponent(slug)}`;
}

// → the current slug, or null when the URL doesn't redirect anywhere new.
export async function resolveRenamedSlug(type, slug) {
  const url = webUrlFor(type, slug);
  if (!url) return null;
  const segment = SEGMENTS[type];
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow' });
      const finalUrl = res.url || '';
      const m = finalUrl.match(new RegExp(`/${segment}/([^/?#]+)`));
      if (m) {
        const next = decodeURIComponent(m[1]);
        return next && next !== slug ? next : null;
      }
      if (res.status === 404) return null;
    } catch {
      // try the next method / give up
    }
  }
  return null;
}

// For a detail screen: the slug to fetch (starts as the route param, switches
// to the renamed one), `handle404(err)` → true when it took care of the error
// (renamed → refetch happens through `slug`; not found → `notFoundUrl`).
export function useRenamableSlug(type, initial) {
  const [slug, setSlug] = useState(initial);
  const [notFoundUrl, setNotFoundUrl] = useState(null);

  useEffect(() => { setSlug(initial); setNotFoundUrl(null); }, [initial]);

  const handle404 = useCallback(async (err) => {
    if (err?.response?.status !== 404) return false;
    const next = await resolveRenamedSlug(type, slug);
    if (next) {
      setSlug(next);
      return true;
    }
    setNotFoundUrl(webUrlFor(type, slug));
    return true;
  }, [type, slug]);

  return { slug, handle404, notFoundUrl };
}
