import { StyleSheet, View, SectionList } from 'react-native';
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
import RegionGroupControls, { RegionSectionHeader } from "../../components/RegionGroupControls";
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
import { useRegions } from "../../utils/useRegions";
import { regionOptionsFor, filterByRegion, regionSections } from "../../utils/regionSections";

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
  const [flat, setFlat] = useState(false);
  const siteRegions = useRegions();
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

  // Every spot, tagged with its region id (null = the API's "other" bucket).
  // Outdoor list articles don't carry outdoor_region, so the grouping comes
  // from get_spots_by_regions itself. Same region UI as the ice and indoor
  // lists (utils/regionSections.js).
  const allSpots = useMemo(() => {
    const items = [];
    for (const group of byRegion) {
      const isOther = !group.region || group.region.name === 'other';
      const regionKey = isOther ? null : group.region.id;
      for (const spot of (group.spots || [])) {
        if (spot?.area) items.push({ ...spot.area, _regionKey: regionKey });
      }
    }
    return items;
  }, [byRegion]);

  // Names from the grouped answer, overridden by get_local_regions (which
  // also gives the canonical order) once it has loaded.
  const regions = useMemo(() => {
    const fromGroups = {};
    for (const group of byRegion) {
      if (group.region && group.region.name !== 'other') fromGroups[group.region.id] = group.region.name;
    }
    return { ...fromGroups, ...siteRegions };
  }, [byRegion, siteRegions]);

  const regionOf = (item) => item._regionKey;
  const otherLabel = t('filter.other_region');
  const regionOptions = useMemo(
    () => regionOptionsFor(allSpots, regionOf, regions, t('filter.all'), otherLabel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSpots, regions, t],
  );
  const visibleSpots = useMemo(
    () => searchItems(filterByRegion(allSpots, regionOf, selectedRegion), query),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allSpots, selectedRegion, query],
  );
  const grouped = selectedRegion == null && !flat && !query.trim() && regionOptions.length > 2;
  const sections = useMemo(
    () => regionSections(visibleSpots, regionOf, regions, grouped, otherLabel),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visibleSpots, grouped, regions, otherLabel],
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
            <RegionGroupControls
              options={regionOptions}
              region={selectedRegion}
              onRegion={setSelectedRegion}
              flat={flat}
              onFlat={setFlat}
              searching={!!query.trim()}
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
