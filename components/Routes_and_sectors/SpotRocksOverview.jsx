import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';

import ImageViewerModal from "../ImageViewerModal";
import CachedImage from "../CachedImage";
import { gStyle } from "../../assets/styles/styles";
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from "../../utils/api";
import { loadSpotRocksImagesData, saveSpotRocksImagesData } from "../../utils/offlineStorage";
import { useRefetchOnReconnect } from "../../utils/useRefetchOnReconnect";

const SPOT_ROCKS_IMG_BASE = IMG_BASES.spotRocks;

// The website's combined "whole spot" overview photo (every sector's box,
// label, connector line, POI marker and legend baked server-side into one
// flat image by the admin editor) — separate from each sub-area's own
// overview (SpotSectors/IceSectors' `local_images` branch) and from each
// sector's own topo image.
export default function SpotRocksOverview({ article_id, onImagePress }) {
  const { t } = useTranslation();
  const [images, setImages] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);

  const handleImagePress = (uris, idx) => {
    if (onImagePress) onImagePress(uris, idx);
    else setViewer({ uris, idx });
  };

  const load = useCallback(() => {
    if (!article_id) { setLoading(false); return; }
    api.get(corsUrl(`${API_BASE_URL}/get_sector/get_spot_rocks_images/${article_id}`))
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : [];
        setImages(list);
        saveSpotRocksImagesData(article_id, list);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadSpotRocksImagesData(article_id);
        if (Array.isArray(cached)) setImages(cached);
        setLoading(false);
      });
  }, [article_id]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useRefetchOnReconnect(load);

  if (isLoading || !article_id) return null;

  const items = [...images]
    .sort((a, b) => (a.num ?? Infinity) - (b.num ?? Infinity))
    .map((img) => ({ ...img, uri: imgUri(SPOT_ROCKS_IMG_BASE, img.image, img.updated_at) }))
    .filter((img) => img.uri);

  if (items.length === 0) return null;

  const uris = items.map((img) => img.uri);

  return (
    <View style={styles.container}>
      <Text style={gStyle.h2}>{t('spot_rocks_block.title')}</Text>

      {items.map((img, idx) => (
        <View key={img.id ?? idx}>
          {img.title ? <Text style={gStyle.h3}>{img.title}</Text> : null}
          <TouchableOpacity onPress={() => handleImagePress(uris, idx)}>
            <CachedImage uri={img.uri} style={styles.image} contentFit="contain" />
          </TouchableOpacity>
        </View>
      ))}

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
  container: { marginBottom: 24 },
  image: { height: 300, width: "100%", marginVertical: 8 },
});
