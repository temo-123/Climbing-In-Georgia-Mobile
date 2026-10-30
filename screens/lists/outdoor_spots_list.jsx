import { StyleSheet, View, FlatList } from 'react-native';
import { faUserPen } from '@fortawesome/free-solid-svg-icons';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadOutdoorByRegionData, saveOutdoorByRegionData } from '../../utils/offlineStorage';

import OutdoorCard from "../../components/cards/outdoor_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import RoutesQuantityText from "../../components/Routes_and_sectors/Sport_sector/roures_quantyti_text_component";
import FilterChips from "../../components/FilterChips";
import SortToggle from "../../components/SortToggle";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import FavoritesStrip from "../../components/guide/FavoritesStrip";
import RecentlyViewed from "../../components/guide/RecentlyViewed";
import CragPicker from "../../components/guide/CragPicker";
import ListSearchBar from "../../components/ListSearchBar";
import { searchItems } from "../../utils/listSearch";
import RouteAuthorsModal from "../../components/RouteAuthorsModal";
import Button from "../../components/ui/Button";

const OTHER_REGION_KEY = '__other__';

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const [byRegion, setByRegion] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [authorsVisible, setAuthorsVisible] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [sortAlpha, setSortAlpha] = useState(false);
  const [query, setQuery] = useState('');
  const description = useSiteDescription('outdoor');

  function load() {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    setSelectedRegion(null);
    api.get(corsUrl(`${API_BASE_URL}/get_outdoor/get_spots_by_regions/${locale}`))
      .then(({ data }) => {
        setByRegion(Array.isArray(data) ? data : []);
        saveOutdoorByRegionData(locale, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOutdoorByRegionData(locale);
        if (Array.isArray(cached) && cached.length > 0) {
          setByRegion(cached);
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

  // Every spot, tagged with its region key, regardless of grouping — the
  // region filter chips narrow this down; "All" (selectedRegion === null)
  // shows it as-is.
  const allSpots = useMemo(() => {
    const items = [];
    for (const group of byRegion) {
      const regionKey = group.region?.id ?? OTHER_REGION_KEY;
      for (const spot of (group.spots || [])) {
        if (spot?.area) items.push({ ...spot.area, _regionKey: regionKey });
      }
    }
    return items;
  }, [byRegion]);

  const regionOptions = useMemo(() => {
    const options = [{ key: null, label: t('filter.all') }];
    for (const group of byRegion) {
      if (!group.spots || group.spots.length === 0) continue;
      const isOther = group.region?.name === 'other';
      options.push({
        key: group.region?.id ?? OTHER_REGION_KEY,
        label: isOther ? t('filter.other_region') : (group.region?.name ?? '—'),
      });
    }
    return options;
  }, [byRegion, t]);

  const visibleSpots = useMemo(() => {
    let list = selectedRegion == null
      ? allSpots
      : allSpots.filter((item) => item._regionKey === selectedRegion);
    if (sortAlpha) {
      list = [...list].sort((a, b) =>
        (a.locale_data?.title || '').localeCompare(b.locale_data?.title || ''));
    }
    return searchItems(list, query);
  }, [allSpots, selectedRegion, sortAlpha, query]);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <FlatList
        data={visibleSpots}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              art="quickdraw"
              title={t('list.outdoor_title')}
              description={description}
            />
            <FavoritesStrip category="outdoor" />
            <RecentlyViewed category="outdoor" />
            <CragPicker areas={allSpots} />
            <RoutesQuantityText />
            <Button
              variant="outline"
              icon={faUserPen}
              title={t('about.check_route_authors')}
              onPress={() => setAuthorsVisible(true)}
              style={styles.authorsBtn}
            />
            <ListSearchBar value={query} onChange={setQuery} found={visibleSpots.length} placeholder={t('site.guide.list_search.outdoor')} />
            <FilterChips options={regionOptions} selected={selectedRegion} onSelect={setSelectedRegion} />
            <SortToggle
              active={sortAlpha}
              onToggle={() => setSortAlpha((v) => !v)}
              label={sortAlpha ? t('filter.sort_az') : t('filter.sort_default')}
            />
          </View>
        }
        renderItem={({ item }) => <OutdoorCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.outdoor')} />}
        ListFooterComponent={<PageFooter />}
        ListFooterComponentStyle={styles.footer}
        contentContainerStyle={styles.container}
      />
      <RouteAuthorsModal visible={authorsVisible} onClose={() => setAuthorsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 16, flexGrow: 1 },
  footer: { flexGrow: 1, justifyContent: 'flex-end' },
  authorsBtn: { marginBottom: 14 },
});
