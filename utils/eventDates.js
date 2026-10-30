// Port of the website's services/guide/eventDates.js. Server format
// "2026-12-24 20:53:00" (local Tbilisi time). Status is decided on real
// dates, not day/month numbers compared separately.
//
// Month/weekday names are local tables instead of Intl.DateTimeFormat:
// Hermes on Android ships a reduced ICU and 'ka-GE' silently falls back to
// English there.
const DAY = 86400000;

const MONTHS_SHORT = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ka: ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'],
};
const MONTHS_LONG = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ka: ['იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი', 'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'],
};
// Monday first (index 0 = Monday), matching the gym-hours table.
const WEEKDAYS_SHORT = {
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  ka: ['ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ', 'კვი'],
};
const WEEKDAYS_LONG = {
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  ka: ['ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი', 'კვირა'],
};

const lang = (locale) => (locale === 'ka' ? 'ka' : 'en');

export function toDate(v) {
  if (!v) return null;
  const d = new Date(String(v).replace(' ', 'T'));
  return isNaN(d) ? null : d;
}

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

// { key: upcoming | today | live | finished, days } for a global_event
export function eventStatus(ev, now = new Date()) {
  const start = toDate(ev && ev.start_data);
  if (!start) return { key: 'upcoming', days: null };
  const end = toDate(ev.end_data) || new Date(startOfDay(start).getTime() + DAY - 1);
  // An end saved at midnight means "the whole last day".
  const endInclusive = end.getHours() + end.getMinutes() === 0 ? new Date(startOfDay(end).getTime() + DAY - 1) : end;
  if (now > endInclusive) return { key: 'finished', days: null };
  if (now >= start) return { key: 'live', days: 0 };
  const days = Math.round((startOfDay(start) - startOfDay(now)) / DAY);
  return { key: days === 0 ? 'today' : 'upcoming', days };
}

// Translated status pill text: Starts in N days / tomorrow / today / Happening now / Finished.
export function statusLabel(status, t) {
  switch (status.key) {
    case 'finished': return t('site.guide.event_dates.finished');
    case 'live': return t('site.guide.event_dates.happening_now');
    case 'today': return t('site.guide.event_dates.starts_today');
    default:
      if (status.days === 1) return t('site.guide.event_dates.tomorrow');
      return status.days == null ? '' : t('site.guide.event_dates.starts_in', { n: status.days });
  }
}

// Events saved without a time sit at midnight.
export function hasTime(ev) {
  const s = toDate(ev && ev.start_data);
  const e = toDate(ev && ev.end_data);
  return !!((s && s.getHours() + s.getMinutes()) || (e && e.getHours() + e.getMinutes()));
}

export const pad2 = (n) => String(n).padStart(2, '0');
export const timeLabel = (d) => (d ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}` : '');

export function dayMonth(d, locale) {
  return `${d.getDate()} ${MONTHS_SHORT[lang(locale)][d.getMonth()]}`;
}
export function dayMonthYear(d, locale) {
  return `${dayMonth(d, locale)} ${d.getFullYear()}`;
}
export function monthShort(d, locale) {
  return MONTHS_SHORT[lang(locale)][d.getMonth()];
}
export function monthYear(d, locale) {
  return `${MONTHS_LONG[lang(locale)][d.getMonth()]} ${d.getFullYear()}`;
}
// 0 = Monday … 6 = Sunday
export const weekdayIndex = (d) => (d.getDay() + 6) % 7;
export function weekdayShort(i, locale) {
  return WEEKDAYS_SHORT[lang(locale)][i];
}
export function weekdayLong(i, locale) {
  return WEEKDAYS_LONG[lang(locale)][i];
}

// "24 – 30 Dec 2026", "24 Dec – 2 Jan 2027", "24 Dec 2026"
export function rangeLabel(ev, locale) {
  const s = toDate(ev.start_data);
  const e = toDate(ev.end_data);
  if (!s) return '';
  if (!e || startOfDay(s).getTime() === startOfDay(e).getTime()) return dayMonthYear(s, locale);
  if (s.getFullYear() !== e.getFullYear()) return `${dayMonthYear(s, locale)} – ${dayMonthYear(e, locale)}`;
  if (s.getMonth() !== e.getMonth()) return `${dayMonth(s, locale)} – ${dayMonthYear(e, locale)}`;
  return `${s.getDate()} – ${dayMonthYear(e, locale)}`;
}

// Whole days between start and end, counting both (1 for a single-day event).
export function durationDays(ev) {
  const s = toDate(ev.start_data);
  const e = toDate(ev.end_data);
  if (!s || !e) return 1;
  return Math.round((startOfDay(e) - startOfDay(s)) / DAY) + 1;
}
