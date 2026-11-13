import { isoDate } from '../components/ui/DateField';

// Backend rule for `birthday` (register + options): date | before:today |
// after:1900-01-01 — so the picker allows 1900-01-02 … yesterday.
export const BIRTHDAY_MIN = '1900-01-02';

export function birthdayMax() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return isoDate(d);
}

// Where the calendar opens when no date is set yet.
export const BIRTHDAY_INITIAL_VIEW = '2000-01-01';

// The app's locale code → the backend's `lang` ('us' | 'ka').
export function apiLang(locale) {
  return locale === 'ka' ? 'ka' : 'us';
}
