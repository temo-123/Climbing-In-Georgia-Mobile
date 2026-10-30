import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// `.cg-stat` tiles in a two-column grid: icon tile, big display-font value,
// small uppercase label, optional sub line. `items` = [{ icon, value, label, sub? }].
export default function StatTiles({ items, style }) {
  return (
    <View style={[styles.grid, style]}>
      {items.map((it, i) => (
        <View key={i} style={styles.tile}>
          {!!it.icon && (
            <View style={styles.icon}>
              <FontAwesomeIcon icon={it.icon} size={16} color={COLORS.primaryDark} />
            </View>
          )}
          <View style={styles.textCol}>
            <Text style={styles.value}>{it.value}</Text>
            <Text style={styles.label} numberOfLines={2}>{it.label}</Text>
            {!!it.sub && <Text style={styles.sub}>{it.sub}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginBottom: 14 },
  tile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.lg,
    ...SHADOWS.sm,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  value: { fontFamily: FONTS.displayBold, fontSize: 26, lineHeight: 28, color: COLORS.ink },
  label: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: COLORS.muted,
    marginTop: 2,
  },
  sub: { fontFamily: FONTS.bodySemi, fontSize: 11, color: COLORS.stone, marginTop: 1 },
});
