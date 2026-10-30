import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS, FONTS, SHADOWS } from '../../assets/styles/styles';

// `.cg-segmented`: pill toggle (tabs, view modes, Upcoming / Past…).
// `options` = [{ key, label, icon? }].
export default function Segmented({ options, value, onChange, style }) {
  return (
    <View style={[styles.wrap, style]}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <TouchableOpacity
            key={String(o.key)}
            onPress={() => onChange(o.key)}
            activeOpacity={0.8}
            style={[styles.item, active && styles.active]}
          >
            {!!o.icon && <FontAwesomeIcon icon={o.icon} size={12} color={active ? COLORS.primary : COLORS.stone} />}
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    padding: 4,
    gap: 2,
    borderRadius: 999,
    backgroundColor: COLORS.chalk2,
  },
  item: {
    flex: 1,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  active: { backgroundColor: '#fff', ...SHADOWS.sm },
  text: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.stone },
  textActive: { color: COLORS.ink },
});
