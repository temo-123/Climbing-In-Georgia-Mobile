import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faStar } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Website StarReitingShowComponent: hold-yellow stars followed by the
// number of logged ascents, e.g. ★★★★ (12).
export function StarsShow({ stars = 0, count, size = 12, showEmpty = false }) {
  const n = Math.round(Number(stars) || 0);
  if (!n && !count && !showEmpty) return null;
  return (
    <View style={styles.row}>
      {Array.from({ length: showEmpty ? 5 : n }).map((_, i) => (
        <FontAwesomeIcon key={i} icon={i < n ? faStar : faStarOutline} size={size} color={COLORS.hold} />
      ))}
      {count > 0 && <Text style={[styles.count, { fontSize: size }]}>({count})</Text>}
    </View>
  );
}

// Tap-to-rate input (1–5).
export function StarsInput({ value, onChange, size = 30 }) {
  return (
    <View style={[styles.row, styles.inputRow]}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={6} activeOpacity={0.7}>
          <FontAwesomeIcon icon={n <= value ? faStar : faStarOutline} size={size} color={n <= value ? COLORS.hold : COLORS.muted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  inputRow: { gap: 10 },
  count: { fontFamily: FONTS.bodySemi, color: COLORS.muted, marginLeft: 3 },
});
