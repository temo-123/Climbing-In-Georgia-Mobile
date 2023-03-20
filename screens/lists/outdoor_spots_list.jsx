import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Alert } from 'react-native';

import axios from 'axios'

import { Post } from "../../components/outdoor_card_component";
import React from 'react';

export default function App() {
  const [items, setItems] = React.useState();

  React.useEffect(() => {
    axios
    .get('https://climbing.loc/api/articles/outdoor/en')
    .then(({ data }) => {
      setItems(data);
    })
    .catch(error => {
      console.log(error);
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <View>

      {items.map((obj) => (
        <Post 
          title="test 1" 
          imageUrl="https://picsum.photos/id/237/200/300" 
          createdAt="20/20/02" 
        />
      ))}


    </View>
  );
}
