// https://github.com/dohooo/react-native-reanimated-table
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList } from "react-native";
import { Table, Row, Rows } from "react-native-reanimated-table";

import IceRoutesTable from "./items/ice_routes_tab";
import { gStyle } from "../../../assets/styles/styles";
import axios from "axios";

// export default function articleBlock({local_data, global_data}) {
export default function SpotSectors({ article_id }) {
  const [sectors, setSector] = useState([]);

  useEffect(() => {
    const baseUrl =
      "https://climbing.ge/api/ice_sectors/get_article_sectors/" + article_id;
    axios
      .get(baseUrl)
      .then(({ data }) => {
        setSector(data);
        // console.log("🚀 ~ file: spot_sectors.jsx:21 ~ .then ~ data:", data)
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // always executes at the last of any API call
      });
  }, []);
  
  return (
    <View style={styles.container}>
      <Text>ice sector</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    // flexDirection: 'row',
    // flexWrap: 'wrap',
    paddingBottom: 50,
    // marginBottoma: 160,
    // justifyContent: 'space-around'
  },
  sector_title: {
    fontSize: 24,
    // margin: 6,
  },
  sector_image: {
    width: "100%",
    borderRadius: 10,
    resizeMode: "contain",
  },
});
