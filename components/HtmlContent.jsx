import React, { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { resolveHtmlImageUris } from '../utils/imageCache';
import { COLORS } from '../assets/styles/styles';

// Shared typography for HTML coming from the site's editor (Quill, older
// texts from CKEditor). Inline `style="color/background-color"` from the
// editor still applies on top of these — only the defaults are set here.
const BASE_STYLE = { fontSize: 15, lineHeight: 22, color: '#222' };

const DEFAULT_TAGS_STYLES = {
  p: { marginTop: 0, marginBottom: 8 },
  h1: { fontSize: 22, fontWeight: '700', marginTop: 8, marginBottom: 8, lineHeight: 28 },
  h2: { fontSize: 19, fontWeight: '700', marginTop: 8, marginBottom: 8, lineHeight: 26 },
  h3: { fontSize: 17, fontWeight: '700', marginTop: 6, marginBottom: 6, lineHeight: 24 },
  h4: { fontSize: 15, fontWeight: '700', marginTop: 4, marginBottom: 4 },
  strong: { fontWeight: '700' },
  b: { fontWeight: '700' },
  a: { color: COLORS.primary, textDecorationLine: 'none' },
  ol: { marginTop: 0, marginBottom: 8, paddingLeft: 20 },
  ul: { marginTop: 0, marginBottom: 8, paddingLeft: 20 },
  li: { marginBottom: 4 },
  blockquote: {
    marginVertical: 8, marginHorizontal: 0, paddingLeft: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.primary, color: '#555', fontStyle: 'italic',
  },
};

// Quill 2 inserts `<span class="ql-ui" contenteditable="false">` into every
// list item as an editor-only marker — it is never content.
function ignoreDomNode(node) {
  return node?.attribs?.class === 'ql-ui';
}

// Wraps RenderHtml, pre-resolving any <img src="..."> in the HTML to its
// locally cached file when one exists (downloaded during offline sync), so
// inline body images — not just header/gallery images — still render while
// offline instead of just not appearing.
//
// `contentWidth` defaults to the screen minus the standard 16px page padding
// on each side; pass it explicitly when the container is narrower.
export default function HtmlContent({ html, contentWidth, tagsStyles, baseStyle, ...renderHtmlProps }) {
  const { width } = useWindowDimensions();
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
  return (
    <RenderHtml
      source={{ html: resolvedHtml, baseUrl: 'https://climbing.ge/' }}
      contentWidth={contentWidth ?? width - 32}
      baseStyle={{ ...BASE_STYLE, ...baseStyle }}
      tagsStyles={{ ...DEFAULT_TAGS_STYLES, ...tagsStyles }}
      ignoreDomNode={ignoreDomNode}
      {...renderHtmlProps}
    />
  );
}
