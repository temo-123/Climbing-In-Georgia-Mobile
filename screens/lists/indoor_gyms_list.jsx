import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import IndoorCard from "../../components/cards/indoor_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

export default function App() {
  const [indoor_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('indoor');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/indoor/en'))
      .then(({ data }) => {
        setData(data);
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
  }, []);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <View style={styles.wrapper}>
      {isOffline && <OfflineBanner />}
      <FlatList
        data={indoor_data}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <Article_list_header_text
            title="Indoor Climbing In Georgia"
            description={description}
          />
        }
        renderItem={({ item }) => <IndoorCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={"No indoor gyms found.\nCheck back soon!"} />}
        ListFooterComponent={<PageFooter />}
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
