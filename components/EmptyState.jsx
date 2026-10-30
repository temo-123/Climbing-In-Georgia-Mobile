import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SCENES } from './ui/scenes';
import { COLORS, FONTS, RADII } from '../assets/styles/styles';

// The website's `.cg-empty` + EmptyPageComponent: a dashed chalk card with
// the "climber at a blank wall" scene.
export default function EmptyState({ message = 'No content here yet.\nCheck back soon!', scene = 'empty' }) {
  return (
    <View style={styles.container}>
      <View style={styles.scene}>
        <SvgXml xml={SCENES[scene] ?? SCENES.empty} width="100%" height="100%" />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginVertical: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d5cfc3',
    borderRadius: RADII.lg,
  },
  scene: { width: '100%', maxWidth: 300, aspectRatio: 360 / 240, marginBottom: 16 },
  message: {
    fontSize: 15,
    fontFamily: FONTS.bodySemi,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 23,
  },
});
