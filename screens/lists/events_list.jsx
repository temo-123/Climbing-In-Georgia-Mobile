import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';

import EventCard from "../../components/cards/event_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";

export default function App() {
  const [event_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const description = useSiteDescription('events');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_event/get_event_on_site_list/en'))
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('ERROR!', 'Failed to load data');
        setLoading(false);
      });
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <FlatList
      data={event_data}
      keyExtractor={(item) => item.global_event.id.toString()}
      ListHeaderComponent={
        <Article_list_header_text
          title="Events & Competitions"
          description={description}
        />
      }
      renderItem={({ item }) => <EventCard cardData={item} />}
      ListEmptyComponent={<EmptyState message={"No events at the moment.\nCheck back soon!"} />}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
