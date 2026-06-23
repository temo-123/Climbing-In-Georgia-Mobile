import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const API = 'https://climbing.ge/api';

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
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`${API}/get_route_review/get_user_review`).catch(() => ({ data: [] })),
      api.get(`${API}/get_mtp_review/get_user_mtp_reviews`).catch(() => ({ data: [] })),
    ]).then(([routes, mtp]) => {
      const routeData = Array.isArray(routes.data) ? routes.data : routes.data?.data ?? [];
      const mtpData = Array.isArray(mtp.data) ? mtp.data : mtp.data?.data ?? [];
      setData([...routeData, ...mtpData]);
    }).catch(() => setError(t('auth.generic_error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#279fbb" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_reviews')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <ReviewCard item={item} />}
      contentContainerStyle={styles.list}
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
  errorText: { color: '#e74c3c', fontSize: 14 },
});
