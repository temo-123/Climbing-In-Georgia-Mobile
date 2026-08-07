import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';

import IceRoutesTable from "./items/ice_routes_tab";
import ImageViewerModal from "../../ImageViewerModal";
import CachedImage from "../../CachedImage";
import { gStyle } from "../../../assets/styles/styles";
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from "../../../utils/api";
import { loadSectorsData, saveSectorsData } from "../../../utils/offlineStorage";

const ICE_IMG_BASE = IMG_BASES.sector;

export default function IceSectors({ article_id, onImagePress }) {
  const { t } = useTranslation();
  const [iceSectors, setIceSectors] = useState([]);
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
        setIceSectors(data);
        saveSectorsData(article_id, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadSectorsData(article_id);
        if (cached) setIceSectors(cached);
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

  if (iceSectors.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={gStyle.h2}>{t('sectors_block.title')}</Text>

      {iceSectors.map((item, index) => {
        const sector = item.sector;
        const images = item.sector_imgs || [];
        const routes = item.sport_routes || [];

        return (
          <View key={sector?.id || index} style={styles.sectorBlock}>
            {sector?.name ? <Text style={gStyle.h3}>{sector.name}</Text> : null}

            {images.map((img, imgIdx) => {
              const uri = imgUri(ICE_IMG_BASE, img.image);
              if (!uri) return null;
              return (
                <TouchableOpacity key={img.id || imgIdx} onPress={() => handleImagePress(uri)}>
                  <CachedImage uri={uri} style={styles.sectorImage} contentFit="contain" />
                </TouchableOpacity>
              );
            })}

            <IceRoutesTable routes={routes} />
          </View>
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
