import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect } from "react";
import { useLocale } from '../../utils/LocaleContext';

import ArticleBlock from "../../components/article/articl_block";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

import api, { corsUrl } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";

const IMG_BASE = "https://climbing.ge/public/images/other_img/";

export default function App({ route }) {
  const { locale } = useLocale();
  const [globalOtherData, setGlobalOtherData] = useState({});
  const [localeOtherData, setLocaleOtherData] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(corsUrl(`https://climbing.ge/api/get_article/get_locale_article_on_page/other/${locale}/` + route.params))
      .then(({ data }) => {
        setGlobalOtherData(data);
        setLocaleOtherData(data.locale_data || {});
        saveArticleData('other', route.params, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadArticleData('other', route.params);
        if (cached) {
          setGlobalOtherData(cached);
          setLocaleOtherData(cached.locale_data || {});
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }, [locale]);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeOtherData}
        global_data={globalOtherData.global_data || {}}
        imgBase={IMG_BASE}
      />
      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
