import React, { useState } from 'react';
import axios from 'axios'

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  const [data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/siteData/get_site_locale_data/en')
    .then(({ data }) => {
      useData(data);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <View style={styles.container}>
      <Text>{data.global_data.email}</Text>
      <Text>{data.locale_data.guid_description}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
