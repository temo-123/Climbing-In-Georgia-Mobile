import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { gStyle } from '../../assets/styles/styles';

import GlobalInfoBlock from "./article_general_info";

import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
// import RenderHTML from 'react-native-render-html';
import WebView from 'react-native-webview';

export default function articleBlock({local_data, global_data, global_info_data = []}) {
  const { width } = useWindowDimensions();
  const renderers = {
    iframe: IframeRenderer
  };
  
  const customHTMLElementModels = {
    iframe: iframeModel
  };
  
  return (
    <View style={styles.container}>

      <Text style={gStyle.h1}>{local_data.title}</Text>

      {(() => {
        if (local_data.text != '' && local_data.text != null){
            return (
              <View>
                
                {/* <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.text }}
                /> */}
                <RenderHtml
                  contentWidth={width}
                  renderers={renderers}
                  WebView={WebView}
                  source={{ html: local_data.text }}
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
        
        return null;
      })()}
      
      {(() => {
        if (local_data.how_get != '' && local_data.how_get != null){
            return (
              <View>
                <Text style={gStyle.h2}>How to get there</Text>

                {/* <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.how_get }}
                /> */}
                <RenderHtml
                  contentWidth={width}
                  renderers={renderers}
                  WebView={WebView}
                  source={{ html: local_data.how_get }}
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
        
        return null;
      })()}

      {(() => {
        if (global_data.map != '' && global_data.map != null){
            return (
              <View>
                {/* https://www.npmjs.com/package/@native-html/iframe-plugin */}
                <RenderHtml
                  contentWidth={width}
                  renderers={renderers}
                  WebView={WebView}
                  source={{ html: global_data.map }}
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
        
        return null;
      })()}

      {(() => {
        if ((local_data.best_time != '' && local_data.best_time != null) || typeof global_info_data.best_time  !== 'undefined'){
            return (
              <View>
                <Text style={gStyle.h2}>Best time to climb</Text>

                <GlobalInfoBlock 
                  global_info_data={global_info_data.best_time}
                  actyve_block_data={local_data.best_time}
                />

              </View>
            )
        }
        
        return null;
      })()}
 
      {(() => {
        if (global_data.weather != '' && global_data.weather != null){
            return (
              <View>
                {/* https://www.npmjs.com/package/@native-html/iframe-plugin */}
                <RenderHtml
                  contentWidth={width}
                  renderers={renderers}
                  WebView={WebView}
                  source={{ html: global_data.weather }}
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
        
        return null;
      })()}


      {(() => {
        if ((local_data.what_need != '' && local_data.what_need != null) || typeof global_info_data.what_need_info  !== 'undefined'){
            return (
              <View>
                
                <Text style={gStyle.h2}>What you need</Text>

                <GlobalInfoBlock 
                  global_info_data={global_info_data.what_need_info}
                  actyve_block_data={local_data.what_need}
                />

              </View>
            )
        }
        
        return null;
      })()}


      {(() => {
        if ((local_data.info != '' && local_data.info != null) || typeof global_info_data.info_block  !== 'undefined'){
            return (
              <View>
                
                <Text style={gStyle.h2}>Info / Contacts</Text>

                <GlobalInfoBlock 
                  global_info_data={global_info_data.info_block}
                  actyve_block_data={local_data.info}
                />

              </View>
            )
        }
        
        return null;
      })()}


      {(() => {
        if ((local_data.routes != '' && local_data.routes != null) || typeof global_info_data.routes_info  !== 'undefined'){
            return (
              <View>
                <Text style={gStyle.h2}>Routes</Text>

                <GlobalInfoBlock 
                  global_info_data={global_info_data.routes_info}
                  actyve_block_data={local_data.routes}
                />

              </View>
            )
        }
        
        return null;
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