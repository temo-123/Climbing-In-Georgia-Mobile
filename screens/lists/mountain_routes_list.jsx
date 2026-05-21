import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import MountCard from "../../components/cards/mount_route_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";

export default function App() {
  const [mount_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('mount_route');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/mount_route/en'))
      .then(({ data }) => {
        setData(data);
        saveOfflineData(OFFLINE_KEYS.mount_route, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.mount_route);
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
        data={mount_data}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <Article_list_header_text
            title="Mountain Climbing In Georgia"
            description={description}
          />
        }
        renderItem={({ item }) => <MountCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={"No mountain routes found.\nCheck back soon!"} />}
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
