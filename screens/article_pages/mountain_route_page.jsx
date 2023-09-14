import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, ScrollView } from "react-native";
import axios from "axios";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import MasiveDescription from "../../components/article/mount_masive/mount_masive_description_for_article_page_component";

export default function App({ route }) {
  const [globalIceData, setGlobalIceData] = useState([]);
  const [localeIceData, setLocaleIceData] = useState([]);
  const [globalIceInfoData, setGlobalIceInfoData] = useState([]);

  useEffect(() => {
    axios
      .get("https://climbing.ge/api/article/mount_route/en/" + route.params)
      .then(function (data) {
        setGlobalIceData(data.data);
        setLocaleIceData(data.data[0]);
        setGlobalIceInfoData(data.data.global_info);
      })
      .catch((error) => {
        console.log(error);
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
      <MasiveDescription article_id={route.params} />

      <ArticleBlock
        local_data={localeIceData}
        global_data={globalIceData}
        global_info_data={globalIceInfoData}
      />

      <IceSectors article_id={route.params} />

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
