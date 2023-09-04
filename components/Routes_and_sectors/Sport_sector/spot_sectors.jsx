// https://github.com/dohooo/react-native-reanimated-table
import React, { useState, useEffect }  from "react";
import { StyleSheet, View, Text, Image } from "react-native";
import { Table, Row, Rows } from "react-native-reanimated-table";

import RoutesTable from "./routes_tab";
import { gStyle } from "../../../assets/styles/styles";
import axios from "axios";

// export default function articleBlock({local_data, global_data}) {
export default function SpotSectors({article_id}) {
  const [sportClimbingRoutes, setsportClimbingRoutes] = useState([]);
  const [sectorImages, setSectorImages] = useState([]);
  // constructor(props) {
  //   super(props);
  //   // this.state = {
  //   //   tableHead: ['id','name','height','grade_fr','grade_yds'],
  //   // }
  //   // this.tableData = [
  //   //   {id: 1, name: 'name 1', height: 30, grade_fr: '8a', grade_yds: '8a'},
  //   //   {id: 2, name: 'name 2', height: 23, grade_fr: '8a/8b', grade_yds: '8a'},
  //   //   {id: 3, name: 'name 3', height: 34, grade_fr: '8a', grade_yds: '8a'},
  //   //   {id: 4, name: 'name 4', height: 22, grade_fr: '8a/+', grade_yds: '8a'}
  //   // ]
  // }

  useEffect(() => {
    const baseUrl =
      "https://climbing.ge/api/sector/get_sector_and_routes/" + article_id;
      axios
        .get(baseUrl)
        .then(({ data }) => {
          console.log('====================================');
          console.log(baseUrl);
          console.log(data);
          console.log('====================================');
          setsportClimbingRoutes(data);
          setSectorImages(data);
        })
        .catch((error) => {
          Alert.alert("ERROR!", "Axios request is fale");
        })
        .finally(function () {
          // always executes at the last of any API call
        });
    }, []);

  // render(
    return (
      <View style={styles.container}>
        <View style={styles.sector_image_container}>
          <Text style={gStyle.h2}>sector name</Text>
          <Image
            style={styles.sector_image}
            source={require("../../../assets/images/ice.png/")}
          />
        </View>
        <Table borderStyle={{ borderWidth: 2, borderColor: "#c8e1ff" }}>
          <RoutesTable sector_id={333} />
        </Table>
      </View>
    );
  // }
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
