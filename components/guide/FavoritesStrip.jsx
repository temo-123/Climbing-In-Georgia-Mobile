import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL, imgUri } from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { useFavorites } from '../../utils/favorites';
import { articleImageBase, openArticle } from '../../utils/articleRoutes';
import CachedImage from '../CachedImage';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's FavoriteArticlesStripComponent: a "My favorites" row at the
// top of the outdoor / ice / indoor / mountaineering / other lists, only the
// favourites of that list's category. Hidden for guests and when empty.
export default function FavoritesStrip({ category }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { locale } = useLocale();
  const { loggedIn, ids, loaded } = useFavorites();
  const [articles, setArticles] = useState([]);
  const count = ids.size;

  // Refetch when the number of favourites changes (a heart was toggled).
  useEffect(() => {
    if (!loggedIn || !loaded) { setArticles([]); return; }
    let alive = true;
    api.get(`${API_BASE_URL}/get_faworite/get_favorite_articles`, { params: { lang: locale === 'ka' ? 'ka' : 'us' } })
      .then(({ data }) => alive && setArticles(Array.isArray(data) ? data : []))
      .catch(() => {});
    return () => { alive = false; };
  }, [loggedIn, loaded, count, locale]);

  const items = useMemo(
    () => articles.filter((a) => a?.global_data?.category === category && ids.has(Number(a.global_data.id))),
    [articles, category, ids],
  );
  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <FontAwesomeIcon icon={faHeart} size={13} color={COLORS.rope} />
        <Text style={styles.title}>{t('site.guide.favorite.my_favorites')}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((a) => (
          <TouchableOpacity
            key={a.global_data.id}
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => openArticle(navigation, a.global_data.category, a.global_data.url_title)}
          >
            <CachedImage
              uri={imgUri(articleImageBase(a.global_data.category), a.global_data.image, a.global_data.updated_at)}
              style={styles.img}
              contentFit="cover"
            />
            <Text style={styles.cardTitle} numberOfLines={2}>{a.locale_data?.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { fontFamily: FONTS.bodyHeavy, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.ink2 },
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
  cardTitle: { fontFamily: FONTS.displayBold, fontSize: 15, lineHeight: 17, color: COLORS.ink, padding: 8 },
});
