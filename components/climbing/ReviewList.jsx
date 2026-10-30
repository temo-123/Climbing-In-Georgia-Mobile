import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { toDate, dayMonthYear } from '../../utils/eventDates';
import Avatar from '../ui/Avatar';
import { StarsShow } from '../ui/Stars';
import { SkeletonBlock } from '../ui/Skeleton';
import { KINDS } from './kinds';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Public reviews of one route / multi-pitch (RouteAllReviewsModal /
// MtpAllReviewsModal). Reviewer names open their climber profile.
export default function ReviewList({ kind, item, onOpenClimber }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [list, setList] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get(KINDS[kind].reviews(item.id))
      .then(({ data }) => alive && setList(Array.isArray(data) ? data : []))
      .catch(() => alive && setList([]));
    return () => { alive = false; };
  }, [kind, item.id]);

  if (!list) {
    return (
      <View style={s.loading}>
        <SkeletonBlock height={64} radius={RADII.md} />
        <SkeletonBlock height={64} radius={RADII.md} />
      </View>
    );
  }

  if (list.length === 0) return <Text style={s.empty}>{t('site.guide.route.no_feedbacks_message')}</Text>;

  return (
    <View>
      {list.map((r) => {
        const d = toDate(r.created_at);
        return (
          <View key={r.id} style={s.row}>
            <TouchableOpacity onPress={() => r.user && onOpenClimber?.(r.user.id)} disabled={!r.user} style={s.head}>
              <Avatar user={r.user} size={36} />
              <View style={s.flex}>
                <Text style={s.name} numberOfLines={1}>
                  {r.user ? `${r.user.name ?? ''} ${r.user.surname ?? ''}`.trim() : '—'}
                </Text>
                <Text style={s.date}>{d ? dayMonthYear(d, locale) : ''}</Text>
              </View>
              <StarsShow stars={r.stars} size={13} showEmpty />
            </TouchableOpacity>
            {!!r.text && <Text style={s.text}>{r.text}</Text>}
          </View>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  loading: { gap: 10 },
  empty: { fontFamily: FONTS.bodySemi, color: COLORS.muted, textAlign: 'center', paddingVertical: 24 },
  row: {
    padding: 12,
    marginBottom: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    gap: 8,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.ink },
  date: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },
  text: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.ink2 },
});
