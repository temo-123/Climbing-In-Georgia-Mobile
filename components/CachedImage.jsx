import React, { useState, useEffect, useCallback } from 'react';
import { Image } from 'expo-image';
import { resolveImageUri } from '../utils/imageCache';

const NO_IMAGE = require('../assets/images/no_image.png');

// Always loads from the remote URI. Falls back to the local file cache when
// the network request fails (i.e. the device is offline), and to a "no
// image" placeholder — matching the one the website shows for articles
// with no image on the server — when there's no URI at all, or nothing to
// fall back to.
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
    return <Image source={NO_IMAGE} style={style} contentFit={contentFit} {...props} />;
  }

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
