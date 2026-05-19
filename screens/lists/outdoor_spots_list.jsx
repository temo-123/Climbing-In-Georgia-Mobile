import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity, FlatList} from 'react-native';

import axios from 'axios'

import  OutdoorCard  from "../../components/cards/outdoor_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import  Route_quantntyti  from "../../components/roures_quantyti_text_component"

import React, { useState } from 'react';

export default function App() {
  const [outdoor_data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/articles/outdoor/en')
    .then(({ data }) => {
      useData(data);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
    .finally(function() {
      // always executes at the last of any API call
    });
  }, []);

  return (
    <FlatList
      data={outdoor_data}
      keyExtractor={(item) => item.area.id}
      ListHeaderComponent={
        <View>
          <Article_list_header_text
            title="Outdoor Climbing In Georgia"
            description="description 1"
          />
          <Route_quantntyti />
        </View>
      }
      renderItem={({item}) => (
        <OutdoorCard cardData={item} />
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
