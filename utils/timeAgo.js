import { toDate, dayMonthYear } from './eventDates';

// The website's $timeAgo: "3 hours ago" for anything user-posted, falling
// back to the date after ~35 days. Own strings (time.*) instead of
// Intl.RelativeTimeFormat, which Hermes doesn't ship with Georgian data.
export function timeAgo(value, t, locale) {
  const d = toDate(value);
  if (!d) return '';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 60) return t('time.just_now');
  if (s < 3600) return t('time.min_ago', { n: Math.floor(s / 60) });
  if (s < 86400) return t('time.h_ago', { n: Math.floor(s / 3600) });
  if (s < 35 * 86400) return t('time.d_ago', { n: Math.floor(s / 86400) });
  return dayMonthYear(d, locale);
}
