import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity, FlatList} from 'react-native';

import api, { corsUrl } from '../../utils/api';

import  OutdoorCard  from "../../components/cards/outdoor_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import  Route_quantntyti  from "../../components/roures_quantyti_text_component"
import Preloader from "../../components/Preloader";

import React, { useState, useEffect } from 'react';

export default function App() {
  const [outdoor_data, useData] = useState([])
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api
    .get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/outdoor/en'))
    .then(({ data }) => {
      useData(data);
      setLoading(false);
    })
    .catch(error => {
      console.log('Outdoor API error:', error.message, error.response?.status, error.config?.url);
      Alert.alert('ERROR!', error.message)
      setLoading(false);
    });
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <FlatList
      data={outdoor_data}
      keyExtractor={(item) => item.global_data.id.toString()}
      ListHeaderComponent={
        <View>
          <Article_list_header_text
            title="Outdoor Climbing In Georgia"
            description="description 1"
          />
          <Route_quantntyti />
        </View>
      }
      renderItem={({item}) => (
        <OutdoorCard cardData={item} />
      )}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
})
