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
import Preloader from "../../components/Preloader";

import api, { corsUrl } from "../../utils/api";

const IMG_BASE = "https://climbing.ge/public/images/other_img/";

export default function App({ route }) {
  const [globalOtherData, setGlobalOtherData] = useState({});
  const [localeOtherData, setLocaleOtherData] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl =
      corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/other/en/" + route.params);
    api
      .get(baseUrl)
      .then(({ data }) => {
        setGlobalOtherData(data);
        setLocaleOtherData(data.locale_data);
        setLoading(false);
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
        setLoading(false);
      });
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeOtherData}
        global_data={globalOtherData.global_data || {}}
        imgBase={IMG_BASE}
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
