import { StyleSheet, View, useWindowDimensions } from 'react-native';
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import HtmlContent from '../HtmlContent';

const renderers = { iframe: IframeRenderer };
const customHTMLElementModels = { iframe: iframeModel };
const renderersProps = {
  iframe: {
    scalesPageToFit: true,
    webViewProps: {},
  },
};

export default function articleGeneralInfo({ global_info_data, actyve_block_data }) {
  const { width } = useWindowDimensions();

  function Html({ html }) {
    return (
      <HtmlContent
        html={html}
        contentWidth={width}
        renderers={renderers}
        WebView={WebView}
        customHTMLElementModels={customHTMLElementModels}
        defaultWebViewProps={{}}
        renderersProps={renderersProps}
      />
    );
  }

  return (
    <View style={styles.container}>
      {(() => {
        if (
          typeof global_info_data !== 'undefined'
          && (actyve_block_data == null || actyve_block_data == [])
        ) {
          if (global_info_data.block_action != 'instead') {
            return (
              <View>
                <Html html={global_info_data.text} />
              </View>
            );
          }
          else if (global_info_data.block_action != 'befor') {
            return (
              <View>
                <Html html={actyve_block_data} />
                <Html html={global_info_data.text} />
              </View>
            );
          }
          else if (global_info_data.block_action != 'after') {
            return (
              <View>
                <Html html={global_info_data.text} />
                <Html html={actyve_block_data} />
              </View>
            );
          }
          else if (global_info_data.block_action != 'new_info') {
            return (
              <View>
                <Html html={actyve_block_data} />
              </View>
            );
          }
          else {
            return (
              <View>
                <Html html={actyve_block_data} />
              </View>
            );
          }
        }
        else {
          return (
            <View>
              <Html html={actyve_block_data} />
            </View>
          );
        }
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // padding: '2%',
    // alignItems: 'center',
  },
  page_header_title: {
    fontSize: 20,
  },
  page_heheader_text: {
    fontSize: 12,
    paddingTop: '2%',
  },
  horizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 26
  },
  horizontal_line: {
    flex: 1,
    height: 1,
    backgroundColor: '#000'
  }
});
