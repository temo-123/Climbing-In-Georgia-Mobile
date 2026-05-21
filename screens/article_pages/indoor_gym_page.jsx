import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";

import ArticleBlock from "../../components/article/articl_block";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

import api, { corsUrl } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";

const IMG_BASE = "https://climbing.ge/public/images/indoor_img/";

export default function App({ route }) {
  const [globalIndoorData, setGlobalIndoorData] = useState({});
  const [localeIndoorData, setLocaleIndoorData] = useState({});
  const [globalIndoorInfoData, setGlobalIndoorInfoData] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/indoor/en/" + route.params))
      .then(({ data }) => {
        setGlobalIndoorData(data);
        setLocaleIndoorData(data.locale_data || {});
        setGlobalIndoorInfoData(data.general_info || {});
        saveArticleData('indoor', route.params, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadArticleData('indoor', route.params);
        if (cached) {
          setGlobalIndoorData(cached);
          setLocaleIndoorData(cached.locale_data || {});
          setGlobalIndoorInfoData(cached.general_info || {});
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
        local_data={localeIndoorData}
        global_data={globalIndoorData.global_data || {}}
        global_info_data={globalIndoorInfoData}
        imgBase={IMG_BASE}
      />

      <PageFooter />
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
