import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, Share, useWindowDimensions } from "react-native";
import { useTranslation } from 'react-i18next';
import { faShareNodes, faTrophy, faPeopleGroup, faCircleInfo, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { useLocale } from '../../utils/LocaleContext';
import api, { corsUrl, API_BASE_URL, IMG_BASES, imgUri } from "../../utils/api";
import { loadArticleData, saveArticleData, loadOfflineData, OFFLINE_KEYS } from "../../utils/offlineStorage";
import { useRefetchOnReconnect } from "../../utils/useRefetchOnReconnect";
import { eventStatus, toDate } from "../../utils/eventDates";
import { composeGeneralInfo } from "../../utils/generalInfo";

import CachedImage from "../../components/CachedImage";
import HtmlContent from "../../components/HtmlContent";
import EmbedBlock from "../../components/EmbedBlock";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import ArticleSection, { SECTION_PADDING } from "../../components/article/ArticleSection";
import GlobalInfoBlock from "../../components/article/article_general_info";
import EventDates from "../../components/events/EventDates";
import InterestedButton from "../../components/events/InterestedButton";
import EventCard from "../../components/cards/event_card_component";
import Chip from "../../components/ui/Chip";
import Button from "../../components/ui/Button";
import SectionTitle from "../../components/ui/SectionTitle";
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

const IMG_BASE = IMG_BASES.event;

// The website's EventPageComponent: photo hero (category, title, interested
// button with count, share), the dates panel with add-to-calendar, text /
// info / place, then up to three more upcoming events. The page API returns
// { global_event, locale_event, general_info } and takes the url_title.
export default function EventPage({ route }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const [data, setData] = useState(null);
  const [others, setOthers] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);

  const eventKey = route.params?.toString();

  const load = useCallback(() => {
    api.get(corsUrl(`${API_BASE_URL}/get_event/get_event_on_site_page/${locale}/` + eventKey))
      .then(({ data }) => {
        setData(data);
        saveArticleData('event', eventKey, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadArticleData('event', eventKey);
        if (cached) setData(cached);
        else setNoCache(true);
        setLoading(false);
      });
    // "More upcoming events" — from the list endpoint (or its offline copy)
    api.get(corsUrl(`${API_BASE_URL}/get_event/get_event_on_site_list/${locale}`))
      .then(({ data }) => setOthers(Array.isArray(data) ? data : []))
      .catch(async () => setOthers((await loadOfflineData(OFFLINE_KEYS.events)) || []));
  }, [locale, eventKey]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useRefetchOnReconnect(load);

  const ev = data?.global_event || {};
  const le = data?.locale_event || {};
  const more = useMemo(() => others
    .filter((o) => o?.global_event && o.global_event.id !== ev.id && eventStatus(o.global_event).key !== 'finished')
    .sort((a, b) => (toDate(a.global_event.start_data) || 0) - (toDate(b.global_event.start_data) || 0))
    .slice(0, 3), [others, ev.id]);

  if (isLoading) return <Preloader />;
  if (noCache || !data) return <OfflineError />;

  const link = `https://climbing.ge/${locale === 'ka' ? 'ka/' : ''}event/${ev.url_title}`;
  const isCompetition = ev.category === 'competition';
  const textWidth = width - 32 - SECTION_PADDING * 2;
  const info = data.general_info || {};
  const hasInfo = composeGeneralInfo(info.info_block, le.info).length > 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <CachedImage uri={imgUri(IMG_BASE, ev.image, ev.updated_at)} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heroText}>
          <Chip
            tone="dark"
            icon={isCompetition ? faTrophy : faPeopleGroup}
            label={isCompetition ? t('site.guide.events.competition_flag') : t('site.guide.events.event_festival_flag')}
          />
          <Text style={styles.title}>{le.title}</Text>
          <View style={styles.actions}>
            <InterestedButton event={ev} variant="big" />
            <Button
              small
              block={false}
              variant="ghost"
              icon={faShareNodes}
              title={t('site.common.share')}
              onPress={() => Share.share({ message: `${le.title}\n${link}`, url: link }).catch(() => {})}
            />
          </View>
          <Text style={styles.reminder}>{t('site.guide.events.reminder_hint')}</Text>
        </View>
      </View>

      <EventDates ev={ev} title={le.title} details={le.short_description} link={link} />

      {!!ev.map && (/<iframe/i.test(ev.map) ? (
        <ArticleSection title={t('site.guide.events.see_map')} icon={faLocationDot}>
          <EmbedBlock html={ev.map} height={260} type="map" padding={32 + SECTION_PADDING * 2} />
        </ArticleSection>
      ) : (
        <Chip icon={faLocationDot} label={ev.map} style={styles.place} />
      ))}

      {!!le.text && (
        <ArticleSection>
          <HtmlContent html={le.text} contentWidth={textWidth} />
        </ArticleSection>
      )}

      {hasInfo && (
        <ArticleSection title={t('article.info_contacts')} icon={faCircleInfo}>
          <GlobalInfoBlock global_info_data={info.info_block} actyve_block_data={le.info} contentWidth={textWidth} />
        </ArticleSection>
      )}

      {more.length > 0 && (
        <View style={styles.more}>
          <SectionTitle align="left" size="sm">{t('site.guide.events.more_upcoming')}</SectionTitle>
          {more.map((o) => <EventCard key={o.global_event.id} cardData={o} />)}
        </View>
      )}

      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  container: { padding: 16 },
  hero: { borderRadius: RADII.xl, overflow: 'hidden', backgroundColor: COLORS.ink, marginBottom: 14, ...SHADOWS.md },
  heroImage: { width: '100%', aspectRatio: 16 / 9 },
  heroText: { padding: 18, gap: 10 },
  title: { color: '#fff', fontFamily: FONTS.displayBold, fontSize: 30, lineHeight: 33 },
  actions: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  reminder: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.7)' },
  place: { marginBottom: 14 },
  more: { marginTop: 8 },
});
