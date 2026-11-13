import React from 'react';
import { TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '../../utils/AuthContext';
import { isGateHandled } from '../../utils/accountGate';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { useFavorites, addFavorite, removeFavorite } from '../../utils/favorites';
import { useToast } from '../ui/Toast';
import { COLORS, SHADOWS } from '../../assets/styles/styles';

// The website's FavoriteHeartComponent: a round heart over card photos and
// next to article titles. Adding / removing shows a toast (removing with
// Undo) instead of confirm popups; guests are offered the login page.
export default function FavoriteHeart({ articleId, size = 'md', style }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { loggedIn, isFavorite } = useFavorites();
  const { isUnderage } = useAccount();
  if (!articleId || isUnderage) return null;
  const on = isFavorite(articleId);
  const d = size === 'sm' ? 32 : 40;

  async function toggle() {
    if (!loggedIn) {
      Alert.alert(t('site.guide.favorite.add_label'), t('site.guide.favorite.login_needed'), [
        { text: t('site.common.cancel'), style: 'cancel' },
        { text: t('auth.nav_login'), onPress: () => navigation.navigate('login') },
      ]);
      return;
    }
    try {
      if (on) {
        await removeFavorite(articleId);
        toast.show({
          message: t('site.guide.favorite.removed'),
          action: { label: t('site.guide.favorite.undo'), handler: () => addFavorite(articleId).catch(() => {}) },
        });
      } else {
        await addFavorite(articleId);
        toast.show({ message: t('site.guide.favorite.added') });
      }
    } catch (err) {
      if (!isGateHandled(err)) toast.show({ type: 'error', message: t('site.guide.favorite.error') });
    }
  }

  return (
    <TouchableOpacity
      onPress={toggle}
      hitSlop={8}
      activeOpacity={0.8}
      accessibilityLabel={t(on ? 'site.guide.favorite.remove_label' : 'site.guide.favorite.add_label')}
      style={[styles.btn, { width: d, height: d, borderRadius: d / 2 }, style]}
    >
      <FontAwesomeIcon icon={on ? faHeart : faHeartOutline} size={d * 0.45} color={on ? COLORS.rope : COLORS.ink2} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
});
