import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  ScrollView,
} from "react-native";
import React, { useState, useEffect } from "react";

import SpotSectors from "../../components/Routes_and_sectors/Sport_sector/spot_sectors";
import ArticleBlock from "../../components/article/articl_block";

import api, { corsUrl } from "../../utils/api";

export default function App({ route }) {
  const [globalOtherData, setGlobalOtherData] = useState([]);
  const [localeOtherData, setLocaleOtherData] = useState([]);
  // let OtherData = []

  useEffect(() => {
    const baseUrl =
      corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/other/en/" + route.params);
    api
      .get(baseUrl)
      .then(({ data }) => {
        setGlobalOtherData(data);
        setLocaleOtherData(data.locale_data);
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
        local_data={localeOtherData}
        global_data={globalOtherData}
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
