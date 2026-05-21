import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";

import RoutesTable from "./items/routes_tab";
import MultiPitchTab from "./items/multi_pitch_tab";
import SectorInfoBar from "./items/sector_info_bar";
import ImageViewerModal from "../../ImageViewerModal";
import { gStyle } from "../../../assets/styles/styles";
import api, { corsUrl, imgUri } from "../../../utils/api";
import { loadSectorsData, saveSectorsData } from "../../../utils/offlineStorage";

const SECTOR_IMG_BASE = "https://climbing.ge/public/images/sector_img/";
const LOCAL_IMG_BASE  = "https://climbing.ge/public/images/sector_local_img/";

function SectorItem({ item, onImagePress }) {
  const sector = item.sector;
  const images = item.sector_imgs || [];
  const sportRoutes = item.sport_routes || [];
  const mtps = item.mtps || [];

  return (
    <View style={styles.sectorBlock}>
      {sector?.name ? <Text style={gStyle.h3}>{sector.name}</Text> : null}

      <SectorInfoBar sector={sector} />

      {images.map((img) => {
        const uri = imgUri(SECTOR_IMG_BASE, img.image);
        if (!uri) return null;
        return (
          <TouchableOpacity key={img.id} onPress={() => onImagePress(uri)}>
            <Image
              source={{ uri }}
              style={styles.sectorImage}
              contentFit="contain"
            />
          </TouchableOpacity>
        );
      })}

      {sportRoutes.length > 0 && <RoutesTable routes={sportRoutes} />}
      {mtps.length > 0 && <MultiPitchTab mtps={mtps} />}
    </View>
  );
}

export default function SpotSectors({ article_id, onImagePress }) {
  const [sectors, setSectors] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [viewerUri, setViewerUri] = useState(null);

  const handleImagePress = (uri) => {
    if (onImagePress) {
      onImagePress(uri);
    } else {
      setViewerUri(uri);
    }
  };

  useEffect(() => {
    if (!article_id) { setLoading(false); return; }
    api.get(corsUrl("https://climbing.ge/api/get_sector/get_sector_and_routes/" + article_id))
      .then(({ data }) => {
        setSectors(data);
        saveSectorsData(article_id, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadSectorsData(article_id);
        if (cached) setSectors(cached);
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
        if (item.local_images) {
          return (
            <View key={index}>
              {item.local_images.map((localImg) => {
                const uri = imgUri(LOCAL_IMG_BASE, localImg.image);
                return (
                  <View key={localImg.id}>
                    {localImg.title ? (
                      <Text style={gStyle.h3}>{localImg.title}</Text>
                    ) : null}
                    {uri ? (
                      <TouchableOpacity onPress={() => handleImagePress(uri)}>
                        <Image
                          source={{ uri }}
                          style={styles.sectorImage}
                          contentFit="contain"
                        />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                );
              })}

              {(item.sectors || []).map((subItem, subIdx) => (
                <SectorItem
                  key={subItem.sector?.id || subIdx}
                  item={subItem}
                  onImagePress={handleImagePress}
                />
              ))}
            </View>
          );
        }

        return (
          <SectorItem
            key={item.sector?.id || index}
            item={item}
            onImagePress={handleImagePress}
          />
        );
      })}

      {/* Standalone modal for when no parent viewer is provided */}
      {!onImagePress && (
        <ImageViewerModal
          uri={viewerUri}
          visible={viewerUri != null}
          onClose={() => setViewerUri(null)}
        />
      )}
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
