import * as React from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight, faCircleInfo } from '@fortawesome/free-solid-svg-icons';

import PageFooter from '../components/PageFooter';
import RecentlyViewed from '../components/guide/RecentlyViewed';
import { SKETCHES } from '../components/ui/sketches';
import { COLORS, FONTS, HEAD_COLORS, RADII, SHADOWS } from '../assets/styles/styles';

// Discipline tiles: same sketch + band colour as each section's page head
// on the website, so a tile and the list it opens look like one thing.
const TILES = [
  { route: 'outdoors_list', art: 'quickdraw', key: 'home.outdoor' },
  { route: 'indoors_list', art: 'holds', key: 'home.indoor' },
  { route: 'ices_list', art: 'iceaxe', key: 'home.ice' },
  { route: 'mountain_routes_list', art: 'mountains', key: 'home.mountain' },
  { route: 'events_list', art: 'trophy', key: 'nav.events' },
  { route: 'summits_list', art: 'summit', key: 'home.summits' },
  { route: 'other_activities_list', art: 'tent', key: 'home.other' },
];

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.heroSketch}>
          <SvgXml xml={SKETCHES.mountains} width="100%" height="100%" />
        </View>
        <Text style={styles.eyebrow}>climbing.ge</Text>
        <Text style={styles.heroTitle}>{t('nav.welcome_message')}</Text>
        <Text style={styles.heroLead}>{t('home.lead')}</Text>
        <TouchableOpacity style={styles.heroCta} activeOpacity={0.85} onPress={() => navigation.navigate('outdoors_list')}>
          <Text style={styles.heroCtaText}>{t('home.find_crag')}</Text>
          <FontAwesomeIcon icon={faArrowRight} size={13} color={COLORS.ink} />
        </TouchableOpacity>
      </View>

      <RecentlyViewed />

      <View style={styles.grid}>
        {TILES.map((tile) => (
          <TouchableOpacity
            key={tile.route}
            style={[styles.tile, { backgroundColor: HEAD_COLORS[tile.art] }]}
            activeOpacity={0.88}
            onPress={() => navigation.navigate(tile.route)}
          >
            <View pointerEvents="none" style={styles.tileSketch}>
              <SvgXml xml={SKETCHES[tile.art]} width="100%" height="100%" />
            </View>
            <Text style={styles.tileTitle} numberOfLines={2}>{t(tile.key)}</Text>
            <View style={styles.tileArrow}>
              <FontAwesomeIcon icon={faArrowRight} size={11} color={COLORS.ink} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.about} activeOpacity={0.88} onPress={() => navigation.navigate('about_us')}>
        <View style={styles.aboutIcon}>
          <FontAwesomeIcon icon={faCircleInfo} size={20} color={COLORS.primaryDark} />
        </View>
        <Text style={styles.aboutText}>{t('home.about_us')}</Text>
        <FontAwesomeIcon icon={faArrowRight} size={14} color={COLORS.primary} />
      </TouchableOpacity>

      <PageFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 16 },
  hero: {
    backgroundColor: COLORS.ink,
    borderRadius: RADII.xl,
    padding: 22,
    paddingBottom: 24,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  heroSketch: { position: 'absolute', right: -40, bottom: -10, width: 260, height: 156, opacity: 0.5 },
  eyebrow: {
    color: COLORS.hold,
    fontFamily: FONTS.bodyHeavy,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontFamily: FONTS.displayBold, fontSize: 34, lineHeight: 37 },
  heroLead: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: FONTS.bodyMedium,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 18,
    maxWidth: 300,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    backgroundColor: COLORS.hold,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.14)',
  },
  heroCtaText: { color: COLORS.ink, fontFamily: FONTS.bodyHeavy, fontSize: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  tile: {
    width: '48.3%',
    aspectRatio: 1.05,
    borderRadius: RADII.lg,
    padding: 14,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  tileSketch: { position: 'absolute', top: -6, right: -26, width: 170, height: 102, opacity: 0.95 },
  tileTitle: { color: '#fff', fontFamily: FONTS.displayBold, fontSize: 21, lineHeight: 23, paddingRight: 30 },
  tileArrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.hold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  about: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
    padding: 16,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  aboutIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutText: { flex: 1, fontFamily: FONTS.displayBold, fontSize: 22, color: COLORS.ink },
});
