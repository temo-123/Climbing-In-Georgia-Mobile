import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../utils/LocaleContext';

import ImageViewerModal from "../../components/ImageViewerModal";
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from "../../utils/api";
import {
  loadArticleData, saveArticleData,
  loadRouteImagesData, saveRouteImagesData,
} from "../../utils/offlineStorage";

import IceSectors from "../../components/Routes_and_sectors/Ice_sectors/ice_sectors";
import ArticleBlock from "../../components/article/articl_block";
import ArticleImageGrid from "../../components/article/ArticleImageGrid";
import MassiveSection from "../../components/article/mount_masive/mount_masive_description_for_article_page_component";
import Preloader from "../../components/Preloader";
import OfflineError from "../../components/OfflineError";
import PageFooter from "../../components/PageFooter";

const IMG_BASE           = IMG_BASES.mountRoute;
const ROUTE_PHOTO_BASE   = IMG_BASES.mountRouteDescription;
const GALLERY_BASE       = IMG_BASES.gallery;

export default function MountainRoutePage({ route }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const urlTitle    = typeof route.params === 'object' ? route.params.url_title : route.params;
  const mountMasive = typeof route.params === 'object' ? route.params.mount_masive : null;

  const [globalData, setGlobalData]           = useState({});
  const [localeData, setLocaleData]           = useState({});
  const [globalInfoData, setGlobalInfoData]   = useState({});
  const [isLoading, setLoading]               = useState(true);
  const [noCache, setNoCache]                 = useState(false);
  const [routeImages, setRouteImages]         = useState([]);
  const [viewer, setViewer]                   = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_article_on_page/mount_route/${locale}/` + urlTitle))
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
  }, [locale]);

  useEffect(() => {
    const articleId = globalData.global_data?.id;
    if (!articleId) return;

    api.get(corsUrl(`${API_BASE_URL}/get_mount_route/get_mount_routes_images/${articleId}`))
      .then(({ data }) => {
        if (Array.isArray(data)) {
          setRouteImages(data);
          saveRouteImagesData(articleId, data);
        }
      })
      .catch(async () => {
        const cached = await loadRouteImagesData(articleId);
        if (Array.isArray(cached)) setRouteImages(cached);
      });
  }, [globalData.global_data?.id]);

  if (isLoading) return <Preloader />;
  if (noCache) return <OfflineError />;

  const routeImageUris = routeImages
    .map(img => imgUri(ROUTE_PHOTO_BASE, img.image))
    .filter(Boolean);

  const galleryUris = (globalData.gallery_images || [])
    .map(img => imgUri(GALLERY_BASE, img.image))
    .filter(Boolean);

  const headerUri = globalData.global_data?.image
    ? imgUri(IMG_BASE, globalData.global_data.image)
    : routeImageUris[0] || null;

  function openRoutePhoto(idx) {
    setViewer({ uris: routeImageUris, idx });
  }

  function openGalleryPhoto(idx) {
    setViewer({ uris: galleryUris, idx });
  }

  function openSectorImage(uris, idx) {
    setViewer({ uris, idx });
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

      <ArticleImageGrid
        title={t('article.route_photos')}
        uris={routeImageUris}
        onPress={openRoutePhoto}
        columns={2}
      />

      <ArticleImageGrid title={t('article.photos')} uris={galleryUris} onPress={openGalleryPhoto} />

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
  container: { flex: 1, padding: 16 },
});
