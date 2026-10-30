import React from 'react';
import { View, Text, StyleSheet, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faCalendarPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useLocale } from '../../utils/LocaleContext';
import {
  toDate, startOfDay, eventStatus, statusLabel, hasTime, timeLabel, monthShort, weekdayShort, weekdayIndex, durationDays, pad2,
} from '../../utils/eventDates';
import { stripHtml } from '../../utils/text';
import Chip from '../ui/Chip';
import Button from '../ui/Button';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's EventDatesComponent: a status pill, Start → End date tiles
// (weekday, big day number, month + year, time) with the duration, and —
// until the event has finished — "Add to calendar" (Google Calendar,
// ctz Asia/Tbilisi; all-day events end the day after their last day).
const STATUS_TONES = { live: 'success', today: 'hold', upcoming: 'accent', finished: 'default' };

const icsDate = (d) => `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
const icsDateTime = (d) => `${icsDate(d)}T${pad2(d.getHours())}${pad2(d.getMinutes())}00`;

export function googleCalendarUrl(ev, title, details, link) {
  const start = toDate(ev.start_data);
  if (!start) return null;
  const end = toDate(ev.end_data);
  let range;
  if (hasTime(ev)) {
    const e = end && end > start ? end : new Date(start.getTime() + 2 * 3600 * 1000);
    range = `${icsDateTime(start)}/${icsDateTime(e)}`;
  } else {
    const last = end || start;
    range = `${icsDate(start)}/${icsDate(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1))}`;
  }
  const q = [
    ['action', 'TEMPLATE'],
    ['text', title || ''],
    ['dates', range],
    ['details', [stripHtml(details), link].filter(Boolean).join('\n\n')],
    ['ctz', 'Asia/Tbilisi'],
  ].map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  return `https://calendar.google.com/calendar/render?${q}`;
}

function Tile({ label, date, withTime, locale }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.weekday}>{weekdayShort(weekdayIndex(date), locale)}</Text>
      <Text style={styles.day}>{date.getDate()}</Text>
      <Text style={styles.month}>{monthShort(date, locale)} {date.getFullYear()}</Text>
      {withTime && <Text style={styles.time}>{timeLabel(date)}</Text>}
    </View>
  );
}

export default function EventDates({ ev, title, details, link }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const start = toDate(ev.start_data);
  if (!start) return null;
  const end = toDate(ev.end_data);
  const status = eventStatus(ev);
  const withTime = hasTime(ev);
  const sameDay = !end || startOfDay(start).getTime() === startOfDay(end).getTime();
  const days = durationDays(ev);
  const cal = status.key !== 'finished' ? googleCalendarUrl(ev, title, details, link) : null;

  return (
    <View style={styles.panel}>
      <Chip tone={STATUS_TONES[status.key]} label={statusLabel(status, t)} style={styles.status} />
      {sameDay ? (
        <View style={styles.row}>
          <Tile label={t('site.guide.event_dates.date')} date={start} withTime={false} locale={locale} />
          {withTime && (
            <View style={styles.timeBox}>
              <Text style={styles.timeRange}>{timeLabel(start)}{end && end > start ? ` – ${timeLabel(end)}` : ''}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.row}>
          <Tile label={t('site.guide.event_dates.starts')} date={start} withTime={withTime} locale={locale} />
          <View style={styles.between}>
            <FontAwesomeIcon icon={faArrowRight} size={14} color={COLORS.muted} />
            <Text style={styles.duration}>{t('site.guide.event_dates.days', { n: days })}</Text>
          </View>
          <Tile label={t('site.guide.event_dates.ends')} date={end} withTime={withTime} locale={locale} />
        </View>
      )}
      {!!cal && (
        <Button
          small
          variant="outline"
          icon={faCalendarPlus}
          title={t('site.guide.event_dates.add_to_calendar')}
          onPress={() => Linking.openURL(cal).catch(() => {})}
          style={styles.cal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  status: { marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: RADII.md,
    backgroundColor: COLORS.chalk,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  tileLabel: { fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.primary },
  weekday: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.stone, marginTop: 4 },
  day: { fontFamily: FONTS.displayBold, fontSize: 36, lineHeight: 40, color: COLORS.ink },
  month: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.ink2 },
  time: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: COLORS.primaryDark, marginTop: 4 },
  between: { alignItems: 'center', gap: 4 },
  duration: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.muted },
  timeBox: { flex: 1, alignItems: 'center' },
  timeRange: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.ink },
  cal: { marginTop: 12 },
});
