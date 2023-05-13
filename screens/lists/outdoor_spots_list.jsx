import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';

import axios from 'axios'

import { OutdoorCard } from "../../components/cards/outdoor_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import  Route_quantntyti  from "../../components/roures_quantyti_text_component"

import React from 'react';

export default function App() {
  // const [items, setItems] = React.useState();

  // React.useEffect(() => {
  //   axios
  //   .get('https://climbing.loc/api/articles/outdoor/en')
  //   .then(({ data }) => {
  //     setItems(data);
  //   })
  //   .catch(error => {
  //     console.log(error);
  //     Alert.alert('ERROR!', 'Axios request is fale')
  //   })
  // }, []);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Article_list_header_text 
        title="Outdoor Climbing In Georgia" 
        description="description 1"
      />
      <Route_quantntyti />
      <View style={styles.container}>
        <OutdoorCard />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
