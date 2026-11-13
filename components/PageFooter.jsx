import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../assets/styles/styles';

// The website footer: brand grey #484848 with a mountain skyline rising out
// of it. Bottom padding keeps the text clear of the floating donation button.
// `bleed` = the parent's horizontal/bottom padding, so the band reaches the
// screen edges and the very bottom. It always stretches to the full width,
// also inside a parent with `alignItems: 'center'` (where it used to shrink
// to its text and draw a narrow, off-centre band). `style` for extra layout,
// e.g. marginTop: 'auto' to sit at the bottom of a short page.
export default function PageFooter({ bleed = 16, style }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.wrap, { marginHorizontal: -bleed, marginBottom: -bleed }, style]}>
      <Svg width="100%" height={46} viewBox="0 0 400 46" preserveAspectRatio="none">
        <Path
          d="M0 46 L0 34 L38 20 L64 30 L104 6 L140 28 L172 16 L214 34 L252 12 L282 24 L318 2 L352 26 L378 18 L400 28 L400 46 Z"
          fill={COLORS.footer}
        />
        <Path d="M104 6 L112 11 L100 12 Z M318 2 L328 8 L312 9 Z" fill="#fff" fillOpacity={0.55} />
      </Svg>
      <View style={styles.band}>
        <View style={styles.rope}>
          <View style={styles.ropeAccent} />
          <View style={styles.ropeHold} />
        </View>
        <Text style={styles.text}>{t('footer')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 24, alignSelf: 'stretch' },
  band: {
    backgroundColor: COLORS.footer,
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 110,
    marginTop: -1,
  },
  rope: { flexDirection: 'row', width: 48, height: 3, marginBottom: 10 },
  ropeAccent: { width: '72%', height: 3, borderRadius: 3, backgroundColor: COLORS.primary },
  ropeHold: { width: '22%', height: 3, borderRadius: 3, backgroundColor: COLORS.hold, marginLeft: '6%' },
  text: {
    fontSize: 12,
    fontFamily: FONTS.bodySemi,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },
});
