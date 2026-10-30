import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { imgUri } from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { toDate, dayMonthYear } from '../../utils/eventDates';
import Avatar from '../ui/Avatar';
import Chip from '../ui/Chip';
import CachedImage from '../CachedImage';
import { SkeletonBlock } from '../ui/Skeleton';
import { KINDS } from './kinds';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Everyone's ascents of one route / multi-pitch — the website's
// RouteAscentsListModal / MtpAscentsListModal: per-style counts, the most
// suggested grade, then one row per ascent (photo opens the viewer).
export default function AscentList({ kind, item, onOpenClimber, onOpenPhoto }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const cfg = KINDS[kind];
  const [list, setList] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get(cfg.ascents(item.id))
      .then(({ data }) => alive && setList(Array.isArray(data) ? data : []))
      .catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [kind, item.id]);

  const summary = useMemo(() => {
    if (!list) return null;
    const styles_ = {};
    const grades = {};
    for (const a of list) {
      if (a.ascent_style) styles_[a.ascent_style] = (styles_[a.ascent_style] || 0) + 1;
      if (a.suggested_grade) grades[a.suggested_grade] = (grades[a.suggested_grade] || 0) + 1;
    }
    const consensus = Object.entries(grades).sort((x, y) => y[1] - x[1])[0]?.[0];
    return { styles_, consensus };
  }, [list]);

  if (!list) {
    return (
      <View style={s.loading}>
        <SkeletonBlock height={52} radius={RADII.md} />
        <SkeletonBlock height={52} radius={RADII.md} />
      </View>
    );
  }

  if (list.length === 0) return <Text style={s.empty}>{t(`${cfg.i18n}.empty`)}</Text>;

  return (
    <View>
      <View style={s.summary}>
        {Object.entries(summary.styles_).map(([style, n]) => (
          <Chip key={style} tone="accent" label={`${t(`${cfg.i18n}.style.${style}`)} · ${n}`} />
        ))}
        {!!summary.consensus && (
          <Chip tone="hold" label={`${t('site.guide.route_ascent.grade_consensus')}: ${summary.consensus}`} />
        )}
      </View>

      {list.map((a) => {
        const d = toDate(a.ascent_date);
        const photo = a.photo ? imgUri(cfg.photoBase, a.photo) : null;
        return (
          <View key={a.id} style={s.row}>
            <TouchableOpacity onPress={() => a.user && onOpenClimber?.(a.user.id)} disabled={!a.user}>
              <Avatar user={a.user} size={40} />
            </TouchableOpacity>
            <View style={s.body}>
              <Text style={s.name} numberOfLines={1}>
                {a.user ? `${a.user.name ?? ''} ${a.user.surname ?? ''}`.trim() : '—'}
              </Text>
              <View style={s.metaRow}>
                {!!a.ascent_style && <Chip small tone="accent" label={t(`${cfg.i18n}.style.${a.ascent_style}`)} />}
                {a.attempts > 1 && <Chip small label={t('site.guide.route_ascent.attempts_short', { count: a.attempts })} />}
                {!!a.suggested_grade && <Chip small tone="hold" label={a.suggested_grade} />}
                <Text style={s.date}>{d ? dayMonthYear(d, locale) : ''}{a.ascent_time ? ` · ${String(a.ascent_time).slice(0, 5)}` : ''}</Text>
              </View>
              {!!a.comment && <Text style={s.comment}>{a.comment}</Text>}
            </View>
            {!!photo && (
              <TouchableOpacity onPress={() => onOpenPhoto?.(photo)}>
                <CachedImage uri={photo} style={s.photo} contentFit="cover" />
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  loading: { gap: 10 },
  empty: { fontFamily: FONTS.bodySemi, color: COLORS.muted, textAlign: 'center', paddingVertical: 24 },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    marginBottom: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  body: { flex: 1, gap: 5 },
  name: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.ink },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5 },
  date: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },
  comment: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  photo: { width: 64, height: 64, borderRadius: RADII.sm },
});
