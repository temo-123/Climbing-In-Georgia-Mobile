import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Wrapping single-select chips (ascent style, discipline…). `options` =
// [{ key, label }]; pressing the active chip again clears it when
// `allowClear` is set. `scroll` lays them out in one horizontal row.
export default function ChoiceChips({ options, value, onChange, allowClear = false, scroll = false }) {
  const Wrap = scroll ? ScrollView : View;
  const wrapProps = scroll
    ? { horizontal: true, showsHorizontalScrollIndicator: false, contentContainerStyle: styles.row }
    : { style: styles.wrap };
  return (
    <Wrap {...wrapProps}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={o.key}
            onPress={() => onChange(active && allowClear ? null : o.key)}
            activeOpacity={0.8}
            style={[styles.chip, active && styles.active]}
          >
            <Text style={[styles.text, active && styles.textActive]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </Wrap>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8, paddingRight: 8 },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  active: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  text: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2 },
  textActive: { color: '#fff' },
});
