import { useEffect, useSyncExternalStore } from 'react';
import api, { API_BASE_URL } from './api';
import { useAuth } from './AuthContext';

// The website's services/guide/interested.js: "interested" events (the
// events favourite list — reminder emails go to these users). One shared
// id set (get_interested_event_ids); counts shown on cards are adjusted
// locally after a toggle (`delta`) instead of refetching.
const state = { userId: null, ids: new Set(), delta: {} };
const listeners = new Set();
let snapshot = { ids: state.ids, delta: state.delta };
const emit = () => { snapshot = { ids: state.ids, delta: state.delta }; listeners.forEach((l) => l()); };
const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };

function setUser(userId) {
  if (state.userId === userId) return;
  state.userId = userId;
  state.ids = new Set();
  state.delta = {};
  emit();
  if (!userId) return;
  api.get(`${API_BASE_URL}/get_faworite/get_interested_event_ids`)
    .then(({ data }) => {
      if (state.userId !== userId) return;
      state.ids = new Set((Array.isArray(data) ? data : []).map(Number));
      emit();
    })
    .catch(() => {});
}

const bump = (id, d) => { state.delta = { ...state.delta, [id]: (state.delta[id] || 0) + d }; };

// resolves to the new state (true = interested)
export async function toggleInterested(eventId) {
  const id = Number(eventId);
  if (state.ids.has(id)) {
    await api.delete(`${API_BASE_URL}/set_faworite/del_interested_event/${id}`);
    const next = new Set(state.ids); next.delete(id); state.ids = next; bump(id, -1); emit();
    return false;
  }
  await api.post(`${API_BASE_URL}/set_faworite_by_user/add_to_interested_events`, { event_id: id });
  state.ids = new Set(state.ids).add(id); bump(id, 1); emit();
  return true;
}

export function useInterested() {
  const { user } = useAuth();
  useEffect(() => { setUser(user?.id ?? null); }, [user?.id]);
  const s = useSyncExternalStore(subscribe, () => snapshot);
  return {
    loggedIn: !!user,
    isInterested: (id) => s.ids.has(Number(id)),
    count: (ev) => Math.max(0, (Number(ev?.interested_count) || 0) + (s.delta[ev?.id] || 0)),
    ids: s.ids,
  };
}
