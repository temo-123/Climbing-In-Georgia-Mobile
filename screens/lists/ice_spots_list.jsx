import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import axios from 'axios'

import  IceCard  from "../../components/cards/ice_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"

export default function App() {
  const [ice_data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/articles/ice/en')
    .then(({ data }) => {
      useData(data);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <FlatList
      data={ice_data}
      keyExtractor={(item) => item[0][0].id}
      ListHeaderComponent={
        <Article_list_header_text
          title="Ice Climbing In Georgia"
          description="description 1"
        />
      }
      renderItem={({item}) => (
        <IceCard cardData={item} />
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
});
