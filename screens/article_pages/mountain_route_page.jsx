import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";

import { Image } from "expo-image";
import api, { corsUrl, imgUri } from "../../utils/api";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import MassiveSection from "../../components/article/mount_masive/mount_masive_description_for_article_page_component";
import Preloader from "../../components/Preloader";
import { gStyle } from "../../assets/styles/styles";

const IMG_BASE     = "https://climbing.ge/public/images/mount_route_img/";
const GALLERY_BASE = "https://climbing.ge/public/images/article_gallery_img/";

export default function MountainRoutePage({ route }) {
  const urlTitle   = typeof route.params === 'object' ? route.params.url_title : route.params;
  const mountMasive = typeof route.params === 'object' ? route.params.mount_masive : null;

  const [globalData, setGlobalData]       = useState({});
  const [localeData, setLocaleData]       = useState({});
  const [globalInfoData, setGlobalInfoData] = useState({});
  const [isLoading, setLoading]           = useState(true);
  const [viewerUri, setViewerUri]         = useState(null);

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/mount_route/en/" + urlTitle))
      .then(({ data }) => {
        setGlobalData(data);
        setLocaleData(data.locale_data || {});
        setGlobalInfoData(data.general_info || {});
        setLoading(false);
      })
      .catch(() => {
        Alert.alert("ERROR!", "Failed to load article");
        setLoading(false);
      });
  }, []);

  if (isLoading) return <Preloader />;

  const galleryImages = globalData.gallery_images || globalData.global_data?.gallery_images || [];

  return (
    <ScrollView style={styles.container}>

      {/* Massive Mountain section */}
      {mountMasive ? (
        <MassiveSection
          mountMasiveName={mountMasive}
          articleId={globalData.global_data?.id}
        />
      ) : null}

      <ArticleBlock
        local_data={localeData}
        global_data={globalData.global_data || {}}
        global_info_data={globalInfoData}
        imgBase={IMG_BASE}
      />

      {/* Gallery */}
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
                  <Image source={{ uri }} style={styles.galleryThumb} contentFit="cover" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Sectors / route topo images */}
      <IceSectors article_id={globalData.global_data?.id} />

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
    marginBottom: 8,
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
