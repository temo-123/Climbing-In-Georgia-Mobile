import { toDate, startOfDay } from '../../utils/eventDates';

// Mirrors PartnerPost model constants on the backend.
export const DISCIPLINES = ['sport', 'boulder', 'multipitch', 'trad', 'ice', 'alpine', 'indoor'];
export const LANGUAGES = ['ka', 'en', 'ru', 'uk', 'de', 'fr', 'es', 'it', 'pl', 'tr', 'he', 'zh'];
export const MAX_TRIP_DAYS = 30;

const DAY = 86400000;

// Number of trip days (1 for a one-day plan).
export function tripDays(post) {
  const s = toDate(post.climb_date);
  const e = toDate(post.end_date);
  if (!s || !e) return 1;
  return Math.round((startOfDay(e) - startOfDay(s)) / DAY) + 1;
}

// Started already and not over yet → "Happening now".
export function isOngoing(post, now = new Date()) {
  const s = toDate(post.climb_date);
  const e = toDate(post.end_date) || s;
  if (!s) return false;
  const today = startOfDay(now);
  return startOfDay(s) <= today && startOfDay(e) >= today;
}
