import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { COLORS } from '../../assets/styles/styles';

// Font Awesome icon + text in one row — the website uses FA icons, never
// emoji, in front of labels.
export default function IconText({ icon, children, style, iconColor = COLORS.primary, size = 12, numberOfLines, gap = 6 }) {
  return (
    <View style={[styles.row, { gap }]}>
      <FontAwesomeIcon icon={icon} size={size} color={iconColor} />
      <Text style={[styles.text, style]} numberOfLines={numberOfLines}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  text: { flexShrink: 1 },
});
