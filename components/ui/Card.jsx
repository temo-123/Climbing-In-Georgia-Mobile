import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, RADII, SHADOWS } from '../../assets/styles/styles';

// `.cg-card` / `.cg-panel`: white surface, chalk-line border, soft shadow.
// Pass `onPress` to make the whole card tappable (website cards are fully
// clickable, no separate button).
export default function Card({ children, onPress, style, padded = false }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.card, padded && styles.padded, style]}
    >
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  padded: { padding: 16 },
});
