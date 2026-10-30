import { useEffect, useMemo, useSyncExternalStore } from 'react';
import api, { API_BASE_URL } from './api';
import { useAuth } from './AuthContext';
import { bestStyle } from './routeFilters';

// One shared copy of the logged-in climber's route + multi-pitch logbook
// (like the website's reactive sets): the ✓ ticks in sector tables, the
// area progress bar and the "My logbook" screen all read it, and logging or
// deleting an ascent anywhere refreshes it everywhere.
const state = {
  userId: null,
  routes: [],
  mtps: [],
  loaded: false,
  loading: false,
};
const listeners = new Set();
let snapshot = { ...state };

function emit() {
  snapshot = { ...state };
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function reloadMyAscents() {
  if (!state.userId) return;
  state.loading = true;
  emit();
  const uid = state.userId;
  try {
    const [routes, mtps] = await Promise.all([
      api.get(`${API_BASE_URL}/set_route_ascent/get_my_route_ascents`).then((r) => r.data).catch(() => null),
      api.get(`${API_BASE_URL}/set_mtp_ascent/get_my_mtp_ascents`).then((r) => r.data).catch(() => null),
    ]);
    if (state.userId !== uid) return; // logged out / switched meanwhile
    if (Array.isArray(routes)) state.routes = routes;
    if (Array.isArray(mtps)) state.mtps = mtps;
    state.loaded = true;
  } finally {
    state.loading = false;
    emit();
  }
}

function setUser(userId) {
  if (state.userId === userId) return;
  state.userId = userId;
  state.routes = [];
  state.mtps = [];
  state.loaded = false;
  emit();
  if (userId) reloadMyAscents();
}

// route_id → best style, mtp_id → true
export function useMyAscents() {
  const { user } = useAuth();
  useEffect(() => { setUser(user?.id ?? null); }, [user?.id]);
  const s = useSyncExternalStore(subscribe, () => snapshot);

  const ticked = useMemo(() => {
    const map = {};
    for (const a of s.routes) map[a.route_id] = bestStyle(map[a.route_id], a.ascent_style);
    return map;
  }, [s.routes]);

  const mtpTicked = useMemo(() => {
    const map = {};
    for (const a of s.mtps) map[a.mtp_id] = true;
    return map;
  }, [s.mtps]);

  return { ...s, loggedIn: !!user, ticked, mtpTicked, reload: reloadMyAscents };
}
