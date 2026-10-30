import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, SectionList, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';
import { useRegions, regionIdsOf } from '../../utils/useRegions';
import { searchItems } from '../../utils/listSearch';
import { COLORS, FONTS } from '../../assets/styles/styles';

import IceCard from "../../components/cards/ice_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import IceRoutesQuantityText from "../../components/Routes_and_sectors/Ice_sectors/ice_routes_quantyti_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import FavoritesStrip from "../../components/guide/FavoritesStrip";
import RecentlyViewed from "../../components/guide/RecentlyViewed";
import ListSearchBar from "../../components/ListSearchBar";
import FilterChips from "../../components/FilterChips";
import Segmented from "../../components/ui/Segmented";

const OTHER = '__other__';

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const [ice_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('ice');
  const regions = useRegions();
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState(null);
  const [flat, setFlat] = useState(false);

  // The website's IceListComponent: region filter (regions with a spot
  // only), search, and while all regions are shown a By region / Flat toggle.
  const regionOptions = useMemo(() => {
    const ids = new Set((ice_data || []).flatMap(regionIdsOf));
    return [{ key: null, label: t('filter.all') }, ...[...ids].filter((id) => regions[id]).map((id) => ({ key: id, label: regions[id] }))];
  }, [ice_data, regions, t]);

  const visible = useMemo(() => {
    let list = (ice_data || []).filter((i) => i?.global_data);
    if (region != null) list = list.filter((i) => regionIdsOf(i).includes(region));
    return searchItems(list, query);
  }, [ice_data, region, query]);

  const grouped = region == null && !flat && !query.trim() && regionOptions.length > 2;
  const sections = useMemo(() => {
    if (!visible.length) return [];
    if (!grouped) return [{ key: 'all', title: null, data: visible }];
    const by = new Map();
    visible.forEach((i) => {
      const id = regionIdsOf(i).find((r) => regions[r]) ?? OTHER;
      if (!by.has(id)) by.set(id, []);
      by.get(id).push(i);
    });
    return [...by.entries()]
      .sort(([a], [b]) => (a === OTHER) - (b === OTHER))
      .map(([id, items]) => ({ key: String(id), title: id === OTHER ? t('site.guide.article.indoor_filter.other_region') : regions[id], data: items }));
  }, [grouped, visible, regions, t]);

  function load() {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_articles/ice/${locale}`))
      .then(({ data }) => {
        setData(data);
        saveOfflineData(OFFLINE_KEYS.ice, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.ice);
        if (cached && cached.length > 0) {
          setData(cached);
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

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null)}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              art="iceaxe"
              title={t('list.ice_title')}
              description={description}
            />
            <FavoritesStrip category="ice" />
            <RecentlyViewed category="ice" />
            <IceRoutesQuantityText />
            <ListSearchBar value={query} onChange={setQuery} found={visible.length} placeholder={t('site.guide.list_search.ice')} />
            {regionOptions.length > 2 && (
              <View style={styles.gap}>
                <FilterChips options={regionOptions} selected={region} onSelect={setRegion} />
              </View>
            )}
            {region == null && !query.trim() && regionOptions.length > 2 && (
              <Segmented
                style={styles.gap}
                options={[{ key: false, label: t('site.guide.group.by_region') }, { key: true, label: t('site.guide.group.flat') }]}
                value={flat}
                onChange={setFlat}
              />
            )}
          </View>
        }
        renderItem={({ item }) => <IceCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.ice')} />}
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
  gap: { marginBottom: 12 },
  sectionTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    color: COLORS.ink,
    marginTop: 6,
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.hold,
  },
});
