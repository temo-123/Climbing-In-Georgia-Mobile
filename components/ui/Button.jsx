import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Website buttons: `primary` (accent), `hold` (`.btn-hold`, yellow CTA with
// an inset bottom edge), `outline` (accent outline), `ghost` (chalk),
// `danger`.
const VARIANTS = {
  primary: { bg: COLORS.primary, fg: '#fff', border: COLORS.primary },
  hold: { bg: COLORS.hold, fg: COLORS.ink, border: COLORS.hold, edge: true },
  outline: { bg: 'transparent', fg: COLORS.primary, border: COLORS.primary },
  ghost: { bg: COLORS.chalk2, fg: COLORS.ink2, border: COLORS.chalk2 },
  danger: { bg: COLORS.danger, fg: '#fff', border: COLORS.danger },
};

export default function Button({ title, onPress, variant = 'primary', icon, loading, disabled, small, style, block = true }) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const off = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={off}
      activeOpacity={0.82}
      style={[
        styles.btn,
        small && styles.small,
        !block && styles.inline,
        { backgroundColor: v.bg, borderColor: v.border },
        off && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.fg} />
      ) : (
        <View style={styles.row}>
          {!!icon && <FontAwesomeIcon icon={icon} size={small ? 12 : 14} color={v.fg} />}
          <Text style={[styles.text, small && styles.smallText, { color: v.fg }]}>{title}</Text>
        </View>
      )}
      {v.edge && <View pointerEvents="none" style={styles.edge} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 46,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inline: { alignSelf: 'flex-start' },
  small: { minHeight: 36, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: FONTS.bodyHeavy, fontSize: 14 },
  smallText: { fontSize: 13 },
  disabled: { opacity: 0.55 },
  edge: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: 'rgba(0,0,0,0.14)' },
});
