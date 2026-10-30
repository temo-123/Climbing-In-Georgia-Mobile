import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import ArticleSection from '../article/ArticleSection';
import OpenBadge from './OpenBadge';
import { WEEK_DAYS, hoursForDay, hasHours, variesByDay, dayKey, useMinuteClock } from '../../utils/gymHours';
import { weekdayLong } from '../../utils/eventDates';
import { useLocale } from '../../utils/LocaleContext';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// The website's IndoorHoursComponent ("Opening hours" on the gym page):
// one "Every day" line, or the whole week Monday first with today
// highlighted and closed days marked, plus the live badge. Hidden while an
// alert work status is set (the alert at the top explains why).
export default function GymHours({ gym }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const now = useMinuteClock();
  if (!gym || gym.work_status || !hasHours(gym)) return null;
  const today = dayKey(now);

  return (
    <ArticleSection title={t('site.guide.gym_hours.title')} icon={faClock} right={<OpenBadge gym={gym} now={now} small />}>
      {!variesByDay(gym) ? (
        <View style={styles.row}>
          <Text style={styles.day}>{t('site.guide.gym_hours.every_day')}</Text>
          <Text style={styles.hours}>{hoursForDay(gym, today) ? `${hoursForDay(gym, today).open} – ${hoursForDay(gym, today).close}` : t('site.guide.gym_hours.closed')}</Text>
        </View>
      ) : WEEK_DAYS.map((d, i) => {
        const h = hoursForDay(gym, d);
        const isToday = d === today;
        return (
          <View key={d} style={[styles.row, isToday && styles.today]}>
            <Text style={[styles.day, isToday && styles.todayText]}>
              {weekdayLong(i, locale)}{isToday ? ` · ${t('site.guide.gym_hours.today')}` : ''}
            </Text>
            <Text style={[styles.hours, !h && styles.closed, isToday && styles.todayText]}>
              {h ? `${h.open} – ${h.close}` : t('site.guide.gym_hours.closed')}
            </Text>
          </View>
        );
      })}
    </ArticleSection>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: RADII.sm,
  },
  today: { backgroundColor: COLORS.primarySoft },
  day: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink2 },
  hours: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.ink },
  closed: { color: COLORS.danger },
  todayText: { color: COLORS.primaryDark, fontFamily: FONTS.bodyHeavy },
});
