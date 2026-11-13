import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useLocale } from '../../utils/LocaleContext';

import ArticleBlock from "../../components/article/articl_block";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import NotFoundMoved from "../../components/NotFoundMoved";
import { useRenamableSlug } from "../../utils/renamedSlug";
import PageFooter from "../../components/PageFooter";
import ArticleComments from "../../components/guide/ArticleComments";

import api, { corsUrl, API_BASE_URL, IMG_BASES } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";
import { useRefetchOnReconnect } from "../../utils/useRefetchOnReconnect";

const IMG_BASE = IMG_BASES.other;

export default function App({ route }) {
  // Renamed slugs: a 404 is retried with the slug the website redirects to.
  const { slug, handle404, notFoundUrl } = useRenamableSlug('other', route.params);
  const { locale } = useLocale();
  const [globalOtherData, setGlobalOtherData] = useState({});
  const [localeOtherData, setLocaleOtherData] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);

  const load = useCallback(() => {
    api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_article_on_page/other/${locale}/` + slug))
      .then(({ data }) => {
        setGlobalOtherData(data);
        setLocaleOtherData(data.locale_data || {});
        saveArticleData('other', slug, data);
        setLoading(false);
      })
      .catch(async (err) => {
        if (await handle404(err)) { setLoading(false); return; }
        const cached = await loadArticleData('other', slug);
        if (cached) {
          setGlobalOtherData(cached);
          setLocaleOtherData(cached.locale_data || {});
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }, [locale, slug]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useRefetchOnReconnect(load);

  if (isLoading) return <Preloader />;
  if (notFoundUrl) return <NotFoundMoved url={notFoundUrl} />;
  if (noCache) return <OfflineError />;

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeOtherData}
        global_data={globalOtherData.global_data || {}}
        favoriteId={globalOtherData.global_data?.id}
        imgBase={IMG_BASE}
      />
      <ArticleComments articleId={globalOtherData.global_data?.id} />

      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
