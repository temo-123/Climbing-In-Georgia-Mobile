import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';

import RoutesTable from "./items/routes_tab";
import MultiPitchTab from "./items/multi_pitch_tab";
import SectorInfoBar from "./items/sector_info_bar";
import ImageViewerModal from "../../ImageViewerModal";
import CachedImage from "../../CachedImage";
import { gStyle } from "../../../assets/styles/styles";
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from "../../../utils/api";
import { loadSectorsData, saveSectorsData } from "../../../utils/offlineStorage";

const SECTOR_IMG_BASE = IMG_BASES.sector;
const LOCAL_IMG_BASE  = IMG_BASES.sectorLocal;

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
            <CachedImage uri={uri} style={styles.sectorImage} contentFit="contain" />
          </TouchableOpacity>
        );
      })}

      {sportRoutes.length > 0 && <RoutesTable routes={sportRoutes} />}
      {mtps.length > 0 && <MultiPitchTab mtps={mtps} />}
    </View>
  );
}

export default function SpotSectors({ article_id, onImagePress }) {
  const { t } = useTranslation();
  const [sectors, setSectors] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [viewerUri, setViewerUri] = useState(null);

  const handleImagePress = (uri) => {
    if (onImagePress) onImagePress(uri);
    else setViewerUri(uri);
  };

  useEffect(() => {
    if (!article_id) { setLoading(false); return; }
    api.get(corsUrl(`${API_BASE_URL}/get_sector/get_sector_and_routes/${article_id}`))
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
        <Text>{t('sectors_block.loading')}</Text>
      </View>
    );
  }

  if (sectors.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={gStyle.h2}>{t('sectors_block.title')}</Text>

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
                        <CachedImage uri={uri} style={styles.sectorImage} contentFit="contain" />
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
  container: { paddingBottom: 50 },
  sectorBlock: { marginBottom: 24 },
  sectorImage: { height: 300, width: "100%", marginVertical: 8 },
});
