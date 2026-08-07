import React, { useState, useEffect } from 'react';
import RenderHtml from 'react-native-render-html';
import { resolveHtmlImageUris } from '../utils/imageCache';

// Wraps RenderHtml, pre-resolving any <img src="..."> in the HTML to its
// locally cached file when one exists (downloaded during offline sync), so
// inline body images — not just header/gallery images — still render while
// offline instead of just not appearing.
export default function HtmlContent({ html, ...renderHtmlProps }) {
  const [resolvedHtml, setResolvedHtml] = useState(html);

  useEffect(() => {
    let alive = true;
    setResolvedHtml(html);
    resolveHtmlImageUris(html).then((resolved) => {
      if (alive) setResolvedHtml(resolved);
    });
    return () => {
      alive = false;
    };
  }, [html]);

  if (!html) return null;

  return <RenderHtml source={{ html: resolvedHtml }} {...renderHtmlProps} />;
}
