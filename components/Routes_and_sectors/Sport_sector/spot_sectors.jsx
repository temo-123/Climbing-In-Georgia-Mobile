import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, Image, Alert } from "react-native";

import RoutesTable from "./items/routes_tab";
import MultiPitchTab from "./items/multi_pitch_tab";
import SectorInfoBar from "./items/sector_info_bar";
import { gStyle } from "../../../assets/styles/styles";
import api, { corsUrl, imgUri } from "../../../utils/api";

const SECTOR_IMG_BASE = "https://climbing.ge/public/images/sector_img/";
const LOCAL_IMG_BASE  = "https://climbing.ge/public/images/sector_local_img/";

// Renders one sector block: images + sport routes + multi-pitch routes
function SectorItem({ item }) {
  const sector = item.sector;
  const images = item.sector_imgs || [];
  const sportRoutes = item.sport_routes || [];
  const mtps = item.mtps || [];

  return (
    <View style={styles.sectorBlock}>
      {sector?.name ? <Text style={gStyle.h3}>{sector.name}</Text> : null}

      <SectorInfoBar sector={sector} />

      {images.map((img) => (
        <Image
          key={img.id}
          source={{ uri: imgUri(SECTOR_IMG_BASE, img.image) }}
          style={styles.sectorImage}
          resizeMode="contain"
        />
      ))}

      {sportRoutes.length > 0 && <RoutesTable routes={sportRoutes} />}
      {mtps.length > 0 && <MultiPitchTab mtps={mtps} />}
    </View>
  );
}

export default function SpotSectors({ article_id }) {
  const [sectors, setSectors] = useState([]);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl = corsUrl(
      "https://climbing.ge/api/get_sector/get_sector_and_routes/" + article_id
    );
    api
      .get(baseUrl)
      .then(({ data }) => {
        setSectors(data);
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

  if (sectors.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={gStyle.h2}>Sectors</Text>

      {sectors.map((item, index) => {
        // Type B: sub-area with overview local_images grouping multiple sectors
        if (item.local_images) {
          return (
            <View key={index}>
              {/* Sub-area overview images */}
              {item.local_images.map((localImg) => (
                <View key={localImg.id}>
                  {localImg.title ? (
                    <Text style={gStyle.h3}>{localImg.title}</Text>
                  ) : null}
                  <Image
                    source={{ uri: imgUri(LOCAL_IMG_BASE, localImg.image) }}
                    style={styles.sectorImage}
                    resizeMode="contain"
                  />
                </View>
              ))}

              {/* Sectors belonging to this sub-area */}
              {(item.sectors || []).map((subItem, subIdx) => (
                <SectorItem
                  key={subItem.sector?.id || subIdx}
                  item={subItem}
                />
              ))}
            </View>
          );
        }

        // Type A: direct sector item
        return <SectorItem key={item.sector?.id || index} item={item} />;
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
