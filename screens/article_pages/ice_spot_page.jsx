import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import Preloader from "../../components/Preloader";

import api, { corsUrl } from "../../utils/api";

export default function App({ route }) {
  // console.log("🚀 ~ file: ice_spot_page.jsx:28 ~ //getData ~ route.params:", route.params)
  const [globalIceData, setGlobalIceData] = useState({});
  const [localeIceData, setLocaleIceData] = useState({});
  const [globalIceInfoData, setGlobalIceInfoData] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/ice/en/" + route.params))
      .then(({ data }) => {
        setGlobalIceData(data);
        setLocaleIceData(data.locale_data || {});
        setGlobalIceInfoData(data.general_info || {});
        setLoading(false);
      })
      .catch(() => {
        Alert.alert("ERROR!", "Failed to load article");
      });
  }, []);

  if (isLoading) return <Preloader />;

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeIceData}
        global_data={globalIceData.global_data || {}}
        global_info_data={globalIceInfoData}
      />

      <IceSectors article_id={globalIceData.global_data?.id} />

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
