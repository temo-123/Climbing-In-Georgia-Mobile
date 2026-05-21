import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, FlatList } from 'react-native';
import api, { corsUrl } from '../../utils/api';
import { useSiteDescription } from '../../utils/useSiteData';

import MountCard from "../../components/cards/mount_route_card_component";
import Article_list_header_text from "../../components/article_list_header_text_component";
import EmptyState from "../../components/EmptyState";
import Preloader from "../../components/Preloader";

export default function App() {
  const [mount_data, setData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const description = useSiteDescription('mount_route');

  useEffect(() => {
    api.get(corsUrl('https://climbing.ge/api/get_article/get_locale_articles/mount_route/en'))
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
      data={mount_data}
      keyExtractor={(item) => item.global_data.id.toString()}
      ListHeaderComponent={
        <Article_list_header_text
          title="Mountain Climbing In Georgia"
          description={description}
        />
      }
      renderItem={({ item }) => <MountCard cardData={item} />}
      ListEmptyComponent={<EmptyState message={"No mountain routes found.\nCheck back soon!"} />}
      contentContainerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});
