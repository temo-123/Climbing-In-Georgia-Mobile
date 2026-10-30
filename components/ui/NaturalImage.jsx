import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CachedImage from '../CachedImage';
import { COLORS, RADII } from '../../assets/styles/styles';

// Full-width photo at its own aspect ratio (the website shows sector and
// mountain-route topos uncropped, "natural shape"). Starts at 4:3 while
// loading, then snaps to the real ratio from expo-image's onLoad.
export default function NaturalImage({ uri, style, rounded = true }) {
  const [ratio, setRatio] = useState(4 / 3);
  return (
    <View style={[styles.frame, rounded && styles.rounded, { aspectRatio: ratio }, style]}>
      <CachedImage
        uri={uri}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        onLoad={(e) => {
          const w = e?.source?.width;
          const h = e?.source?.height;
          if (w > 0 && h > 0) setRatio(w / h);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', backgroundColor: COLORS.chalk2, overflow: 'hidden' },
  rounded: { borderRadius: RADII.md },
});
