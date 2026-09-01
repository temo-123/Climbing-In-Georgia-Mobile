import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMapLocationDot, faCloudSun, faWifi } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

const renderers = { iframe: IframeRenderer };
const customHTMLElementModels = { iframe: iframeModel };

const TYPE_ICON = { map: faMapLocationDot, weather: faCloudSun };
const TYPE_MESSAGE_KEY = { map: 'embed.map_offline', weather: 'embed.weather_offline' };

// Renders HTML that may contain iframes (maps, weather widgets) at a correct,
// screen-fitting size. Pass `height` to control the container (default 280).
// Pass `padding` to subtract any extra horizontal padding from the container.
// Pass `type` ('map' | 'weather') so the offline fallback banner can name
// what failed to load, instead of showing the WebView's raw Chromium error page.
export default function EmbedBlock({ html, height = 280, padding = 32, type }) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const [failed, setFailed] = useState(false);
  const contentWidth = width - padding;

  if (!html) return null;

  if (failed) {
    return (
      <View style={[styles.errorContainer, { height }]}>
        <FontAwesomeIcon icon={TYPE_ICON[type] || faWifi} size={22} color="#7a5c00" />
        <Text style={styles.errorText}>
          {t(TYPE_MESSAGE_KEY[type] || 'embed.offline')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <RenderHtml
        contentWidth={contentWidth}
        computeEmbeddedMaxWidth={(cw) => cw}
        source={{ html, baseUrl: 'https://climbing.ge/' }}
        renderers={renderers}
        WebView={WebView}
        customHTMLElementModels={customHTMLElementModels}
        defaultWebViewProps={{
          onError: () => setFailed(true),
          onHttpError: () => setFailed(true),
        }}
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
  errorContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 8,
    marginVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  errorText: {
    fontSize: 13,
    color: '#7a5c00',
    fontWeight: '500',
    flexShrink: 1,
    textAlign: 'center',
  },
});
