import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList, Modal, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadSummitData, loadSummitAscentsData } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import { COLORS } from '../../assets/styles/styles';

const API = `${API_BASE_URL}/summit`;
// Matches summit.climbing.ge's own "Photos from the Summit" gallery — the
// `photo` field returned by /summit/ascents/{url_title} is already a relative
// path like "ascents/<hash>.jpg" (no {} placeholders, so no imgUri encoding
// is strictly required, but using it keeps this consistent with every other
// image path in the app).
const ASCENT_PHOTO_BASE = IMG_BASES.summitAscent;

function PhotoThumbnail({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.thumbWrap} onPress={() => onPress(item)} activeOpacity={0.8}>
      <Image
        source={{ uri: imgUri(ASCENT_PHOTO_BASE, item.photo) }}
        style={styles.thumbImage}
        resizeMode="cover"
      />
      <View style={styles.thumbCaptionBar}>
        <Text style={styles.thumbCaption} numberOfLines={1}>
          {item.name}{item.ascent_date ? ` · ${new Date(item.ascent_date).toLocaleDateString('en-GB')}` : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function AscentRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.ascentRow} onPress={() => onPress(item)} activeOpacity={0.7}>
      <View style={styles.ascentMain}>
        <View style={styles.ascentLeft}>
          <Text style={styles.climberName}>{item.name} {item.surname}</Text>
          <Text style={styles.ascentMeta}>
            {item.ascent_date ? new Date(item.ascent_date).toLocaleDateString('en-GB') : ''}
            {item.route_name ? `  ·  ${item.route_name}` : ''}
          </Text>
        </View>
        <View style={styles.ascentRight}>
          {item.is_gps_validated && (
            <View style={styles.gpsBadge}><Text style={styles.gpsBadgeText}>GPS ✓</Text></View>
          )}
          <Text style={styles.expandBtn}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function AscentDetailsModal({ ascent, onClose, t }) {
  return (
    <Modal visible={!!ascent} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {!!ascent && (
            <>
              <Text style={styles.modalName}>{ascent.name} {ascent.surname}</Text>
              <Text style={styles.modalMeta}>
                {ascent.ascent_date ? new Date(ascent.ascent_date).toLocaleDateString('en-GB') : ''}
                {ascent.ascent_time ? `  ·  ${ascent.ascent_time}` : ''}
              </Text>

              {!!ascent.photo && (
                <Image
                  source={{ uri: imgUri(ASCENT_PHOTO_BASE, ascent.photo) }}
                  style={styles.modalPhoto}
                  resizeMode="cover"
                />
              )}

              {(!!ascent.route_name || !!ascent.route_grade) && (
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowLabel}>{t('summit.route')}</Text>
                  <Text style={styles.modalRowValue}>
                    {ascent.route_name}{ascent.route_grade ? ` (${ascent.route_grade})` : ''}
                  </Text>
                </View>
              )}

              <View style={styles.modalRow}>
                <Text style={styles.modalRowLabel}>{t('summit.gps')}</Text>
                <Text style={[styles.modalRowValue, ascent.is_gps_validated ? styles.modalGpsOk : styles.modalGpsWarn]}>
                  {ascent.is_gps_validated ? `✓ ${t('summit.gps_verified')}` : `⚠ ${t('summit.gps_not_verified')}`}
                </Text>
              </View>

              {!!ascent.comment && (
                <View style={styles.modalCommentBox}>
                  <Text style={styles.modalComment}>{ascent.comment}</Text>
                </View>
              )}

              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.85}>
                <Text style={styles.modalCloseBtnText}>{t('summit.done')}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export default function SummitDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const { url_title, title } = route.params;
  const [summit, setSummit] = useState(null);
  const [ascents, setAscents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [selectedAscent, setSelectedAscent] = useState(null);
  const isFirstLoad = useRef(true);

  const load = useCallback(() => {
    if (isFirstLoad.current) setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    Promise.all([
      api.get(corsUrl(`${API}/show/${url_title}`)),
      api.get(corsUrl(`${API}/ascents/${url_title}`)),
    ]).then(([s, a]) => {
      setSummit(s.data);
      const data = a.data?.ascents ?? a.data ?? [];
      setAscents(Array.isArray(data) ? data : []);
    }).catch(async () => {
      // Offline (or the request failed) — fall back to whatever the Offline
      // Mode download cached. Ascent history is a best-effort "last seen"
      // snapshot here (it's inherently live/social data), but the summit's
      // own info is what actually matters for reaching "Record Ascent".
      const cachedSummit = await loadSummitData(url_title);
      if (cachedSummit) {
        setSummit(cachedSummit);
        const cachedAscents = await loadSummitAscentsData(url_title);
        const data = cachedAscents?.ascents ?? cachedAscents ?? [];
        setAscents(Array.isArray(data) ? data : []);
        setIsOffline(true);
      } else {
        setNoCache(true);
      }
    })
      .finally(() => {
        setLoading(false);
        isFirstLoad.current = false;
      });
  }, [url_title]);

  useFocusEffect(load);

  // Refetch the moment the device reconnects, so a stale "showing cached
  // data" banner doesn't linger after connectivity actually comes back.
  const wasDeviceOffline = useRef(deviceOffline);
  useEffect(() => {
    if (wasDeviceOffline.current && !deviceOffline) load();
    wasDeviceOffline.current = deviceOffline;
  }, [deviceOffline, load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (noCache || !summit) return <OfflineError />;

  const photoAscents = ascents.filter(a => !!a.photo);

  // The API sends both `title` and (when set) `ka_title` in one payload rather
  // than a locale-specific response — pick which leads based on the app's own
  // language rather than always showing the English title first.
  const primaryTitle = (locale === 'ka' && summit.ka_title) || summit.title;
  const secondaryTitle = primaryTitle === summit.title ? summit.ka_title : summit.title;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {isOffline && <OfflineBanner />}
      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>🏔️</Text>
        <Text style={styles.heroTitle}>{primaryTitle}</Text>
        {!!secondaryTitle && <Text style={styles.heroKa}>{secondaryTitle}</Text>}
        <View style={styles.heroBadges}>
          {!!summit.height && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{summit.height} m</Text>
            </View>
          )}
          {!!summit.region && (
            <View style={[styles.badge, styles.badgeOutline]}>
              <Text style={[styles.badgeText, styles.badgeOutlineText]}>{summit.region.us_name}</Text>
            </View>
          )}
        </View>
      </View>

      {!!summit.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('summit.about')}</Text>
          <Text style={styles.description}>{summit.description}</Text>
        </View>
      )}

      {(!!summit.latitude && !!summit.longitude) && (
        <View style={styles.coordsRow}>
          <Text style={styles.coordsLabel}>📍</Text>
          <Text style={styles.coordsText}>{summit.latitude}, {summit.longitude}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.recordBtn}
        onPress={() => navigation.navigate('submit_ascent', { summit_id: summit.id, url_title: summit.url_title, title: summit.title })}
        activeOpacity={0.85}
      >
        <Text style={styles.recordBtnText}>{t('summit.record_ascent')}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('summit.ascents')} ({ascents.length})
        </Text>
        {ascents.length === 0 ? (
          <Text style={styles.emptyText}>{t('summit.no_ascents')}</Text>
        ) : (
          ascents.map((item, i) => <AscentRow key={item.id ?? i} item={item} onPress={setSelectedAscent} />)
        )}
      </View>

      {photoAscents.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📷 {t('summit.photos_from_summit')}</Text>
          <View style={styles.photoGrid}>
            {photoAscents.map((item, i) => (
              <PhotoThumbnail key={item.id ?? i} item={item} onPress={setSelectedAscent} />
            ))}
          </View>
        </View>
      )}

      <AscentDetailsModal ascent={selectedAscent} onClose={() => setSelectedAscent(null)} t={t} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f6f8' },
  // Extra bottom room so the last ascent row never ends up under the floating
  // "Support Us" button (rendered globally in App.js, bottom-right).
  container: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: { fontSize: 48, marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  heroKa: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  badgeOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  badgeOutlineText: { color: 'rgba(255,255,255,0.9)' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  description: { fontSize: 14, color: '#444', lineHeight: 22 },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  coordsLabel: { fontSize: 16 },
  coordsText: { fontSize: 13, color: '#555', fontFamily: 'monospace' },
  recordBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  recordBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ascentRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  ascentMain: { flexDirection: 'row', alignItems: 'flex-start' },
  ascentLeft: { flex: 1 },
  climberName: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 3 },
  ascentMeta: { fontSize: 12, color: '#888' },
  ascentRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsBadge: {
    backgroundColor: '#d4edda',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  gpsBadgeText: { fontSize: 10, fontWeight: '700', color: '#155724' },
  expandBtn: { fontSize: 20, color: '#bbb', paddingHorizontal: 4, fontWeight: '700' },
  emptyText: { color: '#aaa', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
  },
  modalName: { fontSize: 19, fontWeight: '800', color: '#222', marginBottom: 4 },
  modalMeta: { fontSize: 13, color: '#888', marginBottom: 18 },
  modalPhoto: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    backgroundColor: '#f4f6f8',
    marginBottom: 12,
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  thumbWrap: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f4f6f8',
  },
  thumbImage: { width: '100%', height: '100%' },
  thumbCaptionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  thumbCaption: { fontSize: 10, color: '#fff', fontWeight: '600' },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalRowLabel: { fontSize: 13, color: '#888', fontWeight: '600' },
  modalRowValue: { fontSize: 13, color: '#333', fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  modalGpsOk: { color: '#1e8449' },
  modalGpsWarn: { color: '#b9770e' },
  modalCommentBox: {
    backgroundColor: '#f4f6f8',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  modalComment: { fontSize: 13, color: '#555', lineHeight: 19, fontStyle: 'italic' },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCloseBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
