import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StyleSheet, View, SectionList, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';
import { useRegions, regionIdsOf } from '../../utils/useRegions';
import { useAllGymHours, useMinuteClock, isOpenNow, ALERT_STATUSES } from '../../utils/gymHours';
import { searchItems } from '../../utils/listSearch';

import IndoorCard from "../../components/cards/indoor_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import FavoritesStrip from "../../components/guide/FavoritesStrip";
import RecentlyViewed from "../../components/guide/RecentlyViewed";
import ListSearchBar from "../../components/ListSearchBar";
import FilterChips from "../../components/FilterChips";
import Segmented from "../../components/ui/Segmented";
import ChoiceChips from "../../components/ui/ChoiceChips";
import { SkeletonList } from "../../components/ui/Skeleton";
import { COLORS, FONTS } from '../../assets/styles/styles';

const OTHER = '__other__';
const SORTS = ['newest', 'name', 'open_now', 'price'];

// The website's IndoorListComponent: search, region (only regions with a
// gym), status (all / open now / hide closed), sort (newest / name / open
// now first / price) and, while all regions are shown, grouping by region.
// Closed and coming-soon gyms sort after working ones.
export default function IndoorGymsList() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const regions = useRegions();
  const weeks = useAllGymHours();
  const now = useMinuteClock();
  const [data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState(null);
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [flat, setFlat] = useState(false);
  const description = useSiteDescription('indoor');

  function load() {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_articles/indoor/${locale}`))
      .then(({ data }) => {
        setData(Array.isArray(data) ? data : []);
        saveOfflineData(OFFLINE_KEYS.indoor, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.indoor);
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

  const gymOf = (item) => ({ ...item.global_data, weekly_hours: weeks[item.global_data.id] || null });

  const regionOptions = useMemo(() => {
    const ids = new Set(data.flatMap(regionIdsOf));
    return [
      { key: null, label: t('filter.all') },
      ...[...ids].filter((id) => regions[id]).map((id) => ({ key: id, label: regions[id] })),
    ];
  }, [data, regions, t]);

  const visible = useMemo(() => {
    let list = data.filter((i) => i?.global_data);
    if (region != null) list = list.filter((i) => regionIdsOf(i).includes(region));
    if (status === 'open_now') list = list.filter((i) => isOpenNow(gymOf(i), now));
    if (status === 'working') list = list.filter((i) => !ALERT_STATUSES.includes(i.global_data.work_status));
    list = searchItems(list, query);
    const closedLast = (i) => (ALERT_STATUSES.includes(i.global_data.work_status) ? 1 : 0);
    if (sort === 'name') {
      list = [...list].sort((a, b) => closedLast(a) - closedLast(b) || (a.locale_data?.title || '').localeCompare(b.locale_data?.title || ''));
    } else if (sort === 'open_now') {
      list = [...list].sort((a, b) => closedLast(a) - closedLast(b) || Number(isOpenNow(gymOf(b), now)) - Number(isOpenNow(gymOf(a), now)));
    } else if (sort === 'price') {
      const price = (i) => (i.global_data.price_status === 'no_info' || i.global_data.price_from == null ? Infinity : Number(i.global_data.price_from));
      list = [...list].sort((a, b) => closedLast(a) - closedLast(b) || price(a) - price(b));
    }
    return list;
  }, [data, region, status, sort, query, weeks, now]);

  const grouped = region == null && !flat && !query.trim() && regionOptions.length > 2;
  const sections = useMemo(() => {
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

  if (isLoading) return <SkeletonList count={3} />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <SectionList
        sections={visible.length ? sections : []}
        keyExtractor={(item) => item.global_data.id.toString()}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              art="holds"
              title={t('list.indoor_title')}
              description={description}
            />
            <FavoritesStrip category="indoor" />
            <RecentlyViewed category="indoor" />
            <ListSearchBar value={query} onChange={setQuery} found={visible.length} placeholder={t('site.guide.list_search.indoor')} />
            {regionOptions.length > 2 && (
              <View style={styles.gap}>
                <FilterChips options={regionOptions} selected={region} onSelect={setRegion} />
              </View>
            )}
            <Segmented
              style={styles.gap}
              options={[
                { key: 'all', label: t('site.guide.article.indoor_filter.status_all') },
                { key: 'open_now', label: t('site.guide.article.indoor_filter.status_open_now') },
                { key: 'working', label: t('gyms.working') },
              ]}
              value={status}
              onChange={setStatus}
            />
            <View style={styles.gap}>
              <ChoiceChips
                scroll
                options={SORTS.map((s) => ({ key: s, label: t(`site.guide.article.indoor_filter.sort_${s}`) }))}
                value={sort}
                onChange={setSort}
              />
            </View>
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
        renderSectionHeader={({ section }) => (section.title ? <Text style={styles.sectionTitle}>{section.title}</Text> : null)}
        renderItem={({ item }) => <IndoorCard cardData={item} week={weeks[item.global_data.id]} now={now} />}
        ListEmptyComponent={<EmptyState message={t('empty.indoor')} />}
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
