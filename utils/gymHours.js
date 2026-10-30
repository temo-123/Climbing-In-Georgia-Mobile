import { useEffect, useState } from 'react';
import api, { API_BASE_URL, corsUrl } from './api';

// Port of the website's services/guide/gymHours.js. A gym has either the
// same hours every day (global_data.open_time / closed_time) or hours per
// weekday (weekly_hours: { mon: { open, close } | { closed: true }, … sun },
// from GET get_gym_hours/all or /{id}). Closing after midnight (18:00 –
// 01:00) belongs to the day it opened. A work_status always wins.
export const WEEK_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const ALERT_STATUSES = ['temporarily_closed', 'sport_session_closed', 'coming_soon'];

const toMinutes = (time) => {
  const [h, m] = String(time).split(':').map(Number);
  return h * 60 + (m || 0);
};
export const shortTime = (time) => (time ? String(time).slice(0, 5) : '');
export const dayKey = (date) => WEEK_DAYS[(date.getDay() + 6) % 7];

export function weekly(gym) {
  let w = gym && gym.weekly_hours;
  if (typeof w === 'string') { try { w = JSON.parse(w); } catch { w = null; } }
  return w && typeof w === 'object' && !Array.isArray(w) ? w : null;
}

// { open, close } for a weekday, or null when closed / unknown
export function hoursForDay(gym, day) {
  const w = weekly(gym);
  if (w) {
    const d = w[day];
    return d && !d.closed && d.open && d.close ? { open: shortTime(d.open), close: shortTime(d.close) } : null;
  }
  return gym && gym.open_time && gym.closed_time ? { open: shortTime(gym.open_time), close: shortTime(gym.closed_time) } : null;
}

export function hasHours(gym) {
  return WEEK_DAYS.some((d) => hoursForDay(gym, d));
}

// true when the hours differ between weekdays
export function variesByDay(gym) {
  const w = weekly(gym);
  if (!w) return false;
  const sig = WEEK_DAYS.map((d) => JSON.stringify(hoursForDay(gym, d)));
  return new Set(sig).size > 1;
}

// is it open at `now`? also counts last night's hours that run past midnight
export function openWindow(gym, now) {
  const minutes = now.getHours() * 60 + now.getMinutes();
  const today = hoursForDay(gym, dayKey(now));
  if (today) {
    const o = toMinutes(today.open);
    const c = toMinutes(today.close);
    if (c > o ? (minutes >= o && minutes < c) : minutes >= o) return { open: true, closesIn: (c - minutes + 1440) % 1440 };
  }
  const prev = hoursForDay(gym, dayKey(new Date(now.getTime() - 86400000)));
  if (prev) {
    const o = toMinutes(prev.open);
    const c = toMinutes(prev.close);
    if (c <= o && minutes < c) return { open: true, closesIn: c - minutes };
  }
  return { open: false, opensIn: today && toMinutes(today.open) > minutes ? toMinutes(today.open) - minutes : null };
}

export function isOpenNow(gym, now = new Date()) {
  if (!gym || gym.work_status) return false;
  return openWindow(gym, now).open;
}

// Badge for cards / the gym page: { state: open | soon | closed, key, min }
export function openState(gym, now = new Date()) {
  const w = openWindow(gym, now);
  if (w.open) {
    return w.closesIn <= 60
      ? { state: 'soon', key: 'site.guide.article.open_status.closes_in', min: w.closesIn }
      : { state: 'open', key: 'site.guide.article.open_status.open_now' };
  }
  return w.opensIn !== null && w.opensIn <= 60
    ? { state: 'soon', key: 'site.guide.article.open_status.opens_in', min: w.opensIn }
    : { state: 'closed', key: 'site.guide.article.open_status.closed_now' };
}

// Re-renders every minute so live badges stay right while a screen is open.
export function useMinuteClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// Per-day hours of every gym that has them: { "<article_id>": week }.
let allCache = null;
export function useAllGymHours() {
  const [all, setAll] = useState(allCache || {});
  useEffect(() => {
    api.get(corsUrl(`${API_BASE_URL}/get_gym_hours/all`))
      .then(({ data }) => {
        allCache = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
        setAll(allCache);
      })
      .catch(() => {});
  }, []);
  return all;
}

export async function fetchGymWeek(articleId) {
  try {
    const { data } = await api.get(corsUrl(`${API_BASE_URL}/get_gym_hours/${articleId}`));
    return data?.week || null;
  } catch {
    return allCache?.[articleId] || null;
  }
}
