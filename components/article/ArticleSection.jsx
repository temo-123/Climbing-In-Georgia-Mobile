import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// Panel padding — text inside needs `width - PAGE_PADDING*2 - SECTION_PADDING*2`.
export const SECTION_PADDING = 16;

// One article section (`.cg-panel` with a left-aligned section title and
// the rope-and-hold underline), e.g. "How to get there", "Best time".
export default function ArticleSection({ title, icon, children, right, style }) {
  return (
    <View style={[styles.panel, style]}>
      {!!title && (
        <View style={styles.head}>
          {!!icon && (
            <View style={styles.icon}>
              <FontAwesomeIcon icon={icon} size={14} color={COLORS.primaryDark} />
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
          {right}
        </View>
      )}
      {!!title && (
        <View style={styles.underline}>
          <View style={styles.rope} />
          <View style={styles.hold} />
        </View>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.lg,
    padding: SECTION_PADDING,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontFamily: FONTS.displayBold, fontSize: 23, lineHeight: 27, color: COLORS.ink },
  underline: { flexDirection: 'row', width: 48, height: 3, marginTop: 8, marginBottom: 12 },
  rope: { width: '72%', height: 3, borderRadius: 3, backgroundColor: COLORS.primary },
  hold: { width: '22%', height: 3, borderRadius: 3, backgroundColor: COLORS.hold, marginLeft: '6%' },
});
