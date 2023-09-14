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
import ArticleBlock from "../../components/article/articl_block";

import axios from "axios";

export default function App({ route }) {
  const [globalIndoorData, setGlobalIndoorData] = useState([]);
  const [localeIndoorData, setLocaleIndoorData] = useState([]);
  const [globalIndoorInfoData, setGlobalIndoorInfoData] = useState([]);
  // let IndoorData = []

  useEffect(() => {
    const baseUrl =
      "https://climbing.ge/api/article/indoor/us/" + route.params;
    axios
      .get(baseUrl)
      .then(({ data }) => {
        setGlobalIndoorData(data);
        setLocaleIndoorData(data[0]);
        setGlobalIndoorInfoData(data.global_info);
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
      <ArticleBlock
        local_data={localeIndoorData}
        global_data={globalIndoorData}
        global_info_data={globalIndoorInfoData}
      />

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
