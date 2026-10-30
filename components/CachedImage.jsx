import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { resolveImageUri } from '../utils/imageCache';
import { SKETCHES } from './ui/sketches';
import { COLORS } from '../assets/styles/styles';

// The website's image-area fallback (imageFallback.js): no stock "no image"
// picture — a chalk frame with a faint ink pencil sketch.
const FALLBACK_XML = SKETCHES.mountains.replace(/#fff\b/g, COLORS.ink);

// Always loads from the remote URI. Falls back to the local file cache when
// the network request fails (i.e. the device is offline), and to the chalk
// sketch frame when there's no URI at all, or nothing to fall back to.
export default function CachedImage({ uri, style, contentFit, ...props }) {
  const [src, setSrc] = useState(uri);
  const [failed, setFailed] = useState(!uri);

  useEffect(() => {
    setSrc(uri);
    setFailed(!uri);
  }, [uri]);

  const handleError = useCallback(async () => {
    const resolved = await resolveImageUri(uri);
    if (resolved && resolved !== src) {
      setSrc(resolved);
    } else {
      setFailed(true);
    }
  }, [uri, src]);

  if (failed) {
    // Keyed separately from the uri branch below, so the native image view
    // is unmounted rather than re-used for a different kind of content.
    return (
      <View key="placeholder" style={[style, fallback.frame]}>
        <View style={fallback.sketch}>
          <SvgXml xml={FALLBACK_XML} width="100%" height="100%" />
        </View>
      </View>
    );
  }

  return (
    <Image
      key="remote"
      source={{ uri: src }}
      style={style}
      contentFit={contentFit}
      onError={handleError}
      {...props}
    />
  );
}

const fallback = StyleSheet.create({
  frame: { backgroundColor: COLORS.chalk2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sketch: { width: '70%', maxWidth: 260, aspectRatio: 300 / 180, opacity: 0.18 },
});
