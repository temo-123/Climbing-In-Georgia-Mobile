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

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/Ice_sectors";

import axios from "axios";

export default function App({ route }) {
  const [ice_data, setIceData] = useState([]);

  useEffect(() => {
    // const getData = () => {
    axios
      .get("https://climbing.ge/api/article/ice/en/" + route.params)
      .then(function (data) {
        setIceData(data);
        // console.log("====================================");
        // console.log(ice_data);
        // console.log("====================================");
      })
      .catch((error) => {
        console.log(error);
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        alert("Finally called");
      });
    // };

    // getData()
  }, []);

  return (
    <ScrollView style={styles.container}>
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
  // h1: {
  //   fontSize: 26
  // },
  // h2: {
  //   fontSize: 20
  // }
});
