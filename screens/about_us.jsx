import React, { useState } from 'react';
import axios from 'axios'
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { gStyle } from '../assets/styles/styles';

// import { GoogleAnalyticsTracker } from "react-native-google-analytics-bridge";
// let tracker = new GoogleAnalyticsTracker("5206567952");
 
// tracker.trackScreenView("About us");
// tracker.trackEvent("testcategory", "testaction");

export default function App() {
  const [aboutUsData, setAboutUsData] = useState({'global_data': [], 'locale_data': []})

  // let about_us_info =[]

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/siteData/get_site_locale_data/en')
    .then(({ data }) => {
      setAboutUsData(data);

    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Text style={gStyle.h1}>About us</Text>
      
      <Text>{aboutUsData.locale_data.guid_description}</Text>

      <Text>{aboutUsData.global_data.email}</Text>
      <Text>{aboutUsData.global_data.number}</Text>

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
