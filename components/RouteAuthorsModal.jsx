import React, { useState, useEffect, useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../utils/api';
import { COLORS } from '../assets/styles/styles';

const SORT_FIELDS = ['total', 'name', 'sport', 'boulder', 'dry', 'ice'];
const API = `${API_BASE_URL}/get_route/routes_authers_by_categories/`;

// Module-level cache — this list rarely changes and is used from two
// screens (About Us and the Outdoor list), no need to refetch every open.
let _cache = null;
let _promise = null;

function fetchAuthors() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    // The site's own frontend calls this as a POST with an explicit
    // route_categories body (confirmed by capturing its real request) — a
    // GET here silently 200s with the SPA's HTML shell instead of JSON
    // (this route has no GET handler, so it falls through to the
    // catch-all), which is why authors previously rendered as "0", "1",
    // "2"... (Object.entries() on the HTML string itself). Without
    // route_categories the endpoint still responds, but with a different,
    // totals-only shape instead of the per-category breakdown used below.
    _promise = api.post(corsUrl(API), { route_categories: ['sport', 'boulder', 'dry', 'ice'] })
      .then(({ data }) => {
        const list = Object.entries(data || {}).map(([name, counts]) => {
          const sport = counts?.sport || 0;
          const boulder = counts?.boulder || 0;
          const dry = counts?.dry || 0;
          const ice = counts?.ice || 0;
          return { name, sport, boulder, dry, ice, total: sport + boulder + dry + ice };
        });
        _cache = list;
        return list;
      })
      .catch(() => {
        _promise = null; // allow retry on next open after a failure
        return [];
      });
  }
  return _promise;
}

function AuthorRow({ item, rank, t }) {
  const parts = [];
  if (item.sport) parts.push(`${t('about.sport_climbing')} ${item.sport}`);
  if (item.boulder) parts.push(`${t('about.bouldering')} ${item.boulder}`);
  if (item.dry) parts.push(`${t('about.dry_tooling')} ${item.dry}`);
  if (item.ice) parts.push(`${t('about.ice_climbing')} ${item.ice}`);

  return (
    <View style={styles.row}>
      <Text style={styles.rank}>{rank}</Text>
      <View style={styles.rowMain}>
        <Text style={styles.authorName} numberOfLines={1}>{item.name}</Text>
        {!!parts.length && <Text style={styles.breakdown} numberOfLines={1}>{parts.join(' · ')}</Text>}
      </View>
      <View style={styles.totalBadge}>
        <Text style={styles.totalBadgeText}>{item.total}</Text>
      </View>
    </View>
  );
}

export default function RouteAuthorsModal({ visible, onClose }) {
  const { t } = useTranslation();
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState('total');
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    fetchAuthors().then(list => { setAuthors(list); setLoading(false); });
  }, [visible]);

  const sorted = useMemo(() => {
    const list = [...authors];
    list.sort((a, b) => {
      const av = a[sortField];
      const bv = b[sortField];
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortDesc ? -cmp : cmp;
    });
    return list;
  }, [authors, sortField, sortDesc]);

  function handleSortPress(field) {
    if (field === sortField) {
      setSortDesc(d => !d);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('about.route_authors_title')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sortRow}>
            {SORT_FIELDS.map(field => (
              <TouchableOpacity
                key={field}
                style={[styles.sortChip, sortField === field && styles.sortChipActive]}
                onPress={() => handleSortPress(field)}
                activeOpacity={0.7}
              >
                <Text style={[styles.sortChipText, sortField === field && styles.sortChipTextActive]}>
                  {t(`about.sort_${field}`)}{sortField === field ? (sortDesc ? ' ↓' : ' ↑') : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : sorted.length === 0 ? (
            <Text style={styles.emptyText}>{t('about.no_authors')}</Text>
          ) : (
            <FlatList
              data={sorted}
              keyExtractor={(item) => item.name}
              renderItem={({ item, index }) => <AuthorRow item={item} rank={index + 1} t={t} />}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}

          <TouchableOpacity style={styles.closeCard} onPress={onClose} activeOpacity={0.85}>
            <Text style={styles.closeCardText}>{t('summit.done')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: '800', color: '#222' },
  closeBtn: { fontSize: 20, color: '#999', fontWeight: '700' },
  sortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  sortChip: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sortChipActive: { backgroundColor: COLORS.primary },
  sortChipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  sortChipTextActive: { color: '#fff' },
  loader: { marginVertical: 24 },
  emptyText: { color: '#999', textAlign: 'center', marginVertical: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  rank: { width: 26, fontSize: 12, color: '#aaa', fontWeight: '700' },
  rowMain: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#222' },
  breakdown: { fontSize: 11, color: '#888', marginTop: 2 },
  totalBadge: {
    backgroundColor: '#e8f6fa',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 36,
    alignItems: 'center',
  },
  totalBadgeText: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  separator: { height: 1, backgroundColor: '#f0f0f0' },
  closeCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 16,
  },
  closeCardText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
