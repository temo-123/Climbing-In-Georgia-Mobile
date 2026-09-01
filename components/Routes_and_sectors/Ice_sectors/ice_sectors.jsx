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
  const [viewer, setViewer] = useState(null);

  const handleImagePress = (uris, idx) => {
    if (onImagePress) onImagePress(uris, idx);
    else setViewer({ uris, idx });
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
        const routes = item.sport_routes || [];
        const sectorImages = (item.sector_imgs || [])
          .map((img, imgIdx) => ({ key: img.id || imgIdx, uri: imgUri(ICE_IMG_BASE, img.image) }))
          .filter((img) => img.uri);
        const sectorUris = sectorImages.map((img) => img.uri);

        return (
          <View key={sector?.id || index} style={styles.sectorBlock}>
            {sector?.name ? <Text style={gStyle.h3}>{sector.name}</Text> : null}

            {sectorImages.map((img, imgIdx) => (
              <TouchableOpacity key={img.key} onPress={() => handleImagePress(sectorUris, imgIdx)}>
                <CachedImage uri={img.uri} style={styles.sectorImage} contentFit="contain" />
              </TouchableOpacity>
            ))}

            <IceRoutesTable routes={routes} />
          </View>
        );
      })}

      {!onImagePress && (
        <ImageViewerModal
          uris={viewer?.uris}
          initialIndex={viewer?.idx ?? 0}
          visible={viewer != null}
          onClose={() => setViewer(null)}
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
