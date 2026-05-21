import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { corsUrl, imgUri } from './api';
import { downloadImages } from './imageCache';

export const OFFLINE_KEYS = {
  outdoor:      '@offline_outdoor',
  ice:          '@offline_ice',
  indoor:       '@offline_indoor',
  mount_route:  '@offline_mount_route',
  other:        '@offline_other',
  events:       '@offline_events',
  site_data:    '@offline_site_data',
  download_time:'@offline_download_time',
};

const GALLERY_BASE    = 'https://climbing.ge/public/images/article_gallery_img/';
const SECTOR_IMG_BASE = 'https://climbing.ge/public/images/sector_img/';
const LOCAL_IMG_BASE  = 'https://climbing.ge/public/images/sector_local_img/';

function buildListEndpoints(locale) {
  return [
    { key: OFFLINE_KEYS.outdoor,     url: `https://climbing.ge/api/get_article/get_locale_articles/outdoor/${locale}`,     label: 'Outdoor Spots' },
    { key: OFFLINE_KEYS.ice,         url: `https://climbing.ge/api/get_article/get_locale_articles/ice/${locale}`,         label: 'Ice Climbing' },
    { key: OFFLINE_KEYS.indoor,      url: `https://climbing.ge/api/get_article/get_locale_articles/indoor/${locale}`,      label: 'Indoor Gyms' },
    { key: OFFLINE_KEYS.mount_route, url: `https://climbing.ge/api/get_article/get_locale_articles/mount_route/${locale}`, label: 'Mountain Routes' },
    { key: OFFLINE_KEYS.other,       url: `https://climbing.ge/api/get_article/get_locale_articles/other/${locale}`,       label: 'Other Activities' },
    { key: OFFLINE_KEYS.events,      url: `https://climbing.ge/api/get_event/get_event_on_site_list/${locale}`,            label: 'Events' },
    { key: OFFLINE_KEYS.site_data,   url: `https://climbing.ge/api/get_site_data/get_site_locale_data_for_site/${locale}`, label: 'Site Data' },
  ];
}

