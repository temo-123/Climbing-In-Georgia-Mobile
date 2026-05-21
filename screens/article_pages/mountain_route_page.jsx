import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from "react-native";

import CachedImage from "../../components/CachedImage";
import ImageViewerModal from "../../components/ImageViewerModal";
import api, { corsUrl, imgUri } from "../../utils/api";
import { loadArticleData, saveArticleData, loadSectorsData, saveSectorsData } from "../../utils/offlineStorage";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import MassiveSection from "../../components/article/mount_masive/mount_masive_description_for_article_page_component";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";
import { gStyle } from "../../assets/styles/styles";

const IMG_BASE           = "https://climbing.ge/public/images/mount_route_img/";
const ROUTE_PHOTO_BASE   = "https://climbing.ge/public/images/mount_route_description_img/";
const GALLERY_BASE       = "https://climbing.ge/public/images/article_gallery_img/";
const SECTOR_IMG_BASE    = "https://climbing.ge/public/images/sector_img/";
const LOCAL_IMG_BASE     = "https://climbing.ge/public/images/sector_local_img/";

function extractSectorImageUris(sectorsData) {
  const uris = [];
  for (const item of (sectorsData || [])) {
    if (item.local_images) {
      for (const li of item.local_images) {
        const uri = imgUri(LOCAL_IMG_BASE, li.image);
        if (uri) uris.push(uri);
      }
      for (const sub of (item.sectors || [])) {
        for (const si of (sub.sector_imgs || [])) {
          const uri = imgUri(SECTOR_IMG_BASE, si.image);
          if (uri) uris.push(uri);
        }
      }
    } else {
      for (const si of (item.sector_imgs || [])) {
        const uri = imgUri(SECTOR_IMG_BASE, si.image);
        if (uri) uris.push(uri);
      }
    }
  }
  return uris;
}

export default function MountainRoutePage({ route }) {
  const urlTitle    = typeof route.params === 'object' ? route.params.url_title : route.params;
  const mountMasive = typeof route.params === 'object' ? route.params.mount_masive : null;

  const [globalData, setGlobalData]           = useState({});
  const [localeData, setLocaleData]           = useState({});
  const [globalInfoData, setGlobalInfoData]   = useState({});
  const [isLoading, setLoading]               = useState(true);
  const [noCache, setNoCache]                 = useState(false);
  const [sectorImageUris, setSectorImageUris] = useState([]);
  const [routeImages, setRouteImages]         = useState([]);
  const [viewer, setViewer]                   = useState(null); // { uris, idx }

  useEffect(() => {
    api.get(corsUrl("https://climbing.ge/api/get_article/get_locale_article_on_page/mount_route/en/" + urlTitle))
      .then(({ data }) => {
        setGlobalData(data);
        setLocaleData(data.locale_data || {});
        setGlobalInfoData(data.general_info || {});
        saveArticleData('mount_route', urlTitle, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadArticleData('mount_route', urlTitle);
        if (cached) {
          setGlobalData(cached);
          setLocaleData(cached.locale_data || {});
          setGlobalInfoData(cached.general_info || {});
        } else {
          setNoCache(true);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const articleId = globalData.global_data?.id;
    if (!articleId) return;

    // Fetch sector topo images
    api.get(corsUrl(`https://climbing.ge/api/get_sector/get_sector_and_routes/${articleId}`))
      .then(({ data }) => {
        saveSectorsData(articleId, data);
        setSectorImageUris(extractSectorImageUris(data));
      })
      .catch(async () => {
        const cached = await loadSectorsData(articleId);
        if (cached) setSectorImageUris(extractSectorImageUris(cached));
      });

    // Fetch route photos
    api.get(corsUrl(`https://climbing.ge/api/get_mount_route/get_mount_routes_images/${articleId}`))
      .then(({ data }) => {
        if (Array.isArray(data)) setRouteImages(data);
      })
      .catch(() => {});
  }, [globalData.global_data?.id]);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  const routeImageUris = routeImages
    .map(img => imgUri(ROUTE_PHOTO_BASE, img.image))
    .filter(Boolean);

  const articleGalleryUris = (globalData.gallery_images || [])
    .map(img => imgUri(GALLERY_BASE, img.image))
    .filter(Boolean);

  const headerUri = globalData.global_data?.image
    ? imgUri(IMG_BASE, globalData.global_data.image)
    : routeImageUris[0] || null;

  const galleryUris = [...articleGalleryUris, ...sectorImageUris];

  function openRoutePhoto(idx) {
    setViewer({ uris: routeImageUris, idx });
  }

  function openGalleryPhoto(uri) {
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
        local_data={localeData}
        global_data={globalData.global_data || {}}
        global_info_data={globalInfoData}
        imgBase={IMG_BASE}
        headerUri={headerUri}
        afterImageContent={mountMasive ? (
          <MassiveSection
            mountMasiveName={mountMasive}
            articleId={globalData.global_data?.id}
          />
        ) : null}
      />

      {/* Route photos — 2-column grid */}
      {routeImageUris.length > 0 && (
        <View style={styles.section}>
          <Text style={gStyle.h2}>Route Photos</Text>
          <View style={styles.twoColGrid}>
            {routeImageUris.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.twoColItem}
                onPress={() => openRoutePhoto(idx)}
              >
                <CachedImage uri={uri} style={styles.twoColThumb} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Gallery: article photos + sector topo thumbnails */}
      {galleryUris.length > 0 && (
        <View style={styles.section}>
          <Text style={gStyle.h2}>Photos</Text>
          <View style={styles.galleryGrid}>
            {galleryUris.map((uri, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.galleryItem}
                onPress={() => openGalleryPhoto(uri)}
              >
                <CachedImage uri={uri} style={styles.galleryThumb} contentFit="cover" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <IceSectors
        article_id={globalData.global_data?.id}
        onImagePress={openSectorImage}
      />

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
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  twoColGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  twoColItem: {
    width: '50%',
    padding: 3,
  },
  twoColThumb: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 6,
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
