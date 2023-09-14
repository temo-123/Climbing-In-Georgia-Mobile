import React, { useState, useEffect } from "react";
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

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";

import axios from "axios";

export default function App({ route }) {
  const [globalIceData, setGlobalIceData] = useState([]);
  const [localeIceData, setLocaleIceData] = useState([]);
  const [globalIceInfoData, setGlobalIceInfoData] = useState([]);

  useEffect(() => {
    // const getData = () => {
    axios
      .get("https://climbing.ge/api/article/ice/en/" + route.params)
      .then(function (data) {
        setGlobalIceData(data.data);
        setLocaleIceData(data.data[0]);
        setGlobalIceInfoData(data.data.global_info);
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // alert("Finally called");
      });
    // };

    // getData()
  }, []);

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeIceData}
        global_data={globalIceData}
        global_info_data={globalIceInfoData}
      />

      <IceSectors article_id={route.params} />

      <Text>test ice</Text>

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
