import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, Alert } from "react-native";

import IceRoutesTable from "./items/ice_routes_tab";
import { gStyle } from "../../../assets/styles/styles";
import api, { corsUrl, imgUri } from "../../../utils/api";

const ICE_IMG_BASE = "https://climbing.ge/public/images/sector_img/";

export default function IceSectors({ article_id }) {
  const [iceSectors, setIceSectors] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl = corsUrl(
      "https://climbing.ge/api/get_sector/get_sector_and_routes/" + article_id
    );
    api
      .get(baseUrl)
      .then(({ data }) => {
        setIceSectors(data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert("ERROR!", "Failed to load sectors");
        setLoading(false);
      });
  }, [article_id]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Loading sectors...</Text>
      </View>
    );
  }

  if (iceSectors.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={gStyle.h2}>Sectors</Text>

      {iceSectors.map((item, index) => {
        const sector = item.sector;
        const images = item.sector_imgs || [];
        const routes = item.sport_routes || [];

        return (
          <View key={sector?.id || index} style={styles.sectorBlock}>
            {sector?.name ? <Text style={gStyle.h3}>{sector.name}</Text> : null}

            {images.map((img, imgIdx) => (
              <Image
                key={img.id || imgIdx}
                source={{ uri: imgUri(ICE_IMG_BASE, img.image) }}
                style={styles.sectorImage}
                resizeMode="contain"
              />
            ))}

            <IceRoutesTable routes={routes} />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 50,
  },
  sectorBlock: {
    marginBottom: 24,
  },
  sectorImage: {
    height: 300,
    width: "100%",
    marginVertical: 8,
  },
});
