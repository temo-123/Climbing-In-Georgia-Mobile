import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';

const API = 'https://climbing.ge/api/summit';

function AscentRow({ item }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.ascentRow}>
      <View style={styles.ascentMain}>
        <View style={styles.ascentLeft}>
          <Text style={styles.climberName}>{item.name} {item.surname}</Text>
          <Text style={styles.ascentMeta}>
            {item.ascent_date ? new Date(item.ascent_date).toLocaleDateString('en-GB') : ''}
            {item.route_name ? `  ·  ${item.route_name}` : ''}
          </Text>
        </View>
        <View style={styles.ascentRight}>
          {item.is_gps_validated && (
            <View style={styles.gpsBadge}><Text style={styles.gpsBadgeText}>GPS ✓</Text></View>
          )}
          {!!item.comment && (
            <TouchableOpacity onPress={() => setExpanded(v => !v)}>
              <Text style={styles.expandBtn}>{expanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      {expanded && !!item.comment && (
        <Text style={styles.comment}>{item.comment}</Text>
      )}
    </View>
  );
}

export default function SummitDetailScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { url_title, title } = route.params;
  const [summit, setSummit] = useState(null);
  const [ascents, setAscents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`${API}/show/${url_title}`),
      api.get(`${API}/ascents/${url_title}`),
    ]).then(([s, a]) => {
      setSummit(s.data);
      const data = a.data?.ascents ?? a.data ?? [];
      setAscents(Array.isArray(data) ? data : []);
    }).catch(() => setError(t('auth.generic_error')))
      .finally(() => setLoading(false));
  }, [url_title]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#279fbb" /></View>;
  if (error || !summit) return <View style={styles.center}><Text style={styles.errorText}>{error || t('auth.generic_error')}</Text></View>;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <Text style={styles.heroIcon}>🏔️</Text>
        <Text style={styles.heroTitle}>{summit.title}</Text>
        {!!summit.ka_title && <Text style={styles.heroKa}>{summit.ka_title}</Text>}
        <View style={styles.heroBadges}>
          {!!summit.height && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{summit.height} m</Text>
            </View>
          )}
          {!!summit.region && (
            <View style={[styles.badge, styles.badgeOutline]}>
              <Text style={[styles.badgeText, styles.badgeOutlineText]}>{summit.region.us_name}</Text>
            </View>
          )}
        </View>
      </View>

      {!!summit.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('summit.about')}</Text>
          <Text style={styles.description}>{summit.description}</Text>
        </View>
      )}

      {(!!summit.latitude && !!summit.longitude) && (
        <View style={styles.coordsRow}>
          <Text style={styles.coordsLabel}>📍</Text>
          <Text style={styles.coordsText}>{summit.latitude}, {summit.longitude}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.recordBtn}
        onPress={() => navigation.navigate('submit_ascent', { summit_id: summit.id, title: summit.title })}
        activeOpacity={0.85}
      >
        <Text style={styles.recordBtnText}>{t('summit.record_ascent')}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {t('summit.ascents')} ({ascents.length})
        </Text>
        {ascents.length === 0 ? (
          <Text style={styles.emptyText}>{t('summit.no_ascents')}</Text>
        ) : (
          ascents.map((item, i) => <AscentRow key={item.id ?? i} item={item} />)
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f6f8' },
  container: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  heroCard: {
    backgroundColor: '#279fbb',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  heroIcon: { fontSize: 48, marginBottom: 10 },
  heroTitle: { fontSize: 22, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 4 },
  heroKa: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 12 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  badgeOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.6)' },
  badgeOutlineText: { color: 'rgba(255,255,255,0.9)' },
  section: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#279fbb', marginBottom: 12 },
  description: { fontSize: 14, color: '#444', lineHeight: 22 },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  coordsLabel: { fontSize: 16 },
  coordsText: { fontSize: 13, color: '#555', fontFamily: 'monospace' },
  recordBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 16,
  },
  recordBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  ascentRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  ascentMain: { flexDirection: 'row', alignItems: 'flex-start' },
  ascentLeft: { flex: 1 },
  climberName: { fontSize: 14, fontWeight: '600', color: '#222', marginBottom: 3 },
  ascentMeta: { fontSize: 12, color: '#888' },
  ascentRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsBadge: {
    backgroundColor: '#d4edda',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  gpsBadgeText: { fontSize: 10, fontWeight: '700', color: '#155724' },
  expandBtn: { fontSize: 14, color: '#279fbb', paddingHorizontal: 4 },
  comment: { fontSize: 13, color: '#555', marginTop: 8, lineHeight: 19, fontStyle: 'italic' },
  emptyText: { color: '#aaa', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  errorText: { color: '#e74c3c', fontSize: 14 },
});
