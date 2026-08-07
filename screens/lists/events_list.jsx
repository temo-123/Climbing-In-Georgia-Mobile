import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import EventCard from "../../components/cards/event_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import FilterChips from "../../components/FilterChips";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

// The site has no server-side event filter to mirror — events are already
// restricted to current/upcoming and sorted by start date server-side. This
// derives a month filter client-side from whatever's already fetched.
function monthKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr.replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key, locale) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString(locale === 'ka' ? 'ka-GE' : 'en-US', { month: 'long', year: 'numeric' });
}

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [event_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const description = useSiteDescription('events');

  useEffect(() => {
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
  }, [locale]);

  const monthOptions = useMemo(() => {
    const seen = new Map();
    for (const item of event_data) {
      const key = monthKey(item.global_event?.start_data);
      if (key && !seen.has(key)) seen.set(key, monthLabel(key, locale));
    }
    const sortedKeys = [...seen.keys()].sort();
    return [
      { key: null, label: t('filter.all') },
      ...sortedKeys.map((key) => ({ key, label: seen.get(key) })),
    ];
  }, [event_data, locale, t]);

  const visibleEvents = selectedMonth == null
    ? event_data
    : event_data.filter((item) => monthKey(item.global_event?.start_data) === selectedMonth);

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
              title={t('list.events_title')}
              description={description}
            />
            {monthOptions.length > 2 && (
              <FilterChips options={monthOptions} selected={selectedMonth} onSelect={setSelectedMonth} />
            )}
          </View>
        }
        renderItem={({ item }) => <EventCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.events')} />}
        ListFooterComponent={<PageFooter />}
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 16 },
});
