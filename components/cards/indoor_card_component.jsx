import React from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { faClock, faTag } from '@fortawesome/free-solid-svg-icons';
import ArticleCardShell from './ArticleCardShell';
import OpenBadge from '../gym/OpenBadge';
import { STATUS_META } from '../gym/WorkStatusAlert';
import { hoursForDay, hasHours, variesByDay, dayKey } from '../../utils/gymHours';
import FavoriteHeart from '../guide/FavoriteHeart';
import { imgUri, IMG_BASES } from '../../utils/api';
import { FONTS } from '../../assets/styles/styles';

// The website's IndoorCardComponent: ribbon for the three alert work
// statuses, today's hours (or "Closed today") + "Hours vary by day", price,
// and a live open / closed badge. `week` = per-day hours from
// get_gym_hours/all, `now` = the list's minute clock.
export default function IndoorCard({ cardData, week, now = new Date() }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const gd = cardData.global_data;
  const gym = week ? { ...gd, weekly_hours: week } : gd;
  const status = STATUS_META[gd.work_status] ? gd.work_status : null;
  const comingSoon = gd.work_status === 'coming_soon';

  const chips = [];
  if (!status && hasHours(gym)) {
    const today = hoursForDay(gym, dayKey(now));
    chips.push({ icon: faClock, label: today ? `${today.open} – ${today.close}` : t('site.guide.gym_hours.closed_today') });
    if (variesByDay(gym)) chips.push({ label: t('site.guide.gym_hours.varies') });
  }
  if (gd.work_status === 'no_info') chips.push({ icon: faClock, label: t('site.guide.article.work_status.no_info') });
  if (gd.price_status === 'no_info') {
    chips.push({ icon: faTag, label: t('site.guide.article.no_info_price') });
  } else if (gd.price_from != null) {
    chips.push({ icon: faTag, label: `${t('site.guide.article.prices_from')} ${gd.price_from} ₾`, tone: 'accent' });
  }

  return (
    <ArticleCardShell
      topRight={<FavoriteHeart articleId={gd.id} size="sm" />}
      imageUri={imgUri(IMG_BASES.indoor, gd.image, gd.updated_at)}
      title={cardData.locale_data.title}
      text={cardData.locale_data.short_description}
      chips={chips}
      onPress={() => (comingSoon
        ? Alert.alert(t('site.guide.article.work_status.coming_soon'), t('site.guide.article.work_status_text.coming_soon'))
        : navigation.navigate('indoor_page', gd.url_title))}
      mediaOverlay={status && (
        <View style={[styles.ribbon, { backgroundColor: STATUS_META[status].color }]}>
          <Text style={styles.ribbonText}>{t(`site.guide.article.work_status.${status}`)}</Text>
        </View>
      )}
    >
      <OpenBadge gym={gym} now={now} small />
    </ArticleCardShell>
  );
}

const styles = StyleSheet.create({
  ribbon: {
    position: 'absolute',
    left: 0,
    top: 14,
    paddingVertical: 5,
    paddingLeft: 12,
    paddingRight: 14,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  ribbonText: { color: '#fff', fontFamily: FONTS.bodyHeavy, fontSize: 12 },
});
