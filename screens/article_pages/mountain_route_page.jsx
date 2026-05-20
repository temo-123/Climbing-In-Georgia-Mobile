import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, ScrollView, Alert } from "react-native";
import api, { corsUrl } from "../../utils/api";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import MasiveDescription from "../../components/article/mount_masive/mount_masive_description_for_article_page_component";

export default function App({ route }) {
  const [globalIceData, setGlobalIceData] = useState([]);
  const [localeIceData, setLocaleIceData] = useState([]);
  const [globalIceInfoData, setGlobalIceInfoData] = useState([]);

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/mount_route/en/" + route.params))
      .then(function (data) {
        setGlobalIceData(data.data);
        setLocaleIceData(data.data.locale_data);
        setGlobalIceInfoData(data.data.general_info);
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
