import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import api, { corsUrl } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";

import ArticleBlock from "../../components/article/articl_block";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";

const IMG_BASE = "https://climbing.ge/public/images/event_img/";

export default function App({ route }) {
  const [globalEventData, setGlobalEventData] = useState({});
  const [localeEventData, setLocaleEventData] = useState({});
  const [globalEventInfoData, setGlobalEventInfoData] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);

  const eventKey = route.params?.toString();

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_event/get_event_on_site_page/en/" + eventKey))
      .then(({ data }) => {
        setGlobalEventData(data);
        setLocaleEventData(data.locale_data || {});
        setGlobalEventInfoData(data.general_info || {});
        saveArticleData('event', eventKey, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadArticleData('event', eventKey);
        if (cached) {
          setGlobalEventData(cached);
          setLocaleEventData(cached.locale_data || {});
          setGlobalEventInfoData(cached.general_info || {});
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }, []);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeEventData}
        global_data={globalEventData.global_data || {}}
        global_info_data={globalEventInfoData}
        imgBase={IMG_BASE}
      />

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