function buildArticleConfigs(locale) {
  return [
    {
      listKey:    OFFLINE_KEYS.outdoor,
      type:       'outdoor',
      imgBase:    'https://climbing.ge/public/images/outdoor_img/',
      detailUrl:  (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/outdoor/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => item.global_data?.id,
      getImage:   (item) => item.global_data?.image,
      hasSectors: true,
    },
    {
      listKey:    OFFLINE_KEYS.ice,
      type:       'ice',
      imgBase:    'https://climbing.ge/public/images/ice_img/',
      detailUrl:  (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/ice/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => item.global_data?.id,
      getImage:   (item) => item.global_data?.image,
      hasSectors: true,
    },
    {
      listKey:    OFFLINE_KEYS.indoor,
      type:       'indoor',
      imgBase:    'https://climbing.ge/public/images/indoor_img/',
      detailUrl:  (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/indoor/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => null,
      getImage:   (item) => item.global_data?.image,
      hasSectors: false,
    },
    {
      listKey:    OFFLINE_KEYS.mount_route,
      type:       'mount_route',
      imgBase:    'https://climbing.ge/public/images/mount_route_img/',
      detailUrl:  (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/mount_route/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => item.global_data?.id,
      getImage:   (item) => item.global_data?.image,
      hasSectors: true,
    },
    {
      listKey:    OFFLINE_KEYS.other,
      type:       'other',
      imgBase:    'https://climbing.ge/public/images/other_img/',
      detailUrl:  (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/other/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => null,
      getImage:   (item) => item.global_data?.image,
      hasSectors: false,
    },
    {
      listKey:    OFFLINE_KEYS.events,
      type:       'event',
      imgBase:    'https://climbing.ge/public/images/event_img/',
      detailUrl:  (key) => `https://climbing.ge/api/get_event/get_event_on_site_page/${locale}/${key}`,
      getKey:     (item) => item.global_event?.id?.toString(),
      getId:      (item) => null,
      getImage:   (item) => item.global_event?.image,
      hasSectors: false,
    },
  ];
}

// --- Low-level helpers ---

export async function saveOfflineData(key, data) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (_) {}
}

export async function loadOfflineData(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

// --- Article detail cache ---

export async function saveArticleData(type, urlKey, data) {
  await saveOfflineData(`@article_${type}_${urlKey}`, data);
}

export async function loadArticleData(type, urlKey) {
  return loadOfflineData(`@article_${type}_${urlKey}`);
}

// --- Sectors cache ---

export async function saveSectorsData(articleId, data) {
  await saveOfflineData(`@sectors_${articleId}`, data);
}

export async function loadSectorsData(articleId) {
  return loadOfflineData(`@sectors_${articleId}`);
}

// --- Download time ---

export async function getLastDownloadTime() {
  return loadOfflineData(OFFLINE_KEYS.download_time);
}

function collectSectorImageUrls(sectorsData) {
  const urls = [];
  for (const item of (sectorsData || [])) {
    if (item.local_images) {
      for (const li of item.local_images) {
        if (li.image) urls.push(imgUri(LOCAL_IMG_BASE, li.image));
      }
      for (const sub of (item.sectors || [])) {
        for (const si of (sub.sector_imgs || [])) {
          if (si.image) urls.push(imgUri(SECTOR_IMG_BASE, si.image));
        }
      }
    } else {
      for (const si of (item.sector_imgs || [])) {
        if (si.image) urls.push(imgUri(SECTOR_IMG_BASE, si.image));
      }
    }
  }
  return urls;
}

// --- Bulk download (locale-aware) ---

export async function downloadAllData(locale = 'en', onProgress) {
  let listCompleted = 0;
  let listFailed = 0;
  let articleCompleted = 0;
  let articleFailed = 0;
  let sectorsCompleted = 0;
  let sectorsFailed = 0;
  let imagesCompleted = 0;

  const LIST_ENDPOINTS = buildListEndpoints(locale);
  const ARTICLE_CONFIGS = buildArticleConfigs(locale);

  const cachedLists = {};
  const allImageUrls = [];

  // Phase 1: Download category lists
  for (const ep of LIST_ENDPOINTS) {
    try {
      const { data } = await api.get(corsUrl(ep.url));
      await saveOfflineData(ep.key, data);
      cachedLists[ep.key] = data;
      listCompleted++;
    } catch (_) {
      listFailed++;
    }
    if (onProgress) onProgress({ currentLabel: ep.label, phase: 'lists' });
  }

  // Collect card thumbnail images from all lists
  for (const config of ARTICLE_CONFIGS) {
    const list = cachedLists[config.listKey];
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const filename = config.getImage(item);
      if (filename) allImageUrls.push(imgUri(config.imgBase, filename));
    }
  }

  // Phase 2: Download each article detail + its sectors
  for (const config of ARTICLE_CONFIGS) {
    const list = cachedLists[config.listKey];
    if (!Array.isArray(list)) continue;

    for (const item of list) {
      const urlKey = config.getKey(item);
      const articleId = config.getId(item);
      if (!urlKey) continue;

      if (onProgress) onProgress({ currentLabel: `Article: ${urlKey}`, phase: 'articles' });
      try {
        const { data } = await api.get(corsUrl(config.detailUrl(urlKey)));
        await saveArticleData(config.type, urlKey, data);
        articleCompleted++;

        const headerImg = data.global_data?.image || data.global_event?.image;
        if (headerImg) allImageUrls.push(imgUri(config.imgBase, headerImg));

        for (const g of (data.gallery_images || [])) {
          if (g.image) allImageUrls.push(imgUri(GALLERY_BASE, g.image));
        }
      } catch (_) {
        articleFailed++;
      }

      if (config.hasSectors && articleId) {
        if (onProgress) onProgress({ currentLabel: `Sectors: ${urlKey}`, phase: 'sectors' });
        try {
          const { data } = await api.get(corsUrl(
            `https://climbing.ge/api/get_sector/get_sector_and_routes/${articleId}`
          ));
          await saveSectorsData(articleId, data);
          sectorsCompleted++;
          allImageUrls.push(...collectSectorImageUrls(data));
        } catch (_) {
          sectorsFailed++;
        }
      }
    }
  }

  // Phase 3: Download images to device filesystem
  const uniqueUrls = [...new Set(allImageUrls.filter(Boolean))];
  if (uniqueUrls.length > 0) {
    await downloadImages(uniqueUrls, (done, total) => {
      imagesCompleted = done;
      if (onProgress) onProgress({
        currentLabel: `Images: ${done} / ${total}`,
        phase: 'images',
      });
    });
  }

  const totalCompleted = listCompleted + articleCompleted + sectorsCompleted;
  if (totalCompleted > 0) {
    await saveOfflineData(OFFLINE_KEYS.download_time, new Date().toISOString());
  }

  return {
    listCompleted, listFailed,
    articleCompleted, articleFailed,
    sectorsCompleted, sectorsFailed,
    imagesCompleted,
    completed: totalCompleted,
    failed: listFailed + articleFailed + sectorsFailed,
  };
}
