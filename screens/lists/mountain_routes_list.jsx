import React, { useState } from 'react';
import axios from 'axios'
import { StyleSheet, Text, View, ScrollView, FlatList } from 'react-native';

import  MountCard  from "../../components/cards/mount_route_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
 
export default function App() {
  const [mount_data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/articles/mount_route/en')
    .then(({ data }) => {
      useData(data);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Article_list_header_text 
        title="Mounain Climbing In Georgia" 
        description="description 1"
      />
      <View style={styles.container}>
        {/* <MountCard /> */}
        <FlatList data={mount_data} renderItem={({item}) => (
          <MountCard cardData={item} />
        )} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
