import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCheck, faListOl, faFire, faArrowTrendUp, faBolt, faGem, faEye, faCompass, faCalendarCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useLocale } from '../../utils/LocaleContext';
import { LEAD_GRADES } from '../../utils/grades';
import { monthShort } from '../../utils/eventDates';
import SectionTitle from '../ui/SectionTitle';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// Port of the website's ClimbingStatsComponent (/my_route_ascents): grade
// pyramid of distinct routes sent clean, ticks per month for the last 12
// months, and the nine milestone badges. Same thresholds as the site.
const SENDS = ['onsight', 'flash', 'redpoint'];
const SPORT = LEAD_GRADES.filter((g) => g !== '9c+');
const colorFor = (i) => (i < 7 ? '#2fa36b' : i < 13 ? '#1f93b0' : i < 19 ? '#e08a1e' : '#c43c3c');

const BADGES = [
  { key: 'first_tick', icon: faCheck },
  { key: 'ten_routes', icon: faListOl },
  { key: 'fifty_routes', icon: faFire },
  { key: 'grade_6a', icon: faArrowTrendUp },
  { key: 'grade_7a', icon: faBolt },
  { key: 'grade_8a', icon: faGem },
  { key: 'onsight_5', icon: faEye },
  { key: 'explorer', icon: faCompass },
  { key: 'all_year', icon: faCalendarCheck },
];

export function sportIndex(grade) {
  return SPORT.indexOf(String(grade || '').trim().toLowerCase());
}

export default function ClimbingStats({ ascents }) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const stats = useMemo(() => {
    const sends = ascents.filter((a) => SENDS.includes(a.ascent_style) && a.route && sportIndex(a.route.grade) >= 0);
    const by = {};
    const seen = new Set();
    sends.forEach((a) => {
      if (seen.has(a.route_id)) return;
      seen.add(a.route_id);
      const g = String(a.route.grade).trim().toLowerCase();
      by[g] = (by[g] || 0) + 1;
    });
    const pyramid = SPORT.map((g, i) => ({ grade: g, count: by[g] || 0, color: colorFor(i) }))
      .filter((r) => r.count > 0)
      .reverse();

    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.push({ key, d, count: ascents.filter((a) => String(a.ascent_date).slice(0, 7) === key).length });
    }

    const hardest = sends.reduce((m, a) => Math.max(m, sportIndex(a.route.grade)), -1);
    const styleCount = (st) => ascents.filter((a) => a.ascent_style === st).length;
    const routes = new Set(ascents.map((a) => a.route_id)).size;
    const sectors = new Set(ascents.map((a) => a.sector_name).filter(Boolean)).size;
    const active = months.filter((m) => m.count > 0).length;
    const reached = (g) => hardest >= SPORT.indexOf(g);
    const earned = {
      first_tick: ascents.length >= 1,
      ten_routes: routes >= 10,
      fifty_routes: routes >= 50,
      grade_6a: reached('6a'),
      grade_7a: reached('7a'),
      grade_8a: reached('8a'),
      onsight_5: styleCount('onsight') >= 5,
      explorer: sectors >= 5,
      all_year: active >= 6,
    };
    return {
      pyramid,
      pyramidMax: Math.max(1, ...pyramid.map((r) => r.count)),
      months,
      monthsMax: Math.max(1, ...months.map((m) => m.count)),
      yearCount: months.reduce((n, m) => n + m.count, 0),
      earned,
    };
  }, [ascents]);

  return (
    <View>
      <View style={styles.panel}>
        <SectionTitle align="left" size="sm">{t('site.user.climbing_stats.pyramid')}</SectionTitle>
        {stats.pyramid.length === 0 ? (
          <Text style={styles.empty}>{t('site.user.climbing_stats.pyramid_empty')}</Text>
        ) : stats.pyramid.map((r) => (
          <View key={r.grade} style={styles.pyrRow}>
            <Text style={styles.pyrGrade}>{r.grade}</Text>
            <View style={styles.pyrTrack}>
              <View style={[styles.pyrBar, { width: `${(r.count / stats.pyramidMax) * 100}%`, backgroundColor: r.color }]} />
            </View>
            <Text style={styles.pyrCount}>{r.count}</Text>
          </View>
        ))}
      </View>

      <View style={styles.panel}>
        <SectionTitle align="left" size="sm">{t('site.user.climbing_stats.per_month')}</SectionTitle>
        <View style={styles.months}>
          {stats.months.map((m) => (
            <View key={m.key} style={styles.monthCol}>
              {m.count > 0 && <Text style={styles.monthCount}>{m.count}</Text>}
              <View style={[styles.monthBar, { height: Math.max(3, (m.count / stats.monthsMax) * 90) }, m.count === 0 && styles.monthBarEmpty]} />
              <Text style={styles.monthLabel}>{monthShort(m.d, locale).slice(0, 3)}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.yearText}>{t('site.user.climbing_stats.this_year', { n: stats.yearCount })}</Text>
      </View>

      <View style={styles.panel}>
        <SectionTitle align="left" size="sm">{t('site.user.climbing_stats.badges')}</SectionTitle>
        <View style={styles.badges}>
          {BADGES.map((b) => {
            const on = stats.earned[b.key];
            return (
              <View key={b.key} style={[styles.badge, !on && styles.badgeOff]}>
                <View style={[styles.badgeIcon, on && styles.badgeIconOn]}>
                  <FontAwesomeIcon icon={b.icon} size={16} color={on ? COLORS.ink : COLORS.muted} />
                </View>
                <Text style={styles.badgeName} numberOfLines={1}>{t(`site.user.climbing_stats.badge.${b.key}`)}</Text>
                <Text style={styles.badgeDesc} numberOfLines={2}>{t(`site.user.climbing_stats.badge.${b.key}_desc`)}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  empty: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  pyrRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  pyrGrade: { width: 34, fontFamily: FONTS.displayBold, fontSize: 16, color: COLORS.ink },
  pyrTrack: { flex: 1, height: 16, borderRadius: 8, backgroundColor: COLORS.chalk, overflow: 'hidden' },
  pyrBar: { height: '100%', borderRadius: 8 },
  pyrCount: { width: 24, textAlign: 'right', fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2 },
  months: { flexDirection: 'row', alignItems: 'flex-end', height: 124, gap: 4 },
  monthCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  monthCount: { fontFamily: FONTS.bodyBold, fontSize: 10, color: COLORS.ink2 },
  monthBar: { width: '100%', borderRadius: 4, backgroundColor: COLORS.primary },
  monthBarEmpty: { backgroundColor: COLORS.chalk2 },
  monthLabel: { fontFamily: FONTS.bodySemi, fontSize: 9, color: COLORS.muted },
  yearText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.stone, marginTop: 10 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  badge: {
    width: '31.5%',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADII.md,
    backgroundColor: '#fff8e6',
    borderWidth: 1,
    borderColor: 'rgba(255,194,51,0.5)',
  },
  badgeOff: { backgroundColor: COLORS.chalk, borderColor: COLORS.line, opacity: 0.7 },
  badgeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.chalk2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  badgeIconOn: { backgroundColor: COLORS.hold },
  badgeName: { fontFamily: FONTS.bodyHeavy, fontSize: 11, color: COLORS.ink, textAlign: 'center' },
  badgeDesc: { fontFamily: FONTS.body, fontSize: 9.5, lineHeight: 13, color: COLORS.stone, textAlign: 'center', marginTop: 2 },
});
