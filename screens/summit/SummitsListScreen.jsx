import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const API = 'https://climbing.ge/api/summit';

function SummitCard({ item, navigation }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🏔️</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
          {!!item.ka_title && <Text style={styles.kaTitle}>{item.ka_title}</Text>}
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
        <TouchableOpacity
          style={styles.detailBtn}
          onPress={() => navigation.navigate('summit_detail', { url_title: item.url_title, title: item.title })}
          activeOpacity={0.8}
        >
          <Text style={styles.detailBtnText}>Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.ascentBtn}
          onPress={() => navigation.navigate('submit_ascent', { summit_id: item.id, title: item.title })}
          activeOpacity={0.8}
        >
          <Text style={styles.ascentBtnText}>Record Ascent</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SummitsListScreen({ navigation }) {
  const { t } = useTranslation();
  const [summits, setSummits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    api.get(`${API}/list`)
      .then(res => setSummits(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError(t('auth.generic_error')))
      .finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(); }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#279fbb" /></View>;
  if (error) return <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.qrBtn}
        onPress={() => navigation.navigate('qr_scanner')}
        activeOpacity={0.85}
      >
        <Text style={styles.qrIcon}>📷</Text>
        <Text style={styles.qrBtnText}>{t('summit.scan_qr')}</Text>
      </TouchableOpacity>

      <FlatList
        data={summits}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => <SummitCard item={item} navigation={navigation} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={['#279fbb']} />}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>{t('summit.no_summits')}</Text></View>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  list: { padding: 16, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#279fbb',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 10,
  },
  qrIcon: { fontSize: 22 },
  qrBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f6fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 24 },
  cardInfo: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#1a1a1a', marginBottom: 2 },
  kaTitle: { fontSize: 13, color: '#555', marginBottom: 2 },
  region: { fontSize: 12, color: '#279fbb', fontWeight: '600' },
  heightBadge: {
    backgroundColor: '#279fbb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 52,
  },
  heightText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  heightUnit: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  description: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 10 },
  detailBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  detailBtnText: { color: '#279fbb', fontWeight: '600', fontSize: 13 },
  ascentBtn: {
    flex: 1,
    backgroundColor: '#279fbb',
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  ascentBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyText: { color: '#888', fontSize: 15 },
  errorText: { color: '#e74c3c', fontSize: 14 },
});
