import React, { useState, useEffect } from 'react';
import api, { corsUrl } from '../../utils/api';
import { StyleSheet, Text, View, ScrollView, FlatList, Alert } from 'react-native';

import  MountCard  from "../../components/cards/mount_route_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import Preloader from "../../components/Preloader";

export default function App() {
  const [mount_data, useData] = useState([])
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/mount_route/en'))
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
      data={mount_data}
      keyExtractor={(item) => item.global_data.id.toString()}
      ListHeaderComponent={
        <Article_list_header_text
          title="Mounain Climbing In Georgia"
          description="description 1"
        />
      }
      renderItem={({item}) => (
        <MountCard cardData={item} />
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
