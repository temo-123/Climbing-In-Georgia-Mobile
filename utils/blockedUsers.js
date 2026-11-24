import { useEffect, useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from './api';
import { useAuth } from './AuthContext';

// Blocked climbers (App Store guideline 1.2: a user must be able to block
// another user, and that user's content then stops showing). Module-level
// store like favorites.js: one shared set, every list filters through
// `isBlocked(userId)`.
//
// Storage: kept on the device per account (guests too, under "guest"), and
// synced with the backend (`/user_block/*`, see docs/APP_STORE.md) when the
// server has those endpoints. The server list is merged in on login; until
// the endpoints exist (they answer 404 / the SPA HTML) blocking still works,
// device-only.
const KEY = (uid) => `blocked_users_v1:${uid ?? 'guest'}`;
const API = `${API_BASE_URL}/user_block`;

const state = { userId: undefined, users: new Map(), loaded: false };
const listeners = new Set();
let snapshot = { users: state.users, loaded: false };

function emit() {
  snapshot = { users: state.users, loaded: state.loaded };
  listeners.forEach((l) => l());
}
function subscribe(l) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function persist() {
  const uid = state.userId;
  AsyncStorage.setItem(KEY(uid), JSON.stringify([...state.users.values()])).catch(() => {});
}

// `{ id, name, surname, image, updated_at }` — enough to list and unblock.
function slim(u) {
  return {
    id: Number(u.id),
    name: u.name ?? '',
    surname: u.surname ?? '',
    image: u.image ?? null,
    updated_at: u.updated_at ?? null,
  };
}

// The backend answers unknown routes with the SPA HTML (200) — not a list.
const isJsonList = (data) => Array.isArray(data);

async function load(uid) {
  try {
    const raw = await AsyncStorage.getItem(KEY(uid));
    if (state.userId !== uid) return;
    const local = raw ? JSON.parse(raw) : [];
    state.users = new Map((Array.isArray(local) ? local : []).filter((u) => u?.id).map((u) => [Number(u.id), slim(u)]));
  } catch {
    state.users = new Map();
  }
  state.loaded = true;
  emit();
  if (!uid) return;

  try {
    const { data } = await api.get(`${API}/list`);
    if (state.userId !== uid || !isJsonList(data)) return;
    const next = new Map(state.users);
    const onServer = new Set();
    data.forEach((u) => { if (u?.id) { onServer.add(Number(u.id)); next.set(Number(u.id), slim(u)); } });
    state.users = next;
    persist();
    emit();
    // Blocks made while the server didn't support it yet → push them up.
    [...next.keys()].filter((id) => !onServer.has(id)).forEach((id) => {
      api.post(`${API}/block/${id}`).catch(() => {});
    });
  } catch {}
}

function setUser(uid) {
  if (state.userId === uid) return;
  state.userId = uid;
  state.users = new Map();
  state.loaded = false;
  emit();
  load(uid);
}

export async function blockUser(user) {
  if (!user?.id) return;
  const next = new Map(state.users);
  next.set(Number(user.id), slim(user));
  state.users = next;
  persist();
  emit();
  if (state.userId) {
    try { await api.post(`${API}/block/${user.id}`); } catch {}
  }
}

export async function unblockUser(userId) {
  const next = new Map(state.users);
  next.delete(Number(userId));
  state.users = next;
  persist();
  emit();
  if (state.userId) {
    try { await api.delete(`${API}/unblock/${userId}`); } catch {}
  }
}

export function isUserBlocked(userId) {
  return userId != null && state.users.has(Number(userId));
}

export function useBlockedUsers() {
  const { user } = useAuth();
  useEffect(() => { setUser(user?.id ?? null); }, [user?.id]);
  const s = useSyncExternalStore(subscribe, () => snapshot);
  return {
    list: [...s.users.values()],
    // Stable until the set changes — use it as a memo dependency.
    users: s.users,
    loaded: s.loaded,
    isBlocked: (id) => id != null && s.users.has(Number(id)),
  };
}

// The author id of a piece of content, whatever shape the API sent it in.
export function authorIdOf(item) {
  return item?.user?.id ?? item?.user_id ?? null;
}
