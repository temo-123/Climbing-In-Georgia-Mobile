import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS, FONTS } from '../../assets/styles/styles';

// `.cg-chip` (chalk pill) / `.cg-chip--accent` (accent-soft pill).
// `tone` can also be 'rope' / 'hold' / 'danger' / 'success' for status pills.
const TONES = {
  default: { bg: COLORS.chalk, border: COLORS.line, fg: COLORS.ink2, icon: COLORS.primary },
  accent: { bg: COLORS.primarySoft, border: 'rgba(31,147,176,0.25)', fg: COLORS.primaryDark, icon: COLORS.primaryDark },
  hold: { bg: '#fff4d6', border: 'rgba(255,194,51,0.5)', fg: '#7a5600', icon: '#c98a0c' },
  rope: { bg: '#ffece5', border: 'rgba(255,106,61,0.35)', fg: '#b2401c', icon: COLORS.rope },
  danger: { bg: '#fbe9ea', border: 'rgba(207,63,69,0.35)', fg: '#9e2a2f', icon: COLORS.danger },
  success: { bg: '#e3f5ee', border: 'rgba(24,160,111,0.35)', fg: '#0f6d4b', icon: COLORS.success },
  dark: { bg: 'rgba(21,33,43,0.72)', border: 'transparent', fg: '#fff', icon: COLORS.hold },
};

export default function Chip({ label, icon, tone = 'default', style, small }) {
  const t = TONES[tone] ?? TONES.default;
  return (
    <View style={[styles.chip, small && styles.small, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      {!!icon && <FontAwesomeIcon icon={icon} size={small ? 10 : 11} color={t.icon} />}
      <Text style={[styles.text, small && styles.smallText, { color: t.fg }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  small: { paddingHorizontal: 8, paddingVertical: 2 },
  text: { fontFamily: FONTS.bodyBold, fontSize: 12 },
  smallText: { fontSize: 11 },
});
