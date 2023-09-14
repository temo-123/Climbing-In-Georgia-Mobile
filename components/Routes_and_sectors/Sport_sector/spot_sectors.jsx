// https://github.com/dohooo/react-native-reanimated-table
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList } from "react-native";
import { Table, Row, Rows } from "react-native-reanimated-table";

import RoutesTable from "./items/routes_tab";
import { gStyle } from "../../../assets/styles/styles";
import axios from "axios";

// export default function articleBlock({local_data, global_data}) {
export default function SpotSectors({ article_id }) {
  const [sectors, setSector] = useState([]);

  useEffect(() => {
    const baseUrl =
      "https://climbing.ge/api/sector/get_sector_and_routes/" + article_id;
    axios
      .get(baseUrl)
      .then(({ data }) => {
        setSector(data);
        console.log("🚀 ~ file: spot_sectors.jsx:21 ~ .then ~ data:", data)
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // always executes at the last of any API call
      });
  }, []);
  // console.log("====================================");
  // // console.log(sectors);
  // console.log("🚀 ~ file: spot_sectors.jsx:31 ~ SpotSectors ~ sectors:", sectors)
  // console.log("====================================");
  return (
    <View style={styles.container}>
      {/* <Text>{item.sector.name}</Text> */}
          {/* <Text>sususu</Text> */}
      <FlatList
        data={sectors}
        renderItem={({ item }) => {
          <Text>sususu</Text>
          if (1==1) {
            <Text>images</Text>;
            // render area_sectors.jsx
          } else {
            <Text>{item.sector.name}</Text>;
            // render sectors.jsx
          }
        }}
      />
    </View>
  );
}
// <View style={styles.container}>
//     <View style={styles.sector_image_container}>
//       <Text style={gStyle.h2}>sector name</Text>
//       <Image
//         style={styles.sector_image}
//         source={require("../../../assets/images/ice.png/")}
//       />
//     </View>
//     <Table borderStyle={{ borderWidth: 2, borderColor: "#c8e1ff" }}>
//       <RoutesTable sector_id={333} />
//     </Table>
// </View>

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
