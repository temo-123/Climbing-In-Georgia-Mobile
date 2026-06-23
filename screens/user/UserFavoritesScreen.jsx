import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const API = 'https://climbing.ge/api';
const TABS = ['areas', 'events'];

function AreaCard({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title ?? item.name ?? '—'}</Text>
      {!!item.region && <Text style={styles.cardSub}>{item.region}</Text>}
    </View>
  );
}

function EventCard({ item }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{item.title ?? item.name ?? '—'}</Text>
      {!!item.event_date && <Text style={styles.cardSub}>{new Date(item.event_date).toLocaleDateString()}</Text>}
    </View>
  );
}

export default function UserFavoritesScreen({ route }) {
  const { t } = useTranslation();
  const initialTab = route?.params?.tab ?? 'areas';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [areas, setAreas] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`${API}/get_faworite/get_faworite_outdoor_region`).catch(() => ({ data: [] })),
      api.get(`${API}/get_faworite/get_interested_events`).catch(() => ({ data: [] })),
    ]).then(([a, e]) => {
      setAreas(Array.isArray(a.data) ? a.data : a.data?.data ?? []);
      setEvents(Array.isArray(e.data) ? e.data : e.data?.data ?? []);
    }).catch(() => setError(t('auth.generic_error')))
      .finally(() => setLoading(false));
  }, []);

  const tabLabels = {
    areas: t('user.favorite_areas'),
    events: t('user.interested_events'),
  };

  const activeData = { areas, events }[activeTab] ?? [];
  const CardComponent = { areas: AreaCard, events: EventCard }[activeTab];
  const emptyKey = { areas: 'user.no_favorite_areas', events: 'user.no_interested_events' }[activeTab];

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]} numberOfLines={1}>
              {tabLabels[tab]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#279fbb" /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : activeData.length === 0 ? (
        <View style={styles.center}><Text style={styles.emptyText}>{t(emptyKey)}</Text></View>
      ) : (
        <FlatList
          data={activeData}
          keyExtractor={(item, i) => String(item.id ?? i)}
          renderItem={({ item }) => <CardComponent item={item} />}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#279fbb' },
  tabText: { fontSize: 11, color: '#888', fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: '#279fbb' },
  list: { padding: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#222', marginBottom: 4 },
  cardSub: { fontSize: 12, color: '#888' },
  price: { fontSize: 15, fontWeight: '700', color: '#279fbb', marginTop: 4 },
  emptyText: { color: '#888', fontSize: 15 },
  errorText: { color: '#e74c3c', fontSize: 14 },
});
