import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import IceCard from "../../components/cards/ice_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import IceRoutesQuantityText from "../../components/Routes_and_sectors/Ice_sectors/ice_routes_quantyti_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [ice_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const description = useSiteDescription('ice');

  useEffect(() => {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    api.get(corsUrl(`https://climbing.ge/api/get_article/get_locale_articles/ice/${locale}`))
      .then(({ data }) => {
        setData(data);
        saveOfflineData(OFFLINE_KEYS.ice, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.ice);
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
        data={ice_data}
        keyExtractor={(item) => item.global_data.id.toString()}
        ListHeaderComponent={
          <View>
            <Article_list_header_text
              title={t('list.ice_title')}
              description={description}
            />
            <IceRoutesQuantityText />
          </View>
        }
        renderItem={({ item }) => <IceCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.ice')} />}
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
