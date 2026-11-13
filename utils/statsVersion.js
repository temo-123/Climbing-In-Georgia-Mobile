import { useSyncExternalStore } from 'react';

// Points / activity counts are computed by the server from visible activity,
// so deleting an ascent, comment or review changes them at once. Anything
// that deletes calls bumpStats(); the stats views (ClimberProfileContent,
// MyStatsCard) re-fetch when the version changes.
let version = 0;
const listeners = new Set();

export function bumpStats() {
  version += 1;
  listeners.forEach((l) => l());
}

export function useStatsVersion() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => version,
  );
}
