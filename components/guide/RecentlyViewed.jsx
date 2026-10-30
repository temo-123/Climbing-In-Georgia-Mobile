import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { imgUri } from '../../utils/api';
import { useRecentlyViewed, forgetViewed } from '../../utils/recentlyViewed';
import { articleImageBase, openArticle } from '../../utils/articleRoutes';
import CachedImage from '../CachedImage';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's RecentlyViewedComponent: a row of the guide pages last
// opened on this device. `category` limits it to one list (null = all, on
// the home screen); hidden when empty.
export default function RecentlyViewed({ category = null, exclude = null }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const all = useRecentlyViewed();
  const items = all.filter((i) => (!category || i.category === category) && i.url_title !== exclude);
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <FontAwesomeIcon icon={faClockRotateLeft} size={12} color={COLORS.primary} />
        <Text style={styles.title}>{t('site.guide.recently_viewed.title')}</Text>
        <View style={styles.flex} />
        {!category && (
          <TouchableOpacity onPress={forgetViewed} hitSlop={8}>
            <Text style={styles.clear}>{t('site.guide.recently_viewed.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((i) => (
          <TouchableOpacity
            key={`${i.category}/${i.url_title}`}
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => openArticle(navigation, i.category, i.url_title)}
          >
            <CachedImage uri={imgUri(articleImageBase(i.category), i.image, i.updated_at)} style={styles.img} contentFit="cover" />
            <View style={styles.body}>
              {!category && <Text style={styles.cat}>{t(`site.guide.recently_viewed.categories.${i.category}`)}</Text>}
              <Text style={styles.cardTitle} numberOfLines={2}>{i.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { fontFamily: FONTS.bodyHeavy, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.ink2 },
  clear: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.muted },
  row: { gap: 10, paddingRight: 8 },
  card: {
    width: 150,
    borderRadius: RADII.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  img: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: 8 },
  cat: { fontFamily: FONTS.bodyHeavy, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: COLORS.primary },
  cardTitle: { fontFamily: FONTS.displayBold, fontSize: 15, lineHeight: 17, color: COLORS.ink },
});
