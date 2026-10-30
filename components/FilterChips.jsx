import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../assets/styles/styles';

// Horizontal, scrollable, single-select chip row — used for the region
// filter (outdoor spots), massif filter (mountain routes), and month filter
// (events) list screens. `options` is [{ key, label }]; `selected` is a key
// or null for "nothing selected" (the first chip, usually "All").
export default function FilterChips({ options, selected, onSelect }) {
  if (!options || options.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = opt.key === selected;
        return (
          <TouchableOpacity
            key={opt.key ?? 'null'}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(opt.key)}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, paddingVertical: 4, paddingHorizontal: 2 },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    borderRadius: 999,
    paddingHorizontal: 15,
  },
  chipActive: { backgroundColor: COLORS.ink, borderColor: COLORS.ink },
  chipText: { fontSize: 13, color: COLORS.ink2, fontFamily: FONTS.bodyBold },
  chipTextActive: { color: COLORS.hold },
});
