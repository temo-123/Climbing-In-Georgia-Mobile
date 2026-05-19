// https://github.com/dohooo/react-native-reanimated-table
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList, Alert } from "react-native";
import { Table, Row, Rows } from "react-native-reanimated-table";

import AutoHeightImage from 'react-native-auto-height-image';

import RoutesTable from "./items/ice_routes_tab";
import { gStyle } from "../../../assets/styles/styles";
import axios from "axios";

export default function iceSectors({article_id}) {
  const [iceSectors, setIceSectors] = useState({})
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl =
      "https://climbing.ge/api/ice_sectors/get_article_sectors/" + article_id;
    // console.log("🚀 ~ file: ice_sectors.jsx:18 ~ useEffect ~ baseUrl:", baseUrl)
    axios
      .get(baseUrl)
      .then(({ data }) => {
        // console.log("🚀 ~ file: spot_sectors.jsx:21 ~ .then ~ data:", data)
        setIceSectors(data);
        setLoading(false);
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // always executes at the last of any API call
      });
  }, []);

  if(iceSectors == [] && !isLoading){
    return(
      <View style={styles.container}>
        <Text>Loading sectors</Text>
      </View>
    )
  }

  console.log("🚀 ~ file: ice_sectors.jsx:43 ~ iceSectors ~ iceSectors:", iceSectors)

  return(
      <View style={styles.container}>
        <Text style={gStyle.h2}>Sectors</Text>
        {iceSectors.map((sector) => {
          return (
            <View>
              <Text style={gStyle.h3}>{sector.name}</Text>
              {sector.images.map((sector_img) => {
                let act_img = "https://climbing.ge/public/images/ice_sector_img/"+sector_img.image
                
                return (
                  <AutoHeightImage
                    source={{
                      uri: act_img,
                      method: 'POST',
                      headers: {
                        Pragma: 'no-cache',
                      },
                      body: sector.name,
                    }}
                    style={styles.sector_image}

                    resizeMode="contain"
                  />
                )
              })}

              <Table borderStyle={{ borderWidth: 2, borderColor: "#c8e1ff" }}>
                <RoutesTable routes={sector.routes} />
              </Table>
            </View>
          )
        })}
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
  },
  sector_title: {
    fontSize: 24,
  },
  sector_image: {
    height: 300,
    flex: 1,
    width: null
  },
});
