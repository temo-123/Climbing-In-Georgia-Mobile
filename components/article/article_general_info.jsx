import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';

import { gStyle } from '../../assets/styles/styles';

export default function articleGeneralInfo({global_info_data, actyve_block_data}) {
  const { width } = useWindowDimensions();
  const renderers = {
    iframe: IframeRenderer
  };
  
  const customHTMLElementModels = {
    iframe: iframeModel
  };
  return (
    <View style={styles.container}>
      {(() => {
        if (
          (
            // typeof global_info_data  !== 'undefined' || typeof global_info_data  !== [] || typeof global_info_data  !== {} 
            typeof global_info_data  !== 'undefined'  
          ) 
          && 
          (
            actyve_block_data  == null || actyve_block_data  == []
          ) ) 
        {
          if (global_info_data.block_action != 'instead' ){
              return (
                <View>
                  {/* <RenderHtml
                    contentWidth={width}
                    source={{ html: global_info_data.text }}
                  /> */}
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: global_info_data.text }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                </View>
              )
          }
          else if (global_info_data.block_action != 'befor' ){
              return (
                <View>
                  {/* <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  />
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: global_info_data.text }}
                  /> */}
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: actyve_block_data }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: global_info_data.text }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                </View>
              )
          }
          else if (global_info_data.block_action != 'after' ){
              return (
                <View>
                  {/* <RenderHtml
                    contentWidth={width}
                    source={{ html: global_info_data.text }}
                  />
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  /> */}
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: global_info_data.text }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: actyve_block_data }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                </View>
              )
          }
          else if (global_info_data.block_action != 'new_info' ){
              return (
                <View>
                  {/* <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  /> */}
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: actyve_block_data }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                </View>
              )
          }
          else{
              return (
                <View>
                  {/* <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  /> */}
                  <RenderHtml
                    contentWidth={width}
                    renderers={renderers}
                    WebView={WebView}
                    source={{ html: actyve_block_data }}
                    customHTMLElementModels={customHTMLElementModels}
                    defaultWebViewProps={
                      {
                        /* Any prop you want to pass to all WebViews */
                      }
                    }
                    renderersProps={{
                      iframe: {
                        scalesPageToFit: true,
                        webViewProps: {
                          /* Any prop you want to pass to iframe WebViews */
                        }
                      }
                    }}
                  />
                </View>
              )
          }
        }
        else  {
          return (
            <View>
              {/* <RenderHtml
                contentWidth={width}
                source={{ html: actyve_block_data }}
              /> */}
              <RenderHtml
                contentWidth={width}
                renderers={renderers}
                WebView={WebView}
                source={{ html: actyve_block_data }}
                customHTMLElementModels={customHTMLElementModels}
                defaultWebViewProps={
                  {
                    /* Any prop you want to pass to all WebViews */
                  }
                }
                renderersProps={{
                  iframe: {
                    scalesPageToFit: true,
                    webViewProps: {
                      /* Any prop you want to pass to iframe WebViews */
                    }
                  }
                }}
              />
            </View>
          )
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