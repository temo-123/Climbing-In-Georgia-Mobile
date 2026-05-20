import React, { useState, useEffect } from 'react';
import api, { corsUrl } from '../../utils/api';
import { StyleSheet, Text, View, ScrollView, FlatList, Alert} from 'react-native';

import  OtherActivity  from "../../components/cards/other_activity_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
import Preloader from "../../components/Preloader";

export default function App() {
  const [other_data, useData] = useState([])
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/other/en'))
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
      data={other_data}
      keyExtractor={(item) => item.global_data.id.toString()}
      ListHeaderComponent={
        <Article_list_header_text
          title="Other Activity In Georgia"
          description="Other activity description 1"
        />
      }
      renderItem={({item}) => (
        <OtherActivity cardData={item} />
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
