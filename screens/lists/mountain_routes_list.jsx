import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadMountRoutesByMassifData, saveMountRoutesByMassifData } from '../../utils/offlineStorage';

import MountCard from "../../components/cards/mount_route_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import FilterChips from "../../components/FilterChips";
import SortToggle from "../../components/SortToggle";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import FavoritesStrip from "../../components/guide/FavoritesStrip";
import RecentlyViewed from "../../components/guide/RecentlyViewed";
import ListSearchBar from "../../components/ListSearchBar";
import { searchItems } from "../../utils/listSearch";

const OTHER_MASSIF_KEY = '__other__';

// route.params.massifId (from a route page's massif card) preselects that
// massif's filter chip.
export default function App({ route }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const [byMassif, setByMassif] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [selectedMassif, setSelectedMassif] = useState(route?.params?.massifId ?? null);
  const massifParam = route?.params?.massifId;
  const massifParamAt = route?.params?.at;
  useEffect(() => {
    if (massifParam != null) setSelectedMassif(massifParam);
  }, [massifParam, massifParamAt]);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [query, setQuery] = useState('');
  const description = useSiteDescription('mount_route');

  function load() {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    setSelectedMassif(null);
    api.get(corsUrl(`${API_BASE_URL}/get_mount_route/get_mount_routes_by_maunt/${locale}`))
      .then(({ data }) => {
        setByMassif(Array.isArray(data) ? data : []);
        saveMountRoutesByMassifData(locale, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadMountRoutesByMassifData(locale);
        if (Array.isArray(cached) && cached.length > 0) {
          setByMassif(cached);
          setIsOffline(true);
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }

  useEffect(() => { load(); }, [locale]);

  // Refetch the moment the device reconnects, so a stale "showing cached
  // data" banner doesn't linger after connectivity actually comes back.
  const wasDeviceOffline = useRef(deviceOffline);
  useEffect(() => {
    if (wasDeviceOffline.current && !deviceOffline) load();
    wasDeviceOffline.current = deviceOffline;
  }, [deviceOffline]);

  const allRoutes = useMemo(() => {
    const items = [];
    for (const group of byMassif) {
      const massifKey = group.mount?.global_data?.id ?? OTHER_MASSIF_KEY;
      for (const route of (group.mount_route || [])) {
        items.push({ ...route, _massifKey: massifKey });
      }
    }
    return items;
  }, [byMassif]);

  const massifOptions = useMemo(() => {
    const options = [{ key: null, label: t('filter.all') }];
    for (const group of byMassif) {
      if (!group.mount_route || group.mount_route.length === 0) continue;
      options.push({
        key: group.mount?.global_data?.id ?? OTHER_MASSIF_KEY,
        label: group.mount ? (group.mount.locale_data?.title ?? '—') : t('filter.other_massif'),
      });
    }
    return options;
  }, [byMassif, t]);

  const visibleRoutes = useMemo(() => {
    let list = selectedMassif == null
      ? allRoutes
      : allRoutes.filter((item) => item._massifKey === selectedMassif);
    if (sortAlpha) {
      list = [...list].sort((a, b) =>
        (a.locale_data?.title || '').localeCompare(b.locale_data?.title || ''));
    }
    return searchItems(list, query);
  }, [allRoutes, selectedMassif, sortAlpha, query]);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <FlatList
        data={visibleRoutes}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              art="mountains"
              title={t('list.mountain_title')}
              description={description}
            />
            <FavoritesStrip category="mount_route" />
            <RecentlyViewed category="mount_route" />
            <ListSearchBar value={query} onChange={setQuery} found={visibleRoutes.length} placeholder={t('site.guide.list_search.mountaineering')} />
            <FilterChips options={massifOptions} selected={selectedMassif} onSelect={setSelectedMassif} />
            <SortToggle
              active={sortAlpha}
              onToggle={() => setSortAlpha((v) => !v)}
              label={sortAlpha ? t('filter.sort_az') : t('filter.sort_default')}
            />
          </View>
        }
        renderItem={({ item }) => <MountCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.mountain')} />}
        ListFooterComponent={<PageFooter />}
        ListFooterComponentStyle={styles.footer}
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 16, flexGrow: 1 },
  footer: { flexGrow: 1, justifyContent: 'flex-end' },
});
