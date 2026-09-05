import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import api, { API_BASE_URL } from '../../utils/api';
import { useNetwork } from '../../utils/NetworkContext';
import { saveOfflineData, loadOfflineData } from '../../utils/offlineStorage';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import ClimberCard from '../../components/user/ClimberCard';
import ClimberProfileModal from '../../components/user/ClimberProfileModal';
import { COLORS } from '../../assets/styles/styles';

const API = API_BASE_URL;
const CACHE_KEY = '@climbers_list_cache';
const SEARCH_DEBOUNCE_MS = 350;

export default function ClimbersListScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isOffline: deviceOffline } = useNetwork();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const debounceRef = useRef(null);

  const fetchPage = useCallback((targetPage, { append } = {}) => {
    const setLoadingFlag = append ? setLoadingMore : setLoading;
    setLoadingFlag(true);
    api.get(`${API}/get_climber_profile/list`, { params: { page: targetPage, search, sort } })
      .then(res => {
        const payload = res.data;
        const rows = Array.isArray(payload) ? payload : payload?.data ?? [];
        setData(prev => (append ? [...prev, ...rows] : rows));
        setLastPage(payload?.last_page ?? 1);
        setPage(targetPage);
        setIsOffline(false);
        if (!append && search === '' && sort === 'name') {
          saveOfflineData(CACHE_KEY, rows);
        }
      })
      .catch(async () => {
        if (append) return;
        const cached = await loadOfflineData(CACHE_KEY);
        if (Array.isArray(cached) && cached.length > 0) {
          setData(cached);
          setLastPage(1);
          setIsOffline(true);
        } else {
          setNoCache(true);
        }
      })
      .finally(() => setLoadingFlag(false));
  }, [search, sort]);

  useEffect(() => {
    setNoCache(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPage(1), search === '' ? 0 : SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort]);

  // Refetch the moment the device reconnects, so a stale "showing cached
  // data" banner doesn't linger after connectivity actually comes back.
  const wasDeviceOffline = useRef(deviceOffline);
  useEffect(() => {
    if (wasDeviceOffline.current && !deviceOffline) fetchPage(1);
    wasDeviceOffline.current = deviceOffline;
  }, [deviceOffline, fetchPage]);

  function loadMore() {
    if (loadingMore || loading || page >= lastPage) return;
    fetchPage(page + 1, { append: true });
  }

  if (noCache) return <OfflineError />;

  return (
    <View style={styles.container}>
      {isOffline ? <OfflineBanner /> : null}

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('user.search_climbers')}
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.sortRow}>
        <TouchableOpacity
          style={[styles.sortBtn, sort === 'name' && styles.sortBtnActive]}
          onPress={() => setSort('name')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortBtnText, sort === 'name' && styles.sortBtnTextActive]}>{t('user.sort_az')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortBtn, sort === 'top_active' && styles.sortBtnActive]}
          onPress={() => setSort('top_active')}
          activeOpacity={0.8}
        >
          <Text style={[styles.sortBtnText, sort === 'top_active' && styles.sortBtnTextActive]}>🏆 {t('user.sort_top_active')}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : data.length === 0 ? (
        <View style={styles.center}><Text style={styles.emptyText}>{t('user.no_climbers')}</Text></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => String(item.id ?? i)}
          numColumns={2}
          renderItem={({ item }) => (
            <ClimberCard item={item} onPress={() => setSelectedUserId(item.id)} />
          )}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={loadMore}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footerLoader} color={COLORS.primary} /> : null}
        />
      )}

      <ClimberProfileModal
        visible={selectedUserId != null}
        userId={selectedUserId}
        onClose={() => setSelectedUserId(null)}
        onViewFullProfile={(id) => {
          setSelectedUserId(null);
          navigation.navigate('climber_profile', { userId: id });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  searchRow: { paddingHorizontal: 16, paddingTop: 14 },
  searchInput: {
    backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 14, color: '#222', borderWidth: 1, borderColor: '#e4e4e4',
  },
  sortRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  sortBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: '#e4e4e4' },
  sortBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sortBtnText: { fontSize: 12, fontWeight: '700', color: '#555' },
  sortBtnTextActive: { color: '#fff' },
  list: { paddingHorizontal: 10, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: '#888', fontSize: 15 },
  footerLoader: { marginVertical: 16 },
});
