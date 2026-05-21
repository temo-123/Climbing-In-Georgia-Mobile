import { StyleSheet, View, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import OutdoorCard from "../../components/cards/outdoor_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import RoutesQuantityText from "../../components/Routes_and_sectors/Sport_sector/roures_quantyti_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

export default function App() {
  const [outdoor_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('outdoor');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/outdoor/en'))
      .then(({ data }) => {
        setData(data);
        saveOfflineData(OFFLINE_KEYS.outdoor, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.outdoor);
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
        data={outdoor_data}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              title="Outdoor Climbing In Georgia"
              description={description}
            />
            <RoutesQuantityText />
          </View>
        }
        renderItem={({ item }) => <OutdoorCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={"No outdoor spots found.\nCheck back soon!"} />}
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
