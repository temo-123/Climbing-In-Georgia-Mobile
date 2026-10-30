import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTrashCan, faListCheck, faArrowUpRightDots, faHandBackFist } from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL, imgUri, IMG_BASES } from '../../utils/api';
import { useMyAscents, reloadMyAscents } from '../../utils/myAscents';
import { useLocale } from '../../utils/LocaleContext';
import { toDate, dayMonthYear } from '../../utils/eventDates';
import { apiErrorMessage } from '../../utils/apiError';
import { boulderToFont, BOULDER_GRADES } from '../../utils/grades';
import PageHead from '../../components/ui/PageHead';
import StatTiles from '../../components/ui/StatTiles';
import Chip from '../../components/ui/Chip';
import GradeTape from '../../components/ui/GradeTape';
import EmptyState from '../../components/EmptyState';
import CachedImage from '../../components/CachedImage';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useToast } from '../../components/ui/Toast';
import { SkeletonList } from '../../components/ui/Skeleton';
import ClimbingStats, { sportIndex } from '../../components/user/ClimbingStats';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's /my_route_ascents (MyRouteAscentsListPage): the climber's
// logbook of route ticks — totals, hardest send / boulder (top rope
// excluded), climbing stats, then every ascent with delete.
export default function MyLogbookScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const toast = useToast();
  const { routes, loaded, loading } = useMyAscents();
  const [photo, setPhoto] = useState(null);

  useEffect(() => { reloadMyAscents(); }, []);

  const summary = useMemo(() => {
    const clean = routes.filter((a) => a.ascent_style && a.ascent_style !== 'toprope' && a.route);
    let hardest = null;
    let hardestBoulder = null;
    for (const a of clean) {
      const g = a.route.grade;
      if (sportIndex(g) >= 0 && (!hardest || sportIndex(g) > sportIndex(hardest))) hardest = String(g).toLowerCase();
      const bi = BOULDER_GRADES.indexOf(String(g).toUpperCase());
      if (bi >= 0 && (!hardestBoulder || bi > BOULDER_GRADES.indexOf(hardestBoulder))) hardestBoulder = String(g).toUpperCase();
    }
    return { hardest, hardestBoulder };
  }, [routes]);

  function confirmDelete(a) {
    Alert.alert(t('climb.delete_confirm'), `${a.route_name ?? ''}`, [
      { text: t('site.common.cancel'), style: 'cancel' },
      {
        text: t('site.common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/set_route_ascent/del_my_route_ascent/${a.id}`);
            toast.show({ message: t('climb.deleted') });
            reloadMyAscents();
          } catch (err) {
            toast.show({ type: 'error', message: apiErrorMessage(err, t) });
          }
        },
      },
    ]);
  }

  const header = (
    <View>
      <PageHead art="notebook" title={t('climb.my_logbook')} />
      {routes.length > 0 && (
        <>
          <StatTiles
            items={[
              { icon: faListCheck, value: routes.length, label: t('site.user.route_ascents.total') },
              { icon: faArrowUpRightDots, value: summary.hardest || '–', label: t('site.user.route_ascents.hardest') },
              ...(summary.hardestBoulder ? [{
                icon: faHandBackFist,
                value: boulderToFont(summary.hardestBoulder),
                label: t('site.user.route_ascents.hardest_boulder'),
                sub: summary.hardestBoulder,
              }] : []),
            ]}
          />
          <ClimbingStats ascents={routes} />
        </>
      )}
    </View>
  );

  if (!loaded && loading) return <SkeletonList count={3} />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={routes}
        keyExtractor={(a) => String(a.id)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loaded && loading} onRefresh={reloadMyAscents} colors={[COLORS.primary]} />}
        ListEmptyComponent={<EmptyState message={t('climb.logbook_empty')} />}
        renderItem={({ item: a }) => {
          const d = toDate(a.ascent_date);
          const ph = a.photo ? imgUri(IMG_BASES.routeAscent, a.photo, a.updated_at) : null;
          return (
            <View style={styles.card}>
              <View style={styles.top}>
                <View style={styles.flex}>
                  <Text style={styles.route} numberOfLines={2}>{a.route_name ?? '—'}</Text>
                  {!!a.sector_name && <Text style={styles.sector}>{a.sector_name}</Text>}
                </View>
                {!!a.route_grade && <GradeTape grade={a.route_grade} />}
              </View>
              <View style={styles.meta}>
                <Chip small tone={a.ascent_style === 'toprope' ? 'default' : 'success'} label={t(`site.guide.route_ascent.style.${a.ascent_style}`)} />
                {a.attempts > 1 && <Chip small label={t('site.guide.route_ascent.attempts_short', { count: a.attempts })} />}
                {!!a.suggested_grade && <Chip small tone="hold" label={`${t('site.user.route_ascents.col_suggested_grade')}: ${a.suggested_grade}`} />}
                <Text style={styles.date}>{d ? dayMonthYear(d, locale) : ''}</Text>
              </View>
              {!!a.comment && <Text style={styles.comment}>{a.comment}</Text>}
              <View style={styles.bottom}>
                {!!ph && (
                  <TouchableOpacity onPress={() => setPhoto(ph)}>
                    <CachedImage uri={ph} style={styles.photo} contentFit="cover" />
                  </TouchableOpacity>
                )}
                <View style={styles.flex} />
                <TouchableOpacity onPress={() => confirmDelete(a)} hitSlop={8} style={styles.del}>
                  <FontAwesomeIcon icon={faTrashCan} size={14} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
      <ImageViewerModal uris={photo ? [photo] : []} initialIndex={0} visible={!!photo} onClose={() => setPhoto(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16, paddingBottom: 120 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 10,
    gap: 8,
    ...SHADOWS.sm,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  route: { fontFamily: FONTS.displayBold, fontSize: 21, lineHeight: 24, color: COLORS.ink },
  sector: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.primary, marginTop: 2 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  date: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },
  comment: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  bottom: { flexDirection: 'row', alignItems: 'center' },
  photo: { width: 72, height: 54, borderRadius: RADII.sm },
  del: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fbe9ea',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
