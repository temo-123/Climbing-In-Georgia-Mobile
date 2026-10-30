import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import api, { API_BASE_URL, imgUri } from '../../utils/api';
import { useNetwork } from '../../utils/NetworkContext';
import { useLocale } from '../../utils/LocaleContext';
import { useFavorites } from '../../utils/favorites';
import { saveOfflineData, loadOfflineData } from '../../utils/offlineStorage';
import { articleImageBase, openArticle } from '../../utils/articleRoutes';
import OfflineBanner from '../../components/OfflineBanner';
import OfflineError from '../../components/OfflineError';
import EmptyState from '../../components/EmptyState';
import PageHead from '../../components/ui/PageHead';
import Segmented from '../../components/ui/Segmented';
import FilterChips from '../../components/FilterChips';
import { SkeletonList } from '../../components/ui/Skeleton';
import ArticleCardShell from '../../components/cards/ArticleCardShell';
import EventCard from '../../components/cards/event_card_component';
import FavoriteHeart from '../../components/guide/FavoriteHeart';
import { COLORS } from '../../assets/styles/styles';

const CACHE_KEY = '@my_favorites_cache_v2';
const CATEGORIES = ['outdoor', 'ice', 'indoor', 'mount_route', 'other'];

// The website's /my_favorite_outdoor_area ("Favorite articles", every guide
// type with category filters) + /interested_events.
export default function UserFavoritesScreen({ route }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const { ids, loaded: idsLoaded } = useFavorites();
  const [tab, setTab] = useState(route?.params?.tab === 'events' ? 'events' : 'areas');
  const [category, setCategory] = useState(null);
  const [articles, setArticles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);

  function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    setIsOffline(false);
    Promise.all([
      api.get(`${API_BASE_URL}/get_faworite/get_favorite_articles`, { params: { lang: locale === 'ka' ? 'ka' : 'us' } }),
      api.get(`${API_BASE_URL}/get_faworite/get_interested_events`),
    ]).then(([a, e]) => {
      const art = Array.isArray(a.data) ? a.data : [];
      const ev = Array.isArray(e.data) ? e.data : [];
      setArticles(art);
      setEvents(ev);
      saveOfflineData(CACHE_KEY, { articles: art, events: ev });
    }).catch(async () => {
      const cached = await loadOfflineData(CACHE_KEY);
      if (cached) {
        setArticles(cached.articles ?? []);
        setEvents(cached.events ?? []);
        setIsOffline(true);
      } else {
        setNoCache(true);
      }
    }).finally(() => { setLoading(false); setRefreshing(false); });
  }

  useEffect(() => { load(); }, [locale]);

  const wasDeviceOffline = useRef(deviceOffline);
  useEffect(() => {
    if (wasDeviceOffline.current && !deviceOffline) load();
    wasDeviceOffline.current = deviceOffline;
  }, [deviceOffline]);

  // Hearts toggled elsewhere (or Undo) update the shared id set; hide removed
  // items right away without a refetch.
  const visibleArticles = useMemo(() => articles
    .filter((a) => a?.global_data && (!idsLoaded || ids.has(Number(a.global_data.id))))
    .filter((a) => !category || a.global_data.category === category), [articles, ids, idsLoaded, category]);

  const categoryOptions = useMemo(() => {
    const present = new Set(articles.map((a) => a?.global_data?.category));
    return [
      { key: null, label: t('filter.all') },
      ...CATEGORIES.filter((c) => present.has(c)).map((c) => ({ key: c, label: t(`favorites_cat.${c}`) })),
    ];
  }, [articles, t]);

  const eventItems = useMemo(() => events.map((ev) => ({
    global_event: ev,
    locale_event: (locale === 'ka' ? ev.ka_event : ev.us_event) || ev.us_event || ev.ka_event || {},
  })), [events, locale]);

  if (noCache) return <OfflineError />;
  if (loading) return <SkeletonList count={3} />;

  const header = (
    <View>
      <PageHead art="carabiners" title={t('site.guide.favorite.my_favorites')} />
      <Segmented
        options={[{ key: 'areas', label: t('user.favorite_areas') }, { key: 'events', label: t('user.interested_events') }]}
        value={tab}
        onChange={setTab}
        style={styles.tabs}
      />
      {tab === 'areas' && categoryOptions.length > 2 && (
        <View style={styles.filters}>
          <FilterChips options={categoryOptions} selected={category} onSelect={setCategory} />
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {isOffline && <OfflineBanner />}
      {tab === 'areas' ? (
        <FlatList
          data={visibleArticles}
          keyExtractor={(a) => String(a.global_data.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState message={t('user.no_favorite_areas')} />}
          renderItem={({ item }) => {
            const gd = item.global_data;
            return (
              <ArticleCardShell
                imageUri={imgUri(articleImageBase(gd.category), gd.image, gd.updated_at)}
                title={item.locale_data?.title}
                text={item.locale_data?.short_description}
                chips={[{ label: t(`favorites_cat.${gd.category}`, { defaultValue: gd.category }), tone: 'accent' }]}
                topRight={<FavoriteHeart articleId={gd.id} size="sm" />}
                onPress={() => openArticle(navigation, gd.category, gd.url_title)}
              />
            );
          }}
        />
      ) : (
        <FlatList
          data={eventItems}
          keyExtractor={(e) => String(e.global_event.id)}
          ListHeaderComponent={header}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
          ListEmptyComponent={<EmptyState message={t('user.no_interested_events')} />}
          renderItem={({ item }) => <EventCard cardData={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.chalk },
  list: { padding: 16, paddingBottom: 120 },
  tabs: { marginBottom: 12 },
  filters: { marginBottom: 12 },
});
