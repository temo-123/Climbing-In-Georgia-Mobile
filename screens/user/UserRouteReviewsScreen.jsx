import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../../utils/api';
import { saveOfflineData, loadOfflineData } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import { COLORS } from '../../assets/styles/styles';

const API = API_BASE_URL;
const CACHE_KEY = '@my_route_reviews_cache';

const GRADE_COLORS = {
  hard: '#df8d8d',
  moderate: '#dfad8d',
  default: '#f6d27e',
};

function gradeColor(grade) {
  if (!grade) return GRADE_COLORS.default;
  const g = grade.toString().toLowerCase();
  if (g.includes('7b+') || g.includes('7c') || g.includes('7d') || g.includes('8') || g.includes('wi5+') || g.includes('wi6')) return GRADE_COLORS.hard;
  if (g.includes('6c+') || g.includes('7a') || g.includes('7b') || g.includes('wi4+') || g.includes('wi5')) return GRADE_COLORS.moderate;
  return GRADE_COLORS.default;
}

function ReviewCard({ item }) {
  const grade = item.grade ?? item.route?.grade_fr ?? item.route?.grade ?? null;
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.routeName} numberOfLines={1}>{item.route?.name ?? item.route_name ?? '—'}</Text>
        {grade && <View style={[styles.gradeBadge, { backgroundColor: gradeColor(grade) }]}><Text style={styles.gradeText}>{grade}</Text></View>}
      </View>
      {!!item.comment && <Text style={styles.comment} numberOfLines={4}>{item.comment}</Text>}
      <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
    </View>
  );
}

export default function UserRouteReviewsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`${API}/get_route_review/get_user_review`),
      api.get(`${API}/get_mtp_review/get_user_mtp_reviews`),
    ]).then(([routes, mtp]) => {
      const routeData = Array.isArray(routes.data) ? routes.data : routes.data?.data ?? [];
      const mtpData = Array.isArray(mtp.data) ? mtp.data : mtp.data?.data ?? [];
      const combined = [...routeData, ...mtpData];
      setData(combined);
      saveOfflineData(CACHE_KEY, combined);
    }).catch(async () => {
      const cached = await loadOfflineData(CACHE_KEY);
      if (Array.isArray(cached) && cached.length > 0) {
        setData(cached);
        setIsOffline(true);
      } else {
        setNoCache(true);
      }
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (noCache) return <OfflineError />;
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_reviews')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <ReviewCard item={item} />}
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
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  routeName: { flex: 1, fontSize: 14, fontWeight: '700', color: '#222' },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  gradeText: { fontSize: 12, fontWeight: '700', color: '#333' },
  comment: { fontSize: 14, color: '#555', lineHeight: 20 },
  date: { fontSize: 11, color: '#aaa', marginTop: 8, textAlign: 'right' },
  emptyText: { color: '#888', fontSize: 15 },
});
