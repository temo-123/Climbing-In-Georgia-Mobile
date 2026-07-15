import { StyleSheet, View, FlatList, TouchableOpacity, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';
import { useLocale } from '../../utils/LocaleContext';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from '../../utils/offlineStorage';

import OutdoorCard from "../../components/cards/outdoor_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import RoutesQuantityText from "../../components/Routes_and_sectors/Sport_sector/roures_quantyti_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";
import OfflineBanner from "../../components/OfflineBanner";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import RouteAuthorsModal from "../../components/RouteAuthorsModal";

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [outdoor_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [noCache, setNoCache] = useState(false);
  const [authorsVisible, setAuthorsVisible] = useState(false);
  const description = useSiteDescription('outdoor');

  useEffect(() => {
    setLoading(true);
    setIsOffline(false);
    setNoCache(false);
    api.get(corsUrl(`https://climbing.ge/api/get_article/get_locale_articles/outdoor/${locale}`))
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
  }, [locale]);

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
              title={t('list.outdoor_title')}
              description={description}
            />
            <RoutesQuantityText />
            <TouchableOpacity style={styles.authorsBtn} onPress={() => setAuthorsVisible(true)} activeOpacity={0.85}>
              <Text style={styles.authorsBtnText}>{t('about.check_route_authors')}</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => <OutdoorCard cardData={item} />}
        ListEmptyComponent={<EmptyState message={t('empty.outdoor')} />}
        ListFooterComponent={<PageFooter />}
        contentContainerStyle={styles.container}
      />
      <RouteAuthorsModal visible={authorsVisible} onClose={() => setAuthorsVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 16 },
  authorsBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 12,
  },
  authorsBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
