import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const API = 'https://climbing.ge/api';

function AscentCard({ item }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.summitName}>{item.summit?.title ?? item.summit_title ?? item.title ?? '—'}</Text>
        {item.summit?.height && <Text style={styles.height}>{item.summit.height} m</Text>}
      </View>
      {!!item.note && <Text style={styles.note} numberOfLines={3}>{item.note}</Text>}
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
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`${API}/my_ascents`)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => setError(t('auth.generic_error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#279fbb" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_ascents')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <AscentCard item={item} />}
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
    borderLeftWidth: 3, borderLeftColor: '#279fbb',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  summitName: { flex: 1, fontSize: 15, fontWeight: '700', color: '#222', marginRight: 8 },
  height: { fontSize: 13, fontWeight: '600', color: '#279fbb' },
  note: { fontSize: 13, color: '#555', lineHeight: 19, marginBottom: 4 },
  date: { fontSize: 11, color: '#aaa', marginTop: 6, textAlign: 'right' },
  emptyText: { color: '#888', fontSize: 15 },
  errorText: { color: '#e74c3c', fontSize: 14 },
});
