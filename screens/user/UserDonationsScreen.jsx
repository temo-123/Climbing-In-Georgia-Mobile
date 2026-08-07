import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../../utils/api';
import { saveOfflineData, loadOfflineData } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import { COLORS } from '../../assets/styles/styles';

const API = API_BASE_URL;
const CACHE_KEY = '@my_donations_cache';

function DonationCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.amount}>{item.amount} {item.currency ?? '₾'}</Text>
        <Text style={[styles.status, item.status === 'paid' ? styles.paid : styles.pending]}>
          {item.status ?? '—'}
        </Text>
      </View>
      {!!item.message && <Text style={styles.message} numberOfLines={3}>{item.message}</Text>}
      <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
    </View>
  );
}

export default function UserDonationsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    api.get(`${API}/my_donations`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setData(list);
        saveOfflineData(CACHE_KEY, list);
      })
      .catch(async () => {
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
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_donations')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <DonationCard item={item} />}
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
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  amount: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  status: { fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  paid: { backgroundColor: '#d4edda', color: '#155724' },
  pending: { backgroundColor: '#fff3cd', color: '#856404' },
  message: { fontSize: 13, color: '#555', lineHeight: 19 },
  date: { fontSize: 11, color: '#aaa', marginTop: 8, textAlign: 'right' },
  emptyText: { color: '#888', fontSize: 15 },
});
