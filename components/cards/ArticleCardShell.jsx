import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import CachedImage from '../CachedImage';
import Chip from '../ui/Chip';
import { stripHtml } from '../../utils/text';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// Shared markup of the website's guide cards (ArticleCardComponent,
// OutdoorCardComponent, MountCardComponent): a 16:9 photo frame
// (`.cg-card-media`) with a round arrow button, then title, short text and
// chips. The whole card is the tap target.
//
// `chips` = [{ label, icon?, tone? }]; `mediaOverlay` renders over the photo
// (ribbons, date tags); `topRight` sits in the photo's top-right corner
// (favourite heart); `children` go under the chips.
export default function ArticleCardShell({
  imageUri,
  title,
  text,
  chips,
  onPress,
  mediaOverlay,
  topRight,
  imageFit = 'cover',
  children,
}) {
  const plain = stripHtml(text);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.media}>
        <CachedImage uri={imageUri} style={styles.image} contentFit={imageFit} />
        {mediaOverlay}
        <View style={styles.arrow}>
          <FontAwesomeIcon icon={faArrowRight} size={13} color={COLORS.primary} />
        </View>
        {!!topRight && <View style={styles.topRight}>{topRight}</View>}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {!!plain && <Text style={styles.text} numberOfLines={2}>{plain}</Text>}
        {!!chips?.length && (
          <View style={styles.chips}>
            {chips.map((c, i) => <Chip key={i} small {...c} />)}
          </View>
        )}
        {children}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.lg,
    marginBottom: 16,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: COLORS.chalk2,
  },
  image: { width: '100%', height: '100%' },
  arrow: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  topRight: { position: 'absolute', top: 10, right: 10 },
  body: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14, gap: 6 },
  title: {
    fontFamily: FONTS.displayBold,
    fontSize: 22,
    lineHeight: 26,
    color: COLORS.ink,
  },
  text: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
});
