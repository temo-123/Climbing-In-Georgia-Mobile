import React, { useState, useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { resolveHtmlImageUris } from '../utils/imageCache';
import { COLORS, FONTS } from '../assets/styles/styles';

// Shared typography for HTML coming from the site's editor (Quill, older
// texts from CKEditor). Inline `style="color/background-color"` from the
// editor still applies on top of these — only the defaults are set here.
// Custom fonts can't be bolded by the OS on Android, so bold tags switch
// family instead of setting fontWeight; RenderHtml only applies families
// listed in `systemFonts`.
const BASE_STYLE = { fontSize: 15, lineHeight: 23, color: COLORS.ink2, fontFamily: FONTS.body };
const SYSTEM_FONTS = Object.values(FONTS);

const DEFAULT_TAGS_STYLES = {
  p: { marginTop: 0, marginBottom: 8 },
  h1: { fontSize: 26, fontFamily: FONTS.displayBold, fontWeight: 'normal', color: COLORS.ink, marginTop: 8, marginBottom: 8, lineHeight: 30 },
  h2: { fontSize: 22, fontFamily: FONTS.displayBold, fontWeight: 'normal', color: COLORS.ink, marginTop: 8, marginBottom: 8, lineHeight: 26 },
  h3: { fontSize: 19, fontFamily: FONTS.displayBold, fontWeight: 'normal', color: COLORS.ink, marginTop: 6, marginBottom: 6, lineHeight: 23 },
  h4: { fontSize: 15, fontFamily: FONTS.bodyBold, fontWeight: 'normal', marginTop: 4, marginBottom: 4 },
  strong: { fontFamily: FONTS.bodyBold, fontWeight: 'normal' },
  b: { fontFamily: FONTS.bodyBold, fontWeight: 'normal' },
  a: { color: COLORS.primary, fontFamily: FONTS.bodyBold, textDecorationLine: 'none' },
  ol: { marginTop: 0, marginBottom: 8, paddingLeft: 20 },
  ul: { marginTop: 0, marginBottom: 8, paddingLeft: 20 },
  li: { marginBottom: 4 },
  blockquote: {
    marginVertical: 8, marginHorizontal: 0, paddingLeft: 12,
    borderLeftWidth: 3, borderLeftColor: COLORS.hold, color: COLORS.stone, fontStyle: 'italic',
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
      systemFonts={SYSTEM_FONTS}
      {...renderHtmlProps}
    />
  );
}
