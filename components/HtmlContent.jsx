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

  // Embedded iframe src attributes are sometimes protocol-relative
  // (e.g. "//if-cdn.com/..."). Without a baseUrl, RenderHtml/URI.js can't
  // resolve a scheme, so the WebView gets handed a scheme-less URL and fails
  // with net::ERR_INVALID_URL — passing baseUrl lets it resolve to https://.
  return <RenderHtml source={{ html: resolvedHtml, baseUrl: 'https://climbing.ge/' }} {...renderHtmlProps} />;
}
