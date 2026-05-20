import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Alert,
  ScrollView,
  View,
  Text,
  Image,
} from "react-native";
import React, { useState, useEffect } from "react";

import SpotSectors from "../../components/Routes_and_sectors/Sport_sector/spot_sectors";
import ArticleBlock from "../../components/article/articl_block";
import Preloader from "../../components/Preloader";
import { gStyle } from "../../assets/styles/styles";

import api, { corsUrl, imgUri } from "../../utils/api";

export default function App({ route }) {
  const [globalOutdoorData, setGlobalOutdoorData] = useState({});
  const [localeOutdoorData, setLocaleOutdoorData] = useState({});
  const [globalOutdoorInfoData, setGlobalOutdoorInfoData] = useState({});
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    const baseUrl =
      corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/outdoor/en/" + route.params);
    api
      .get(baseUrl)
      .then(({ data }) => {
        setGlobalOutdoorData(data);
        setLocaleOutdoorData(data.locale_data || {});
        setGlobalOutdoorInfoData(data.general_info || {});
        setLoading(false);
      })
      .catch(() => {
        Alert.alert("ERROR!", "Failed to load article");
      });
  }, []);

  if (isLoading) return <Preloader />;

  const galleryImages = globalOutdoorData.gallery_images || [];

  return (
    <ScrollView style={styles.container}>
      <ArticleBlock
        local_data={localeOutdoorData}
        global_data={globalOutdoorData.global_data || {}}
        global_info_data={globalOutdoorInfoData}
      />

      {galleryImages.length > 0 && (
        <View style={styles.gallerySection}>
          <Text style={gStyle.h2}>Gallery</Text>
          {galleryImages.map((img) => (
            <Image
              key={img.id}
              source={{
                uri: imgUri("https://climbing.ge/images/outdoor_img/", img.image),
              }}
              style={styles.galleryImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      <SpotSectors article_id={globalOutdoorData.global_data?.id} />

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
  galleryImage: {
    height: 220,
    width: "100%",
    marginBottom: 8,
    borderRadius: 6,
  },
});
