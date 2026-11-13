import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserXmark } from '@fortawesome/free-solid-svg-icons';
import { useAccount } from '../../utils/AuthContext';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Shown where an action form would be (comments, reviews, ascents…) for an
// under-age account: the guidebook stays read-only for them.
export default function AgeLockedNote({ style }) {
  const { t } = useTranslation();
  const { minAge } = useAccount();
  return (
    <View style={[styles.card, style]}>
      <FontAwesomeIcon icon={faUserXmark} size={15} color={COLORS.warning} />
      <Text style={styles.text}>{t('site.global.age_restriction.inline', { age: minAge })}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: RADII.md,
    backgroundColor: '#fdf3ea', borderWidth: 1, borderColor: '#f3cfb4',
  },
  text: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 19, color: COLORS.ink2 },
});
