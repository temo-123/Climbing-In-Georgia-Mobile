import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import ImageViewerModal from "../../components/ImageViewerModal";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import { gStyle } from "../../assets/styles/styles";

import api, { corsUrl, imgUri } from "../../utils/api";
import { loadArticleData, saveArticleData } from "../../utils/offlineStorage";

const GALLERY_BASE = "https://climbing.ge/public/images/article_gallery_img/";
const IMG_BASE = "https://climbing.ge/public/images/ice_img/";

export default function App({ route }) {
  const [globalIceData, setGlobalIceData] = useState({});
  const [localeIceData, setLocaleIceData] = useState({});
  const [globalIceInfoData, setGlobalIceInfoData] = useState({});
  const [isLoading, setLoading] = useState(true);
  const [noCache, setNoCache] = useState(false);
  const [viewerUri, setViewerUri] = useState(null);

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/ice/en/" + route.params))
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
  }, []);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  const galleryImages = globalIceData.gallery_images || [];

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
        onImagePress={(uri) => setViewerUri(uri)}
      />

      {galleryImages.length > 0 && (
        <View style={styles.gallerySection}>
          <Text style={gStyle.h2}>Gallery</Text>
          <View style={styles.galleryGrid}>
            {galleryImages.map((img) => {
              const uri = imgUri(GALLERY_BASE, img.image);
              if (!uri) return null;
              return (
                <TouchableOpacity
                  key={img.id}
                  style={styles.galleryItem}
                  onPress={() => setViewerUri(uri)}
                >
                  <Image
                    source={{ uri }}
                    style={styles.galleryThumb}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <ImageViewerModal
        uri={viewerUri}
        visible={viewerUri != null}
        onClose={() => setViewerUri(null)}
      />

      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  gallerySection: {
    marginTop: 16,
    marginBottom: 24,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  galleryItem: {
    width: '33.33%',
    padding: 2,
  },
  galleryThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 4,
  },
});
