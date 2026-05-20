import React, { useState } from 'react';
import api, { corsUrl } from '../utils/api';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, Alert } from 'react-native';
import { gStyle } from '../assets/styles/styles';
import Preloader from '../components/Preloader';

export default function App() {
  const [aboutUsData, setAboutUsData] = useState([]);
  const [isLoading, setLoading] = useState(true);

  React.useEffect(() => {
    api
    .get(corsUrl('https://climbing.ge/api/get_site_data/get_site_locale_data/en'))
    .then(({ data }) => {
      setAboutUsData(data);
      setLoading(false);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale');
      setLoading(false);
    })
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Text style={gStyle.h1}>About us</Text>

      <Text>{aboutUsData.find(item => item.slug === 'guid_description')?.us_data}</Text>

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
