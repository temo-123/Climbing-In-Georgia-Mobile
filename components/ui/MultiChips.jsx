import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Wrapping multi-select chips. `value` is an array of keys; `max` limits
// how many can be on.
export default function MultiChips({ options, value, onChange, max }) {
  return (
    <View style={styles.wrap}>
      {options.map((o) => {
        const on = value.includes(o.key);
        const blocked = !on && max && value.length >= max;
        return (
          <TouchableOpacity
            key={o.key}
            disabled={blocked}
            activeOpacity={0.8}
            onPress={() => onChange(on ? value.filter((k) => k !== o.key) : [...value, o.key])}
            style={[styles.chip, on && styles.on, blocked && styles.blocked]}
          >
            {on && <FontAwesomeIcon icon={faCheck} size={10} color="#fff" />}
            <Text style={[styles.text, on && styles.textOn]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  on: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  blocked: { opacity: 0.4 },
  text: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2 },
  textOn: { color: '#fff' },
});
