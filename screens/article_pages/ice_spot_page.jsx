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
  // console.log("🚀 ~ file: ice_spot_page.jsx:28 ~ //getData ~ route.params:", route.params)
  const [globalIceData, setGlobalIceData] = useState([]);
  const [localeIceData, setLocaleIceData] = useState([]);
  const [globalIceInfoData, setGlobalIceInfoData] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // const getData = () => {
    axios
      .get("https://climbing.ge/api/article/ice/en/" + route.params)
      .then(function (data) {
        setGlobalIceData(data.data);
        setLocaleIceData(data.data[0]);
        setGlobalIceInfoData(data.data.global_info);
        setLoading(false);
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

  if(isLoading){
    return(
      <View style={styles.container}>
        <Text>Loading</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* <ArticleBlock
        local_data={localeIceData}
        global_data={globalIceData}
        global_info_data={globalIceInfoData}
      /> */}

      <IceSectors article_id={globalIceData.id} />

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
