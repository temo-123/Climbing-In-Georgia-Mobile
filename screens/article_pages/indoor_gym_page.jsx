import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, useWindowDimensions } from "react-native";
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { faTag, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { useLocale } from '../../utils/LocaleContext';

import ArticleBlock from "../../components/article/articl_block";
import ArticleSection, { SECTION_PADDING } from "../../components/article/ArticleSection";
import HtmlContent from "../../components/HtmlContent";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import NotFoundMoved from "../../components/NotFoundMoved";
import { useRenamableSlug } from "../../utils/renamedSlug";
import PageFooter from "../../components/PageFooter";
import EmptyState from "../../components/EmptyState";
import Button from "../../components/ui/Button";
import { useRememberViewed } from "../../utils/recentlyViewed";
import ArticleComments from "../../components/guide/ArticleComments";
import DirectionsButton from "../../components/guide/DirectionsButton";
import WorkStatusAlert from "../../components/gym/WorkStatusAlert";
import GymHours from "../../components/gym/GymHours";
import OpenBadge from "../../components/gym/OpenBadge";

import api, { corsUrl, API_BASE_URL, IMG_BASES } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";
import { useRefetchOnReconnect } from "../../utils/useRefetchOnReconnect";
import { fetchGymWeek, useMinuteClock } from "../../utils/gymHours";
import { COLORS, FONTS } from '../../assets/styles/styles';

const IMG_BASE = IMG_BASES.indoor;

// Indoor gym page (the website's IndoorPageComponent): work-status alert on
// top, live open badge, then the article with "Opening hours" and "Price"
// right after "How to get there". Coming-soon gyms have no page yet.
export default function IndoorGymPage({ route }) {
  // Renamed slugs: a 404 is retried with the slug the website redirects to.
  const { slug, handle404, notFoundUrl } = useRenamableSlug('indoor', route.params);
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const now = useMinuteClock();
  const [globalIndoorData, setGlobalIndoorData] = useState({});
  const [localeIndoorData, setLocaleIndoorData] = useState({});
  const [globalIndoorInfoData, setGlobalIndoorInfoData] = useState({});
  const [week, setWeek] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);

  useRememberViewed('indoor', globalIndoorData.global_data, localeIndoorData.title);

  const load = useCallback(() => {
    api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_article_on_page/indoor/${locale}/` + slug))
      .then(({ data }) => {
        setGlobalIndoorData(data);
        setLocaleIndoorData(data.locale_data || {});
        setGlobalIndoorInfoData(data.general_info || {});
        saveArticleData('indoor', slug, data);
        setLoading(false);
      })
      .catch(async (err) => {
        if (await handle404(err)) { setLoading(false); return; }
        const cached = await loadArticleData('indoor', slug);
        if (cached) {
          setGlobalIndoorData(cached);
          setLocaleIndoorData(cached.locale_data || {});
          setGlobalIndoorInfoData(cached.general_info || {});
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }, [locale, slug]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useRefetchOnReconnect(load);

  const gd = globalIndoorData.global_data || {};
  useEffect(() => {
    if (gd.id) fetchGymWeek(gd.id).then(setWeek);
  }, [gd.id]);

  if (isLoading) return <Preloader />;
  if (notFoundUrl) return <NotFoundMoved url={notFoundUrl} />;
  if (noCache) return <OfflineError />;

  if (gd.work_status === 'coming_soon') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <WorkStatusAlert status="coming_soon" />
        <EmptyState message={t('site.guide.article.work_status_text.coming_soon')} />
        <Button variant="outline" title={t('nav.indoor')} onPress={() => navigation.navigate('HomeDrawer', { screen: 'indoors_list' })} />
        <PageFooter />
      </ScrollView>
    );
  }

  const gym = { ...gd, weekly_hours: week };
  const textWidth = width - 32 - SECTION_PADDING * 2;
  const priceNoInfo = gd.price_status === 'no_info';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <WorkStatusAlert status={gd.work_status} />
      <ArticleBlock
        local_data={localeIndoorData}
        global_data={gd}
        favoriteId={gd.id}
        headerExtra={<OpenBadge gym={gym} now={now} />}
        afterImageContent={<DirectionsButton parking={gd.parking} />}
        afterHowGet={
          <>
            <GymHours gym={gym} />
            {gd.work_status === 'no_info' && (
              <Text style={styles.noInfo}>{t('site.guide.article.work_status.no_info')}</Text>
            )}
            {(priceNoInfo || !!localeIndoorData.price_text || gd.price_from != null) && (
              <ArticleSection title={t('site.guide.article.title.price')} icon={faTag}>
                {priceNoInfo ? (
                  <Text style={styles.muted}>{t('site.guide.article.no_info_price')}</Text>
                ) : (
                  <>
                    {gd.price_from != null && (
                      <Text style={styles.priceFrom}>{t('site.guide.article.prices_from')} {gd.price_from} ₾</Text>
                    )}
                    {!!localeIndoorData.price_text && <HtmlContent html={localeIndoorData.price_text} contentWidth={textWidth} />}
                  </>
                )}
              </ArticleSection>
            )}
            {!!localeIndoorData.address && (
              <ArticleSection title={t('gyms.address')} icon={faLocationDot}>
                <HtmlContent html={localeIndoorData.address} contentWidth={textWidth} />
              </ArticleSection>
            )}
          </>
        }
        global_info_data={globalIndoorInfoData}
        imgBase={IMG_BASE}
      />
      <ArticleComments articleId={gd.id} />

      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16 },
  noInfo: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.stone, marginBottom: 14 },
  muted: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.stone },
  priceFrom: { fontFamily: FONTS.displayBold, fontSize: 22, color: COLORS.primaryDark, marginBottom: 6 },
});
