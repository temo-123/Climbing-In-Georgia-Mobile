import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL, imgUri, IMG_BASES } from '../../utils/api';
import { useMyAscents, reloadMyAscents } from '../../utils/myAscents';
import { useLocale } from '../../utils/LocaleContext';
import { toDate, dayMonthYear } from '../../utils/eventDates';
import { apiErrorMessage } from '../../utils/apiError';
import PageHead from '../../components/ui/PageHead';
import Chip from '../../components/ui/Chip';
import EmptyState from '../../components/EmptyState';
import CachedImage from '../../components/CachedImage';
import ImageViewerModal from '../../components/ImageViewerModal';
import { useToast } from '../../components/ui/Toast';
import { SkeletonList } from '../../components/ui/Skeleton';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's /my_mtp_ascents (MyMtpAscentsListPage): recorded
// multi-pitch ascents with delete.
export default function MyMtpAscentsScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const toast = useToast();
  const { mtps, loaded, loading } = useMyAscents();
  const [photo, setPhoto] = useState(null);

  useEffect(() => { reloadMyAscents(); }, []);

  function confirmDelete(a) {
    Alert.alert(t('climb.delete_confirm'), `${a.mtp_name ?? ''}`, [
      { text: t('site.common.cancel'), style: 'cancel' },
      {
        text: t('site.common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/set_mtp_ascent/del_my_mtp_ascent/${a.id}`);
            toast.show({ message: t('climb.deleted') });
            reloadMyAscents();
          } catch (err) {
            toast.show({ type: 'error', message: apiErrorMessage(err, t) });
          }
        },
      },
    ]);
  }

  if (!loaded && loading) return <SkeletonList count={3} />;

  return (
    <View style={styles.flex}>
      <FlatList
        data={mtps}
        keyExtractor={(a) => String(a.id)}
        ListHeaderComponent={<PageHead art="carabiners" title={t('climb.my_mtp_ascents')} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loaded && loading} onRefresh={reloadMyAscents} colors={[COLORS.primary]} />}
        ListEmptyComponent={<EmptyState message={t('climb.mtp_empty')} />}
        renderItem={({ item: a }) => {
          const d = toDate(a.ascent_date);
          const ph = a.photo ? imgUri(IMG_BASES.mtpAscent, a.photo, a.updated_at) : null;
          return (
            <View style={styles.card}>
              <Text style={styles.name}>{t('multi_pitch.prefix')}{a.mtp_name ? `: ${a.mtp_name}` : ''}</Text>
              <View style={styles.meta}>
                {!!a.ascent_style && <Chip small tone="accent" label={t(`site.guide.mtp_ascent.style.${a.ascent_style}`)} />}
                <Text style={styles.date}>
                  {d ? dayMonthYear(d, locale) : ''}{a.ascent_time ? ` · ${String(a.ascent_time).slice(0, 5)}` : ''}
                </Text>
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
  name: { fontFamily: FONTS.displayBold, fontSize: 21, color: COLORS.ink },
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
