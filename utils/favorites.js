import { useEffect, useSyncExternalStore } from 'react';
import api, { API_BASE_URL } from './api';
import { useAuth } from './AuthContext';

// The website's services/guide/favorites.js: one shared set of favourite
// article ids for the logged-in climber (GET get_favorite_article_ids), so
// a list with many hearts makes one request, and toggling a heart anywhere
// updates every other heart. Allowed: every guide article except news /
// special articles (backend Favorite_outdoor_area::CATEGORIES).
const state = { userId: null, ids: new Set(), version: 0, loaded: false };
const listeners = new Set();
let snapshot = { ids: state.ids, version: 0, loaded: false };

function emit() {
  state.version += 1;
  snapshot = { ids: state.ids, version: state.version, loaded: state.loaded };
  listeners.forEach((l) => l());
}
function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

async function load() {
  const uid = state.userId;
  try {
    const { data } = await api.get(`${API_BASE_URL}/get_faworite/get_favorite_article_ids`);
    if (state.userId !== uid) return;
    state.ids = new Set((Array.isArray(data) ? data : []).map(Number));
    state.loaded = true;
    emit();
  } catch {}
}

function setUser(userId) {
  if (state.userId === userId) return;
  state.userId = userId;
  state.ids = new Set();
  state.loaded = false;
  emit();
  if (userId) load();
}

export async function addFavorite(articleId) {
  state.ids = new Set(state.ids).add(Number(articleId));
  emit();
  try {
    await api.post(`${API_BASE_URL}/set_faworite_by_user/add_to_favorite_outdoor_area/${articleId}`);
  } catch (err) {
    const next = new Set(state.ids); next.delete(Number(articleId)); state.ids = next; emit();
    throw err;
  }
}

export async function removeFavorite(articleId) {
  const next = new Set(state.ids); next.delete(Number(articleId)); state.ids = next;
  emit();
  try {
    await api.delete(`${API_BASE_URL}/set_faworite/del_favorite_outdoor_area/${articleId}`);
  } catch (err) {
    state.ids = new Set(state.ids).add(Number(articleId)); emit();
    throw err;
  }
}

export function useFavorites() {
  const { user } = useAuth();
  useEffect(() => { setUser(user?.id ?? null); }, [user?.id]);
  const s = useSyncExternalStore(subscribe, () => snapshot);
  return { loggedIn: !!user, ids: s.ids, loaded: s.loaded, version: s.version, isFavorite: (id) => s.ids.has(Number(id)) };
}
