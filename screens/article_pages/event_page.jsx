import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, ScrollView, Alert } from "react-native";
import api, { corsUrl } from "../../utils/api";

import ArticleBlock from "../../components/article/articl_block";

export default function App({ route }) {
  const [globalEventData, setGlobalEventData] = useState([]);
  const [localeEventData, setLocaleEventData] = useState([]);
  const [globalEventInfoData, setGlobalEventInfoData] = useState([]);

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_event/get_event_on_site_page/en/" + route.params))
      .then(function (data) {
        setGlobalEventData(data.data);
        setLocaleEventData(data.data.locale_data);
        setGlobalEventInfoData(data.data.general_info);
      })
      .catch((error) => {
        console.log(error);
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // alert("Finally called");
      });
  }, []);

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeEventData}
        global_data={globalEventData}
        global_info_data={globalEventInfoData}
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
