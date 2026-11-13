import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, SectionList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadMountRoutesByMassifData, saveMountRoutesByMassifData } from '../../utils/offlineStorage';

import MountCard from "../../components/cards/mount_route_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import RegionGroupControls, { RegionSectionHeader } from "../../components/RegionGroupControls";
import { regionOptionsFor, filterByRegion, regionSections } from "../../utils/regionSections";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import FavoritesStrip from "../../components/guide/FavoritesStrip";
import RecentlyViewed from "../../components/guide/RecentlyViewed";
import ListSearchBar from "../../components/ListSearchBar";
import { searchItems } from "../../utils/listSearch";

// Same list structure as the outdoor / ice / indoor lists, grouped by
// mountain massif instead of region (utils/regionSections.js): massif chips,
// "By Mountain / Flat" switch, section headers with counts.
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
  const [flat, setFlat] = useState(false);
  const [query, setQuery] = useState('');
  const description = useSiteDescription('mount_route');

  function load() {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
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

  // Every route tagged with its massif id (null = routes without a massif).
  const allRoutes = useMemo(() => {
    const items = [];
    for (const group of byMassif) {
      const massifKey = group.mount?.global_data?.id ?? null;
      for (const route of (group.mount_route || [])) {
        items.push({ ...route, _massifKey: massifKey });
      }
    }
    return items;
  }, [byMassif]);

  // Massif names + the API's order (newest massif first, as on the website).
  const { massifs, massifOrder } = useMemo(() => {
    const names = {};
    const order = [];
    for (const group of byMassif) {
      const id = group.mount?.global_data?.id;
      if (id == null || !(group.mount_route || []).length) continue;
      names[id] = group.mount.locale_data?.title ?? '—';
      order.push(id);
    }
    return { massifs: names, massifOrder: order };
  }, [byMassif]);

  const massifOf = (item) => item._massifKey;
  const otherLabel = t('filter.other_massif');
  const massifOptions = useMemo(
    () => regionOptionsFor(allRoutes, massifOf, massifs, t('filter.all'), otherLabel, massifOrder),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRoutes, massifs, massifOrder, t],
  );
  // A preselected massif that isn't in the list (any more) falls back to All.
  const massifValid = selectedMassif == null || massifOptions.some((o) => o.key === selectedMassif);
  const activeMassif = massifValid ? selectedMassif : null;
  const visibleRoutes = useMemo(
    () => searchItems(filterByRegion(allRoutes, massifOf, activeMassif), query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allRoutes, activeMassif, query],
  );
  const grouped = activeMassif == null && !flat && !query.trim() && massifOptions.length > 2;
  const sections = useMemo(
    () => regionSections(visibleRoutes, massifOf, massifs, grouped, otherLabel, massifOrder),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleRoutes, grouped, massifs, massifOrder, otherLabel],
  );

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <SectionList
        sections={sections}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={RegionSectionHeader}
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
            <RegionGroupControls
              options={massifOptions}
              region={activeMassif}
              onRegion={setSelectedMassif}
              flat={flat}
              onFlat={setFlat}
              searching={!!query.trim()}
              groupLabel={t('site.guide.group.by_mountain')}
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
