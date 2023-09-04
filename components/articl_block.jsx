import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { gStyle } from '../assets/styles/styles';

export default function articleBlock({local_data, global_data}) {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>

      <Text style={gStyle.h1}>{local_data.title}</Text>



      {(() => {
        if (local_data.text != '' || local_data.text != null){
            return (
              <View>
                
                <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.text }}
                />

              </View>
            )
        }
        
        return null;
      })()}
      
      {(() => {
        if (local_data.how_get_there != '' || local_data.how_get_there != null){
            return (
              <View>
                
                <Text style={gStyle.h2}>How to get there</Text>

                <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.how_get_there }}
                />

                <Text>Map</Text>

              </View>
            )
        }
        
        return null;
      })()}

      
      {(() => {
        if (local_data.best_time != '' || local_data.best_time != null){
            return (
              <View>
                
                <Text style={gStyle.h2}>Best time to climb</Text>

                <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.best_time }}
                />

              </View>
            )
        }
        
        return null;
      })()}


      {(() => {
        if (local_data.what_need != '' || local_data.what_need != null){
            return (
              <View>
                
                <Text style={gStyle.h2}>What you need</Text>

                <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.what_need }}
                />

                <Text>Wethet</Text>

              </View>
            )
        }
        
        return null;
      })()}


      {(() => {
        if (local_data.info != '' || local_data.info != null){
            return (
              <View>
                
                <Text style={gStyle.h2}>Info / Contacts</Text>

                <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.info }}
                />

              </View>
            )
        }
        
        return null;
      })()}


      {(() => {
        if (local_data.routes != '' || local_data.routes != null){
            return (
              <View>
                <Text style={gStyle.h2}>Routes</Text>

                <RenderHtml
                  contentWidth={width}
                  source={{ html: local_data.routes }}
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