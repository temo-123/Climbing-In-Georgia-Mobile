import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { gStyle } from '../../assets/styles/styles';

export default function articleGeneralInfo({global_info_data, actyve_block_data}) {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {(() => {
        if (
          (
            typeof global_info_data  !== 'undefined' || typeof global_info_data  !== [] || typeof global_info_data  !== {} 
          ) 
          && 
          (
            actyve_block_data  == null || actyve_block_data  == []
          ) ) 
        {
          if (global_info_data.block_action != 'instead' ){
              return (
                <View>
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: global_info_data.text }}
                  />
                </View>
              )
          }
          else if (global_info_data.block_action != 'befor' ){
              return (
                <View>
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  />
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: global_info_data.text }}
                  />
                </View>
              )
          }
          else if (global_info_data.block_action != 'after' ){
              return (
                <View>
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: global_info_data.text }}
                  />
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  />
                </View>
              )
          }
          else if (global_info_data.block_action != 'new_info' ){
              return (
                <View>
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  />
                </View>
              )
          }
          else{
              return (
                <View>
                  <RenderHtml
                    contentWidth={width}
                    source={{ html: actyve_block_data }}
                  />
                </View>
              )
          }
        }
        else  {
          return (
            <View>
              <RenderHtml
                contentWidth={width}
                source={{ html: actyve_block_data }}
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