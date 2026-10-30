import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import PendingAscentsBanner from '../../components/PendingAscentsBanner';
import PageHead from '../../components/ui/PageHead';
import Button from '../../components/ui/Button';
import { SkeletonList } from '../../components/ui/Skeleton';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faQrcode, faMountain, faWifi } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

const API = `${API_BASE_URL}/summit`;

function SummitCard({ item, navigation, t, locale }) {
  // The API doesn't send a locale-specific response — it sends both `title`
  // and (when set) `ka_title` in the same payload — so which one leads is
  // purely a display choice that should follow the app's own language.
  const primaryTitle = (locale === 'ka' && item.ka_title) || item.title;
  const secondaryTitle = primaryTitle === item.title ? item.ka_title : item.title;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <FontAwesomeIcon icon={faMountain} size={20} color={HEAD_VIOLET} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.title} numberOfLines={2}>{primaryTitle}</Text>
          {!!secondaryTitle && <Text style={styles.kaTitle}>{secondaryTitle}</Text>}
          {!!item.region && <Text style={styles.region}>{item.region.us_name}</Text>}
        </View>
        {!!item.height && (
          <View style={styles.heightBadge}>
            <Text style={styles.heightText}>{item.height}</Text>
            <Text style={styles.heightUnit}>m</Text>
          </View>
        )}
      </View>

      {!!item.description && (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      )}

      <View style={styles.actions}>
        <Button
          small
          variant="outline"
          title={t('summit.details')}
          style={styles.flex}
          onPress={() => navigation.navigate('summit_detail', { url_title: item.url_title, title: item.title })}
        />
        <Button
          small
          title={t('summit.record_ascent')}
          style={styles.flex}
          onPress={() => navigation.navigate('submit_ascent', { summit_id: item.id, url_title: item.url_title, title: item.title })}
        />
      </View>
    </View>
  );
}

export default function SummitsListScreen({ navigation }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const [summits, setSummits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);

  function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    setIsOffline(false);
    setNoCache(false);
    api.get(corsUrl(`${API}/list`))
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setSummits(data);
        saveOfflineData(OFFLINE_KEYS.summits, data);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.summits);
        if (cached && cached.length > 0) {
          setSummits(cached);
          setIsOffline(true);
        } else {
          setNoCache(true);
        }
      })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(); }, []);

  // This screen's own `isOffline` (cached-data banner) only gets set/cleared
  // inside load()'s then/catch, so once connectivity actually drops it stays
  // stuck showing cached data even after the device reconnects — nothing
  // otherwise re-runs load() to prove the server is reachable again. Refetch
  // the moment the app-wide connectivity flag flips back to online.
  const wasDeviceOffline = useRef(deviceOffline);
  useEffect(() => {
    if (wasDeviceOffline.current && !deviceOffline) load(true);
    wasDeviceOffline.current = deviceOffline;
  }, [deviceOffline]);

  if (loading) return <SkeletonList count={4} />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.container}>
      {isOffline && <OfflineBanner />}
      <PendingAscentsBanner />

      <FlatList
        ListHeaderComponent={
          <View>
            <PageHead art="summit" title={t('nav.summits')}>
              <Button
                variant="hold"
                block={false}
                icon={faQrcode}
                title={t('summit.scan_qr')}
                onPress={() => navigation.navigate('qr_scanner')}
                style={styles.qrBtn}
              />
            </PageHead>
            <View style={styles.offlineHintBox}>
              <FontAwesomeIcon icon={faWifi} size={13} color={COLORS.primaryDark} />
              <Text style={styles.offlineHintText}>{t('summit.offline_hint')}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('offline_mode')} activeOpacity={0.7}>
                <Text style={styles.offlineHintLink}>{t('summit.offline_hint_link')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        data={summits}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <SummitCard item={item} navigation={navigation} t={t} locale={locale} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>{t('summit.no_summits')}</Text></View>}
      />
    </View>
  );
}

const HEAD_VIOLET = '#6c45c4';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.chalk },
  flex: { flex: 1 },
  offlineHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADII.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    gap: 8,
  },
  offlineHintText: { fontSize: 12, fontFamily: FONTS.bodyMedium, color: COLORS.primaryDark, flexShrink: 1 },
  offlineHintLink: { fontSize: 12, color: COLORS.primary, fontFamily: FONTS.bodyHeavy, textDecorationLine: 'underline' },
  // Extra bottom room so the last card never ends up under the floating
  // "Support Us" button (rendered globally in App.js, bottom-right).
  list: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrBtn: { marginTop: 16 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconCircle: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#efeafa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardInfo: { flex: 1 },
  title: { fontSize: 22, lineHeight: 25, fontFamily: FONTS.displayBold, color: COLORS.ink },
  kaTitle: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone, marginTop: 1 },
  region: { fontSize: 12, color: HEAD_VIOLET, fontFamily: FONTS.bodyBold, marginTop: 2 },
  heightBadge: {
    backgroundColor: COLORS.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 56,
  },
  heightText: { fontSize: 20, lineHeight: 22, fontFamily: FONTS.displayBold, color: COLORS.hold },
  heightUnit: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontFamily: FONTS.bodyBold },
  description: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone, lineHeight: 19, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  emptyText: { color: COLORS.muted, fontSize: 15, fontFamily: FONTS.body },
});
