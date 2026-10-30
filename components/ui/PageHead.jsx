import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, useWindowDimensions } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import HtmlContent from '../HtmlContent';
import { SKETCHES } from './sketches';
import { useReducedMotion } from './useReducedMotion';
import { COLORS, FONTS, HEAD_COLORS, RADII, SHADOWS } from '../../assets/styles/styles';

const leadBaseStyle = { fontSize: 14, lineHeight: 21, color: 'rgba(255,255,255,0.85)', fontFamily: FONTS.bodyMedium };
const leadTagsStyles = { p: { marginTop: 0, marginBottom: 6 }, a: { color: COLORS.hold } };

// The website's `.cg-page-head.cg-page-head--list.cg-art-<name>`: a flat
// colour band with one pencil sketch of the page topic hanging on the right
// and swaying slowly. `lead` may be plain text or HTML (site descriptions
// come from the CMS as HTML).
export default function PageHead({ art = 'quickdraw', title, lead, icon, children }) {
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sway, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion]);

  const rotate = sway.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '2deg'] });
  const isHtml = typeof lead === 'string' && /<[a-z][\s\S]*>/i.test(lead);

  return (
    <View style={[styles.band, { backgroundColor: HEAD_COLORS[art] ?? COLORS.primary }]}>
      {!!SKETCHES[art] && (
        <Animated.View pointerEvents="none" style={[styles.sketch, { transform: [{ rotate }] }]}>
          <SvgXml xml={SKETCHES[art]} width="100%" height="100%" />
        </Animated.View>
      )}
      <View style={styles.content}>
        {!!icon && (
          <View style={styles.iconTile}>
            <FontAwesomeIcon icon={icon} size={22} color={COLORS.hold} />
          </View>
        )}
        <Text style={styles.title}>{title}</Text>
        {!!lead && (isHtml ? (
          <View style={styles.leadWrap}>
            <HtmlContent html={lead} contentWidth={width - 80} baseStyle={leadBaseStyle} tagsStyles={leadTagsStyles} />
          </View>
        ) : (
          <Text style={[leadBaseStyle, styles.leadWrap]}>{lead}</Text>
        ))}
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  band: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginBottom: 16,
    minHeight: 132,
    justifyContent: 'center',
    ...SHADOWS.md,
  },
  sketch: {
    position: 'absolute',
    right: -18,
    top: 0,
    bottom: 0,
    width: 200,
    opacity: 0.6,
  },
  content: { paddingRight: 72 },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 32,
    lineHeight: 36,
    color: '#fff',
  },
  leadWrap: { marginTop: 8 },
});
