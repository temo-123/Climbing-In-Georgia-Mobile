import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import EventCard from "../../components/cards/event_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";

export default function App() {
  const [event_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('events');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_event/get_event_on_site_list/en'))
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
  }, []);

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
            title="Events & Competitions"
            description={description}
          />
        }
        renderItem={({ item }) => <EventCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={"No events at the moment.\nCheck back soon!"} />}
        contentContainerStyle={styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    padding: 16,
  },
});
