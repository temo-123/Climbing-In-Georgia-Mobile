import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import CachedImage from '../CachedImage';
import EmbedBlock from '../EmbedBlock';
import HtmlContent from '../HtmlContent';
import { gStyle } from '../../assets/styles/styles';
import { useTranslation } from 'react-i18next';

import GlobalInfoBlock from "./article_general_info";

import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import { imgUri } from '../../utils/api';

const iframeConfig = {
  renderers: { iframe: IframeRenderer },
  customHTMLElementModels: { iframe: iframeModel },
  defaultWebViewProps: { onError: () => {}, onHttpError: () => {} },
  renderersProps: {
    iframe: {
      scalesPageToFit: true,
      webViewProps: {},
    },
  },
};

export default function articleBlock({ local_data, global_data, global_info_data = [], imgBase = null, afterImageContent = null, headerUri = null }) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();

  function HtmlBlock({ html }) {
    return (
      <HtmlContent
        html={html}
        contentWidth={width}
        renderers={iframeConfig.renderers}
        WebView={WebView}
        customHTMLElementModels={iframeConfig.customHTMLElementModels}
        defaultWebViewProps={iframeConfig.defaultWebViewProps}
        renderersProps={iframeConfig.renderersProps}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={gStyle.h1}>{local_data.title}</Text>

      {(headerUri || (imgBase != null && global_data.image)) ? (
        <CachedImage
          uri={headerUri || imgUri(imgBase, global_data.image)}
          style={styles.headerImage}
          contentFit="cover"
        />
      ) : null}

      {afterImageContent}

      {local_data.text ? (
        <View><HtmlBlock html={local_data.text} /></View>
      ) : null}

      {(local_data.how_get || typeof global_info_data.how_get !== 'undefined') ? (
        <View>
          <Text style={gStyle.h2}>{t('article.how_to_get')}</Text>
          <HtmlBlock html={local_data.how_get} />
        </View>
      ) : null}

      {global_data.map ? (
        <EmbedBlock html={global_data.map} height={280} type="map" />
      ) : null}

      {(local_data.best_time || typeof global_info_data.best_time !== 'undefined') ? (
        <View>
          <Text style={gStyle.h2}>{t('article.best_time')}</Text>
          <GlobalInfoBlock
            global_info_data={global_info_data.best_time}
            actyve_block_data={local_data.best_time}
          />
        </View>
      ) : null}

      {global_data.weather ? (
        <EmbedBlock html={global_data.weather} height={220} type="weather" />
      ) : null}

      {(local_data.what_need || typeof global_info_data.what_need_info !== 'undefined') ? (
        <View>
          <Text style={gStyle.h2}>{t('article.what_need')}</Text>
          <GlobalInfoBlock
            global_info_data={global_info_data.what_need_info}
            actyve_block_data={local_data.what_need}
          />
        </View>
      ) : null}

      {(local_data.info || typeof global_info_data.info_block !== 'undefined') ? (
        <View>
          <Text style={gStyle.h2}>{t('article.info_contacts')}</Text>
          <GlobalInfoBlock
            global_info_data={global_info_data.info_block}
            actyve_block_data={local_data.info}
          />
        </View>
      ) : null}

      {(() => {
        const routeText = local_data.route || local_data.routes;
        if (routeText || typeof global_info_data.routes_info !== 'undefined') {
          return (
            <View>
              <Text style={gStyle.h2}>{t('article.routes')}</Text>
              <GlobalInfoBlock
                global_info_data={global_info_data.routes_info}
                actyve_block_data={routeText}
              />
            </View>
          );
        }
        return null;
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  headerImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    marginVertical: 12,
  },
});
