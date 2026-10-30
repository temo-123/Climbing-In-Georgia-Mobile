import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SKETCHES } from '../ui/sketches';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// The website's auth aside (AuthAsideComponent): a granite panel with the
// pencil gear sketch, above the login / register / reset forms.
export default function AuthHead({ title, subtitle, art = 'carabiners' }) {
  return (
    <View style={styles.panel}>
      <View pointerEvents="none" style={styles.sketch}>
        <SvgXml xml={SKETCHES[art]} width="100%" height="100%" />
      </View>
      <Text style={styles.eyebrow}>climbing.ge</Text>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.ink,
    borderRadius: RADII.xl,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    marginBottom: 22,
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  sketch: { position: 'absolute', right: -30, top: -4, width: 210, height: 126, opacity: 0.55 },
  eyebrow: { color: COLORS.hold, fontFamily: FONTS.bodyHeavy, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  title: { color: '#fff', fontFamily: FONTS.displayBold, fontSize: 32, lineHeight: 36, paddingRight: 70 },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontFamily: FONTS.bodyMedium, fontSize: 14, lineHeight: 20, marginTop: 6, paddingRight: 40 },
});
