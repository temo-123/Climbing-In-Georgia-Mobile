import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The website's services/guide/recentlyViewed.js: the last few guide pages
// opened on this device (outdoor, ice, indoor, mountaineering), for the
// "Recently viewed" strip on the list pages and home. Device-only.
const KEY = '@cg_recently_viewed';
const MAX = 8;
export const VIEWED_CATEGORIES = ['outdoor', 'ice', 'indoor', 'mount_route'];

let items = [];
let loaded = false;
const listeners = new Set();
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const emit = () => listeners.forEach((l) => l());

function ensureLoaded() {
  if (loaded) return;
  loaded = true;
  AsyncStorage.getItem(KEY)
    .then((v) => { const list = v ? JSON.parse(v) : []; if (Array.isArray(list)) { items = list; emit(); } })
    .catch(() => {});
}

export function rememberViewed({ category, url_title, title, image, updated_at, id }) {
  if (!VIEWED_CATEGORIES.includes(category) || !url_title || !title) return;
  ensureLoaded();
  items = [
    { category, url_title, title, image: image || null, updated_at: updated_at || null, id: id ?? null, at: Date.now() },
    ...items.filter((i) => !(i.category === category && i.url_title === url_title)),
  ].slice(0, MAX);
  AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  emit();
}

export function forgetViewed() {
  items = [];
  AsyncStorage.removeItem(KEY).catch(() => {});
  emit();
}

export function useRecentlyViewed() {
  useEffect(ensureLoaded, []);
  return useSyncExternalStore(subscribe, () => items);
}

// Call from an article page once its data is loaded.
export function useRememberViewed(category, globalData, title) {
  useEffect(() => {
    if (globalData?.url_title && title) {
      rememberViewed({
        category,
        url_title: globalData.url_title,
        title,
        image: globalData.image,
        updated_at: globalData.updated_at,
        id: globalData.id,
      });
    }
  }, [category, globalData?.url_title, title]);
}
