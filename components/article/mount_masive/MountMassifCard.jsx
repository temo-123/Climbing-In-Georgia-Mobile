import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMountain, faChevronRight, faFlag, faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import api, { corsUrl, API_BASE_URL } from '../../../utils/api';
import { useLocale } from '../../../utils/LocaleContext';
import { saveMassiveData, loadMassiveData } from '../../../utils/offlineStorage';
import { useRefetchOnReconnect } from '../../../utils/useRefetchOnReconnect';
import EmbedBlock from '../../EmbedBlock';
import HtmlContent from '../../HtmlContent';
import Segmented from '../../ui/Segmented';
import SummitsMap, { summitsWithCoords } from './SummitsMap';
import { COLORS, FONTS, RADII, SHADOWS } from '../../../assets/styles/styles';

// Mountain massif card on a mountaineering route page — the website's
// MountMassifCardComponent.vue. GET get_mount/on_page/{lang}/{route id} →
// { locale_data, global_data, routes_count, summits[] } or nothing (route
// without a (viewable) massif → no card).
// - header: eyebrow, massif name, one plain-text lead line
// - chips: "All N routes in this massif" (→ the filtered route list, only
//   when there are others) and one per summit "Name · 5047 m" (→ summit)
// - tabs, one per filled field: About · Best season · Getting there · Map
//   (summit pins and/or the stored Google map) · What to bring · Weather
function plain(html) {
  return String(html ?? '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}
const filled = (html) => plain(html).length > 1;

export default function MountMassifCard({ articleId }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const [content, setContent] = useState(null);
  const [tab, setTab] = useState(null);
  const [open, setOpen] = useState(true);
  const [mapKind, setMapKind] = useState('osm');

  const fetchData = useCallback(() => {
    if (!articleId) return;
    api.get(corsUrl(`${API_BASE_URL}/get_mount/on_page/${locale}/${articleId}`))
      .then(({ data }) => {
        const value = data && typeof data === 'object' && !Array.isArray(data) ? data : null;
        setContent(value);
        if (value) saveMassiveData(locale, articleId, value);
      })
      .catch(async () => {
        const cached = await loadMassiveData(locale, articleId);
        if (cached) setContent(cached);
      });
  }, [articleId, locale]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useRefetchOnReconnect(fetchData);

  const ld = content?.locale_data || {};
  const gd = content?.global_data || {};
  const summits = content?.summits || [];
  const pins = summitsWithCoords(summits);
  const hasGoogleMap = /<(iframe|img)/i.test(gd.map || '');

  const tabs = useMemo(() => [
    filled(ld.text) || filled(ld.short_description) ? { key: 'about', label: t('site.guide.massif.tab_about') } : null,
    filled(ld.best_time) ? { key: 'season', label: t('site.guide.massif.tab_season') } : null,
    filled(ld.how_get) ? { key: 'getting', label: t('site.guide.massif.tab_getting') } : null,
    hasGoogleMap || pins.length ? { key: 'map', label: t('site.guide.massif.tab_map') } : null,
    filled(ld.what_need) ? { key: 'gear', label: t('site.guide.massif.tab_gear') } : null,
    gd.weather ? { key: 'weather', label: t('site.guide.massif.tab_weather') } : null,
  ].filter(Boolean), [ld, gd, pins.length, hasGoogleMap, t]);

  // Every load starts open on the first tab, like the website.
  useEffect(() => { setTab(tabs[0]?.key ?? null); setOpen(true); }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!content || !ld.title) return null;

  const leadSource = filled(ld.short_description) ? ld.short_description : ld.text;
  const lead = plain(leadSource);
  const leadLine = lead.length > 180 ? `${lead.slice(0, 180).trim()}…` : lead;
  const routesCount = Number(content.routes_count) || 0;
  const openSummit = (s) => navigation.navigate('summit_detail', { url_title: s.url_title, title: s.title });

  function renderTab() {
    const html = (h) => <HtmlContent html={h} contentWidth={width - 64} />;
    switch (tab) {
      case 'about': return html(filled(ld.text) ? ld.text : ld.short_description);
      case 'season': return html(ld.best_time);
      case 'getting': return html(ld.how_get);
      case 'gear': return html(ld.what_need);
      case 'weather': return <EmbedBlock html={gd.weather} height={220} padding={64} type="weather" />;
      case 'map': {
        const both = hasGoogleMap && pins.length > 0;
        const kind = both ? mapKind : (pins.length ? 'osm' : 'google');
        return (
          <View style={styles.mapWrap}>
            {both && (
              <Segmented
                options={[{ key: 'google', label: t('site.guide.massif.map_google') }, { key: 'osm', label: t('site.guide.massif.map_osm') }]}
                value={mapKind}
                onChange={setMapKind}
              />
            )}
            {kind === 'osm'
              ? <SummitsMap summits={summits} height={240} onOpenSummit={openSummit} openLabel={t('site.guide.massif.open_summit')} />
              : <EmbedBlock html={gd.map} height={260} padding={64} type="map" />}
          </View>
        );
      }
      default: return null;
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><FontAwesomeIcon icon={faMountain} size={16} color={COLORS.hold} /></View>
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>{t('site.guide.massif.eyebrow')}</Text>
          <Text style={styles.name}>{ld.title}</Text>
        </View>
      </View>
      {!!leadLine && <Text style={styles.lead}>{leadLine}</Text>}

      {(routesCount > 1 || summits.length > 0) && (
        <View style={styles.chips}>
          {routesCount > 1 && (
            <TouchableOpacity
              style={[styles.chip, styles.chipAccent]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('HomeDrawer', { screen: 'mountain_routes_list', params: { massifId: gd.id, at: Date.now() } })}
            >
              <Text style={[styles.chipText, styles.chipTextAccent]}>{t('site.guide.massif.all_routes', { count: routesCount })}</Text>
              <FontAwesomeIcon icon={faChevronRight} size={10} color="#fff" />
            </TouchableOpacity>
          )}
          {summits.map((s) => (
            <TouchableOpacity key={s.id} style={styles.chip} activeOpacity={0.8} onPress={() => openSummit(s)}>
              <FontAwesomeIcon icon={faFlag} size={10} color={COLORS.primaryDark} />
              <Text style={styles.chipText}>{s.title}{s.height ? ` · ${s.height} m` : ''}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {tabs.length > 0 && (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {tabs.map((x) => {
              const active = open && tab === x.key;
              return (
                <TouchableOpacity
                  key={x.key}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => { if (active) setOpen(false); else { setTab(x.key); setOpen(true); } }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>{x.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {open && <View style={styles.body}>{renderTab()}</View>}
          <TouchableOpacity style={styles.toggle} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
            <Text style={styles.toggleText}>
              {open ? t('site.guide.massif.hide') : t('site.guide.massif.read_about', { name: ld.title })}
            </Text>
            <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} size={11} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    borderWidth: 1, borderColor: COLORS.line, borderRadius: RADII.lg, marginBottom: 14, padding: 16,
    backgroundColor: COLORS.surface, ...SHADOWS.sm,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontFamily: FONTS.bodyHeavy, letterSpacing: 1.6, textTransform: 'uppercase', color: COLORS.muted },
  name: { fontSize: 24, lineHeight: 27, fontFamily: FONTS.displayBold, color: COLORS.ink },
  lead: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 6,
    borderRadius: RADII.pill, backgroundColor: COLORS.primarySoft,
  },
  chipAccent: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.primaryDark },
  chipTextAccent: { color: '#fff' },
  tabs: { gap: 6, paddingTop: 14, paddingBottom: 2 },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADII.pill, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.chalk },
  tabActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  tabText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.ink2 },
  tabTextActive: { color: '#fff' },
  body: { marginTop: 12 },
  mapWrap: { gap: 10 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginTop: 12 },
  toggleText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.primary },
});
