import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';

import axios from 'axios'

import { OutdoorCard, Post } from "../../components/outdoor_card_component";
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
      <View style={styles.feed}>
        <OutdoorCard />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  feed: {
    flex: 1,
    margin: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
    padding: 16,
  },
})
