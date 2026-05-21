import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import EventCard from "../../components/cards/event_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [event_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('events');

  useEffect(() => {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    api.get(corsUrl(`https://climbing.ge/api/get_event/get_event_on_site_list/${locale}`))
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

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <FlatList
        data={event_data}
        keyExtractor={(item) => item.global_event.id.toString()}
        ListHeaderComponent={
          <Article_list_header_text
            title={t('list.events_title')}
            description={description}
          />
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
