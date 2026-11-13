import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '../../utils/AuthContext';
import { isGateHandled } from '../../utils/accountGate';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartOutline } from '@fortawesome/free-regular-svg-icons';
import { useInterested, toggleInterested } from '../../utils/interested';
import { useToast } from '../ui/Toast';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's InterestedButtonComponent: `card` = round heart with the
// count over an event photo, `big` = full button with the count on the
// event page. Removing offers Undo; guests are offered the login page.
export default function InterestedButton({ event, variant = 'card' }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const toast = useToast();
  const { loggedIn, isInterested, count } = useInterested();
  const { isUnderage } = useAccount();
  if (!event?.id || isUnderage) return null;
  const on = isInterested(event.id);
  const n = count(event);

  async function press() {
    if (!loggedIn) {
      Alert.alert(t('site.guide.events.interested_add'), t('site.guide.events.interested_login'), [
        { text: t('site.common.cancel'), style: 'cancel' },
        { text: t('auth.nav_login'), onPress: () => navigation.navigate('login') },
      ]);
      return;
    }
    try {
      const now = await toggleInterested(event.id);
      toast.show(now
        ? { message: t('site.guide.events.interested_added') }
        : {
          message: t('site.guide.events.interested_removed'),
          action: { label: t('site.guide.favorite.undo'), handler: () => toggleInterested(event.id).catch(() => {}) },
        });
    } catch (err) {
      if (!isGateHandled(err)) toast.show({ type: 'error', message: t('site.guide.favorite.error') });
    }
  }

  if (variant === 'big') {
    return (
      <TouchableOpacity onPress={press} activeOpacity={0.85} style={[styles.big, on && styles.bigOn]}>
        <FontAwesomeIcon icon={on ? faHeart : faHeartOutline} size={16} color={on ? '#fff' : COLORS.rope} />
        <Text style={[styles.bigText, on && styles.bigTextOn]}>
          {on ? t('site.guide.events.interested_on') : t('site.guide.events.interested_add')}
        </Text>
        <View style={[styles.count, on && styles.countOn]}>
          <Text style={[styles.countText, on && styles.countTextOn]}>{n}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={press} activeOpacity={0.85} hitSlop={6} style={styles.card}>
      <FontAwesomeIcon icon={on ? faHeart : faHeartOutline} size={14} color={on ? COLORS.rope : COLORS.ink2} />
      {n > 0 && <Text style={styles.cardCount}>{n}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 32,
    height: 32,
    paddingHorizontal: 9,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  cardCount: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.ink },
  big: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    paddingLeft: 16,
    paddingRight: 8,
    borderRadius: RADII.pill,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.rope,
  },
  bigOn: { backgroundColor: COLORS.rope },
  bigText: { fontFamily: FONTS.bodyHeavy, fontSize: 14, color: COLORS.rope },
  bigTextOn: { color: '#fff' },
  count: { minWidth: 26, paddingHorizontal: 7, height: 24, borderRadius: 12, backgroundColor: '#ffece5', alignItems: 'center', justifyContent: 'center' },
  countOn: { backgroundColor: 'rgba(255,255,255,0.25)' },
  countText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.rope },
  countTextOn: { color: '#fff' },
});
