import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';

import IceCard from "../../components/cards/ice_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import IceRoutesQuantityText from "../../components/ice_routes_quantyti_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";

export default function App() {
  const [ice_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const description = useSiteDescription('ice');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/ice/en'))
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('ERROR!', 'Failed to load ice data');
        setLoading(false);
      });
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <FlatList
      data={ice_data}
      keyExtractor={(item) => item.global_data.id.toString()}
      ListHeaderComponent={
        <View>
          <Article_list_header_text
            title="Ice Climbing In Georgia"
            description={description}
          />
          <IceRoutesQuantityText />
        </View>
      }
      renderItem={({ item }) => <IceCard cardData={item} />}
      ListEmptyComponent={<EmptyState message={"No ice climbing spots found.\nCheck back soon!"} />}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
