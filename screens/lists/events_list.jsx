import React, { useState, useEffect } from 'react';
import api, { corsUrl } from '../../utils/api';
import { StyleSheet, Text, View, ScrollView, FlatList, Alert} from 'react-native';

import  EventCard  from "../../components/cards/event_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import Preloader from "../../components/Preloader";

export default function App() {
  const [event_data, useData] = useState([])
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_event/get_event_on_site_list/en'))
    .then(({ data }) => {
      useData(data);
      setLoading(false);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
      setLoading(false);
    })
  }, []);

  if (isLoading) return <Preloader />;

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
