import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../utils/LocaleContext';

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import ImageViewerModal from "../../components/ImageViewerModal";
import CachedImage from "../../components/CachedImage";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import { gStyle } from "../../assets/styles/styles";

import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";

const GALLERY_BASE = IMG_BASES.gallery;
const IMG_BASE = IMG_BASES.ice;

export default function App({ route }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [globalIceData, setGlobalIceData] = useState({});
  const [localeIceData, setLocaleIceData] = useState({});
  const [globalIceInfoData, setGlobalIceInfoData] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_article_on_page/ice/${locale}/` + route.params))
      .then(({ data }) => {
        setGlobalIceData(data);
        setLocaleIceData(data.locale_data || {});
        setGlobalIceInfoData(data.general_info || {});
        saveArticleData('ice', route.params, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadArticleData('ice', route.params);
        if (cached) {
          setGlobalIceData(cached);
          setLocaleIceData(cached.locale_data || {});
          setGlobalIceInfoData(cached.general_info || {});
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }, [locale]);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  const galleryUris = (globalIceData.gallery_images || [])
    .map(img => imgUri(GALLERY_BASE, img.image))
    .filter(Boolean);

  function openGallery(uri) {
    const idx = galleryUris.indexOf(uri);
    setViewer({ uris: galleryUris, idx: Math.max(0, idx) });
  }

  function openSectorImage(uri) {
    const idx = galleryUris.indexOf(uri);
    if (idx >= 0) setViewer({ uris: galleryUris, idx });
    else setViewer({ uris: [uri], idx: 0 });
  }

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeIceData}
        global_data={globalIceData.global_data || {}}
        global_info_data={globalIceInfoData}
        imgBase={IMG_BASE}
      />

      <IceSectors
        article_id={globalIceData.global_data?.id}
        onImagePress={openSectorImage}
      />

      {galleryUris.length > 0 && (
        <View style={styles.gallerySection}>
          <Text style={gStyle.h2}>{t('article.gallery')}</Text>
          <View style={styles.galleryGrid}>
            {galleryUris.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.galleryItem}
                onPress={() => openGallery(uri)}
              >
                <CachedImage uri={uri} style={styles.galleryThumb} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ImageViewerModal
        uris={viewer?.uris}
        initialIndex={viewer?.idx ?? 0}
        visible={viewer !== null}
        onClose={() => setViewer(null)}
      />

      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  gallerySection: { marginTop: 16, marginBottom: 24 },
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  galleryItem: { width: '33.33%', padding: 2 },
  galleryThumb: { width: '100%', aspectRatio: 1, borderRadius: 4 },
});
