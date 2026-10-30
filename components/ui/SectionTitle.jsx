import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../../assets/styles/styles';

// `.cg-section-title`: display-font heading with the rope-and-hold underline
// (accent rope, a small gap, then a hold-yellow tip).
export default function SectionTitle({ children, align = 'center', size = 'md', style }) {
  const left = align === 'left';
  return (
    <View style={[styles.wrap, left && styles.left, style]}>
      <Text style={[styles.title, size === 'sm' && styles.small, left && styles.textLeft]}>{children}</Text>
      <View style={styles.underline}>
        <View style={styles.rope} />
        <View style={styles.hold} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', marginTop: 8, marginBottom: 18 },
  left: { alignItems: 'flex-start' },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 28,
    lineHeight: 32,
    color: COLORS.ink,
    textAlign: 'center',
  },
  small: { fontSize: 22, lineHeight: 26 },
  textLeft: { textAlign: 'left' },
  underline: { flexDirection: 'row', width: 64, height: 4, marginTop: 10 },
  rope: { width: '72%', height: 4, borderRadius: 4, backgroundColor: COLORS.primary },
  hold: { width: '22%', height: 4, borderRadius: 4, backgroundColor: COLORS.hold, marginLeft: '6%' },
});
