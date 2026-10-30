import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';
import { COLORS, FONTS } from '../../assets/styles/styles';

// `.cg-grade`: grade label shaped like a strip of route-setting tape —
// hold-yellow with a notch cut into the right end.
export default function GradeTape({ grade, color = COLORS.hold, textColor = COLORS.ink, style }) {
  if (!grade) return null;
  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.body, { backgroundColor: color }]}>
        <Text style={[styles.text, { color: textColor }]}>{grade}</Text>
      </View>
      <Svg width={8} height={26} viewBox="0 0 8 26">
        <Polygon points="0,0 8,0 0,13 8,26 0,26" fill={color} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignSelf: 'flex-start', height: 26 },
  body: { paddingLeft: 9, paddingRight: 3, justifyContent: 'center' },
  text: { fontFamily: FONTS.displayBold, fontSize: 16, letterSpacing: 0.4 },
});
