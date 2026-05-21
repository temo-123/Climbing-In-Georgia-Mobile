import { StyleSheet, View, Alert, FlatList } from 'react-native';
import React, { useState, useEffect } from 'react';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';

import OutdoorCard from "../../components/cards/outdoor_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import RoutesQuantityText from "../../components/roures_quantyti_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";

export default function App() {
  const [outdoor_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const description = useSiteDescription('outdoor');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/outdoor/en'))
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch(error => {
        Alert.alert('ERROR!', error.message);
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
            description={description}
          />
          <RoutesQuantityText />
        </View>
      }
      renderItem={({ item }) => <OutdoorCard cardData={item} />}
      ListEmptyComponent={<EmptyState message={"No outdoor spots found.\nCheck back soon!"} />}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
