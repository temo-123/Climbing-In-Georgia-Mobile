import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../../utils/api';
import { saveOfflineData, loadOfflineData } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import { COLORS } from '../../assets/styles/styles';

const API = API_BASE_URL;
const CACHE_KEY = '@my_ascents_cache';

function AscentCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.summitName}>{item.summit?.title ?? item.summit_title ?? item.title ?? '—'}</Text>
        {item.summit?.height && <Text style={styles.height}>{item.summit.height} m</Text>}
      </View>
      {!!(item.comment ?? item.note) && <Text style={styles.note} numberOfLines={3}>{item.comment ?? item.note}</Text>}
      <Text style={styles.date}>
        {item.ascent_date
          ? new Date(item.ascent_date).toLocaleDateString()
          : item.created_at
            ? new Date(item.created_at).toLocaleDateString()
            : ''}
      </Text>
    </View>
  );
}

export default function UserAscentsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    api.get(`${API}/summit/my_ascents`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setData(list);
        saveOfflineData(CACHE_KEY, list);
      })
      .catch(async () => {
        // Offline (or the request failed) — fall back to the last successful
        // fetch instead of a bare "Something went wrong", matching every
        // other summit screen's offline behavior.
        const cached = await loadOfflineData(CACHE_KEY);
        if (Array.isArray(cached) && cached.length > 0) {
          setData(cached);
          setIsOffline(true);
        } else {
          setNoCache(true);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (noCache) return <OfflineError />;
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_ascents')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <AscentCard item={item} />}
      contentContainerStyle={styles.list}
      ListHeaderComponent={isOffline ? <OfflineBanner /> : null}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    borderLeftWidth: 3, borderLeftColor: COLORS.primary,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  summitName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222', marginRight: 8 },
  height: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  note: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  date: { fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'right' },
  emptyText: { color: '#888', fontSize: 15 },
});
