import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const API = 'https://climbing.ge/api';

function CommentCard({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.articleTitle} numberOfLines={1}>{item.article?.title ?? item.article_title ?? '—'}</Text>
      <Text style={styles.comment} numberOfLines={4}>{item.comment ?? item.content ?? '—'}</Text>
      <Text style={styles.date}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}</Text>
    </View>
  );
}

export default function UserCommentsScreen() {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`${API}/get_guide_comment/get_user_comments`)
      .then(res => setData(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => setError(t('auth.generic_error')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#279fbb" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_comments')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <CommentCard item={item} />}
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
  articleTitle: { fontSize: 13, fontWeight: '700', color: '#279fbb', marginBottom: 6 },
  comment: { fontSize: 14, color: '#333', lineHeight: 20 },
  date: { fontSize: 11, color: '#aaa', marginTop: 8, textAlign: 'right' },
  emptyText: { color: '#888', fontSize: 15 },
  errorText: { color: '#e74c3c', fontSize: 14 },
});
