import React, { useState } from 'react';
import axios from 'axios'
import { StyleSheet, Text, View, ScrollView, FlatList, Alert} from 'react-native';

import  EventCard  from "../../components/cards/event_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"

export default function App() {
  const [event_data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/event/get_event_on_site_list/en')
    .then(({ data }) => {
      useData(data);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <FlatList
      data={event_data}
      keyExtractor={(item) => item.global_event.id}
      ListHeaderComponent={
        <Article_list_header_text
          title="Events"
          description="Events description 1"
        />
      }
      renderItem={({item}) => (
        <EventCard cardData={item} />
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
