import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { resolveImageUri } from '../utils/imageCache';

// Always loads from the remote URI. Falls back to the local file cache only
// when the network request fails (i.e. the device is offline).
export default function CachedImage({ uri, style, contentFit, ...props }) {
  const [src, setSrc] = useState(uri);

  useEffect(() => {
    setSrc(uri);
  }, [uri]);

  const handleError = useCallback(async () => {
    const resolved = await resolveImageUri(uri);
    if (resolved && resolved !== uri) setSrc(resolved);
  }, [uri]);

  return (
    <Image
      source={{ uri: src }}
      style={style}
      contentFit={contentFit}
      onError={handleError}
      {...props}
    />
  );
}
