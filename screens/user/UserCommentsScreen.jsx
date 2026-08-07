import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../../utils/api';
import { saveOfflineData, loadOfflineData } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import { COLORS } from '../../assets/styles/styles';

const API = API_BASE_URL;
const CACHE_KEY = '@my_comments_cache';

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
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    api.get(`${API}/get_guide_comment/get_user_comments`)
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
  if (!data.length) return <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_comments')}</Text></View>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item, i) => String(item.id ?? i)}
      renderItem={({ item }) => <CommentCard item={item} />}
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
  articleTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  comment: { fontSize: 14, color: '#333', lineHeight: 20 },
  date: { fontSize: 11, color: '#aaa', marginTop: 8, textAlign: 'right' },
  emptyText: { color: '#888', fontSize: 15 },
});
