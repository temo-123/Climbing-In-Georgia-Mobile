import React, { useState, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { useNetwork } from '../../utils/NetworkContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';
import { eventStatus, toDate, monthYear } from '../../utils/eventDates';
import { useInterested } from '../../utils/interested';
import { searchItems } from '../../utils/listSearch';

import EventCard from "../../components/cards/event_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import FilterChips from "../../components/FilterChips";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import ListSearchBar from "../../components/ListSearchBar";
import Segmented from "../../components/ui/Segmented";

// get_event_on_site_list returns every published event, past ones too (the
// website files them under "Past"). The app lists only events that haven't
// finished yet — happening now first, then by start date — and derives a
// month filter client-side from those.
function monthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key, locale) {
  const [y, m] = key.split('-').map(Number);
  return monthYear(new Date(y, m - 1, 1), locale);
}

function upcomingOnly(list) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item?.global_event && eventStatus(item.global_event).key !== 'finished')
    .sort((a, b) => (toDate(a.global_event.start_data) || 0) - (toDate(b.global_event.start_data) || 0));
}

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { isOffline: deviceOffline } = useNetwork();
  const [event_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const description = useSiteDescription('events');
  const { loggedIn, isInterested } = useInterested();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [mine, setMine] = useState(false);

  function load() {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    setSelectedMonth(null);
    api.get(corsUrl(`${API_BASE_URL}/get_event/get_event_on_site_list/${locale}`))
      .then(({ data }) => {
        setData(data);
        saveOfflineData(OFFLINE_KEYS.events, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.events);
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

  const upcoming = useMemo(() => upcomingOnly(event_data), [event_data]);

  const monthOptions = useMemo(() => {
    const seen = new Map();
    for (const item of upcoming) {
      const key = monthKey(item.global_event?.start_data);
      if (key && !seen.has(key)) seen.set(key, monthLabel(key, locale));
    }
    const sortedKeys = [...seen.keys()].sort();
    return [
      { key: null, label: t('filter.all') },
      ...sortedKeys.map((key) => ({ key, label: seen.get(key) })),
    ];
  }, [upcoming, locale, t]);

  let visibleEvents = selectedMonth == null
    ? upcoming
    : upcoming.filter((item) => monthKey(item.global_event?.start_data) === selectedMonth);
  if (cat !== 'all') visibleEvents = visibleEvents.filter((i) => (cat === 'competition') === (i.global_event.category === 'competition'));
  if (mine) visibleEvents = visibleEvents.filter((i) => isInterested(i.global_event.id));
  visibleEvents = searchItems(visibleEvents, query);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <FlatList
        data={visibleEvents}
        keyExtractor={(item) => item.global_event.id.toString()}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              art="trophy"
              title={t('list.events_title')}
              description={description}
            />
            {upcoming.length > 0 && (
              <>
                <ListSearchBar value={query} onChange={setQuery} found={visibleEvents.length} placeholder={t('site.guide.events.search')} />
                <Segmented
                  style={styles.gap}
                  options={[
                    { key: 'all', label: t('site.guide.events.cat_all') },
                    { key: 'competition', label: t('site.guide.events.cat_competition') },
                    { key: 'event', label: t('site.guide.events.cat_event') },
                  ]}
                  value={cat}
                  onChange={setCat}
                />
                {loggedIn && (
                  <Segmented
                    style={styles.gap}
                    options={[{ key: false, label: t('site.guide.events.all_events') }, { key: true, label: t('site.guide.events.only_mine') }]}
                    value={mine}
                    onChange={setMine}
                  />
                )}
              </>
            )}
            {monthOptions.length > 2 && (
              <FilterChips options={monthOptions} selected={selectedMonth} onSelect={setSelectedMonth} />
            )}
          </View>
        }
        renderItem={({ item }) => <EventCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.events')} />}
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
});
