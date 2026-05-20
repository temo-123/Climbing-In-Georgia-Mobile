import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';

import  IceCard  from "../../components/cards/ice_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import Preloader from "../../components/Preloader";

export default function App() {
  const [ice_data, useData] = useState([])
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/ice/en'))
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
      data={ice_data}
      keyExtractor={(item) => item.global_data.id.toString()}
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
    padding: 16,
  },
});
