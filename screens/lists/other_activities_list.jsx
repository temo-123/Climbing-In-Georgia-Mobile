import React, { useState } from 'react';
import axios  from 'axios'
import { StyleSheet, Text, View, ScrollView, FlatList} from 'react-native';

import  OtherActivity  from "../../components/cards/other_activity_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"

export default function App() {
  const [other_data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/articles/other/en')
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
        title="Other Activity In Georgia" 
        description="Other activity description 1"
      />
      <View style={styles.container}>
        {/* <OtherActivity /> */}
        <FlatList data={other_data} renderItem={({item}) => (
          <OtherActivity cardData={item} />
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
