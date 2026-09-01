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
  const sportRoutes = item.sport_routes || [];
  const mtps = item.mtps || [];
  const sectorImages = (item.sector_imgs || [])
    .map((img) => ({ key: img.id, uri: imgUri(SECTOR_IMG_BASE, img.image) }))
    .filter((img) => img.uri);
  const sectorUris = sectorImages.map((img) => img.uri);

  return (
    <View style={styles.sectorBlock}>
      {sector?.name ? <Text style={gStyle.h3}>{sector.name}</Text> : null}

      <SectorInfoBar sector={sector} />

      {sectorImages.map((img, idx) => (
        <TouchableOpacity key={img.key} onPress={() => onImagePress(sectorUris, idx)}>
          <CachedImage uri={img.uri} style={styles.sectorImage} contentFit="contain" />
        </TouchableOpacity>
      ))}

      {sportRoutes.length > 0 && <RoutesTable routes={sportRoutes} />}
      {mtps.length > 0 && <MultiPitchTab mtps={mtps} />}
    </View>
  );
}

export default function SpotSectors({ article_id, onImagePress }) {
  const { t } = useTranslation();
  const [sectors, setSectors] = useState([]);
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
          const localImages = (item.local_images || [])
            .map((li) => ({ ...li, uri: imgUri(LOCAL_IMG_BASE, li.image) }))
            .filter((li) => li.uri);
          const localUris = localImages.map((li) => li.uri);

          return (
            <View key={index}>
              {localImages.map((localImg, idx) => (
                <View key={localImg.id}>
                  {localImg.title ? (
                    <Text style={gStyle.h3}>{localImg.title}</Text>
                  ) : null}
                  <TouchableOpacity onPress={() => handleImagePress(localUris, idx)}>
                    <CachedImage uri={localImg.uri} style={styles.sectorImage} contentFit="contain" />
                  </TouchableOpacity>
                </View>
              ))}
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
