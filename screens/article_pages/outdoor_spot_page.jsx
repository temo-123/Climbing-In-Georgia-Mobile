import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  WebView,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";

import SpotSectors from "../../components/Routes_and_sectors/Sport_sector/spot_sectors";
import ArticleBlock from "../../components/articl_block";

import axios from "axios";

export default function App({ route }) {
  const [globalOutdoorData, setGlobalOutdoorData] = useState([]);
  const [localeOutdoorData, setLocaleOutdoorData] = useState([]);
  // let outdoorData = []

  useEffect(() => {
    const baseUrl =
      "https://climbing.ge/api/article/indoor/en/" + route.params;
    axios
      .get(baseUrl)
      .then(({ data }) => {
        setGlobalOutdoorData(data);
        setLocaleOutdoorData(data[0]);
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // always executes at the last of any API call
      });
  }, []);

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock local_data={localeOutdoorData} global_data={globalOutdoorData} />

      <SpotSectors article_id={globalOutdoorData.id} />

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
