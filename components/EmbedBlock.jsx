import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';

const renderers = { iframe: IframeRenderer };
const customHTMLElementModels = { iframe: iframeModel };
const webViewProps = { onError: () => {}, onHttpError: () => {} };

// Renders HTML that may contain iframes (maps, weather widgets) at a correct,
// screen-fitting size. Pass `height` to control the container (default 280).
// Pass `padding` to subtract any extra horizontal padding from the container.
export default function EmbedBlock({ html, height = 280, padding = 32 }) {
  const { width } = useWindowDimensions();
  const contentWidth = width - padding;

  if (!html) return null;

  return (
    <View style={[styles.container, { height }]}>
      <RenderHtml
        contentWidth={contentWidth}
        computeEmbeddedMaxWidth={(cw) => cw}
        source={{ html }}
        renderers={renderers}
        WebView={WebView}
        customHTMLElementModels={customHTMLElementModels}
        defaultWebViewProps={webViewProps}
        renderersProps={{
          iframe: {
            scalesPageToFit: true,
            webViewProps: {
              style: { width: contentWidth, height },
              containerStyle: { width: contentWidth, height },
            },
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: '#f4f4f4',
  },
});
