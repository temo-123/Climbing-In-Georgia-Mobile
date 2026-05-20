// https://github.com/dohooo/react-native-reanimated-table
import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, FlatList, Alert } from "react-native";
import { Table, Row, Rows } from "react-native-reanimated-table";

import RoutesTable from "./items/routes_tab";
import { gStyle } from "../../../assets/styles/styles";
import api, { corsUrl } from "../../../utils/api";

export default function spotSectors({article_id}) {
  const [sectors, setSector] = useState([])
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl = corsUrl("https://climbing.ge/api/get_sector/get_sector_and_routes/" + article_id);
    api
      .get(baseUrl)
      .then(({ data }) => {
        setSector(data);
        setLoading(false);
      })
      .catch((error) => {
        Alert.alert("ERROR!", "Axios request is fale");
      })
      .finally(function () {
        // always executes at the last of any API call
      });
  }, []);

  if(sectors.length === 0 && !isLoading){
    return(
      <View style={styles.container}>
        <Text>Loading sectors</Text>
      </View>
    )
  }
  
  return(
      <View style={styles.container}>
        <Text style={gStyle.h2}>Sectors</Text>
        {sectors.map((sector) => {
          return (
            <View>
              <Text style={gStyle.h3}>{sector.sector?.name}</Text>
              {sector.sector_imgs?.map((sector_img) => {
                let act_img = "https://climbing.ge/public/images/sector_img/"+sector_img.image
                
                return (
                  <Image
                    source={{
                      uri: act_img
                    }}
                    style={styles.sector_image}
                    resizeMode="contain"
                  />
                  // <AutoHeightImage
                  //   width={100}
                  //   source={{uri: 'http://placehold.it/350x150'}}
                  // />
                )
              })}

              <Table borderStyle={{ borderWidth: 2, borderColor: "#c8e1ff" }}>
                <RoutesTable routes={sector.sport_routes} />
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
    width: '100%',
  },
});
