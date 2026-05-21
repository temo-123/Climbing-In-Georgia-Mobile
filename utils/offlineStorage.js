import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { corsUrl } from './api';

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

// List endpoints (category lists shown in drawer screens)
const LIST_ENDPOINTS = [
  { key: OFFLINE_KEYS.outdoor,     url: 'https://climbing.ge/api/get_article/get_locale_articles/outdoor/en',     label: 'Outdoor Spots' },
  { key: OFFLINE_KEYS.ice,         url: 'https://climbing.ge/api/get_article/get_locale_articles/ice/en',         label: 'Ice Climbing' },
  { key: OFFLINE_KEYS.indoor,      url: 'https://climbing.ge/api/get_article/get_locale_articles/indoor/en',      label: 'Indoor Gyms' },
  { key: OFFLINE_KEYS.mount_route, url: 'https://climbing.ge/api/get_article/get_locale_articles/mount_route/en', label: 'Mountain Routes' },
  { key: OFFLINE_KEYS.other,       url: 'https://climbing.ge/api/get_article/get_locale_articles/other/en',       label: 'Other Activities' },
  { key: OFFLINE_KEYS.events,      url: 'https://climbing.ge/api/get_event/get_event_on_site_list/en',            label: 'Events' },
  { key: OFFLINE_KEYS.site_data,   url: 'https://climbing.ge/api/get_site_data/get_site_locale_data_for_site/en', label: 'Site Data' },
];

// Per-type article download config
const ARTICLE_CONFIGS = [
  {
    listKey:  OFFLINE_KEYS.outdoor,
    type:     'outdoor',
    detailUrl: (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/outdoor/en/${key}`,
    getKey:   (item) => item.global_data?.url_title,
    getId:    (item) => item.global_data?.id,
    hasSectors: true,
  },
  {
    listKey:  OFFLINE_KEYS.ice,
    type:     'ice',
    detailUrl: (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/ice/en/${key}`,
    getKey:   (item) => item.global_data?.url_title,
    getId:    (item) => item.global_data?.id,
    hasSectors: true,
  },
  {
    listKey:  OFFLINE_KEYS.indoor,
    type:     'indoor',
    detailUrl: (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/indoor/en/${key}`,
    getKey:   (item) => item.global_data?.url_title,
    getId:    (item) => null,
    hasSectors: false,
  },
  {
    listKey:  OFFLINE_KEYS.mount_route,
    type:     'mount_route',
    detailUrl: (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/mount_route/en/${key}`,
    getKey:   (item) => item.global_data?.url_title,
    getId:    (item) => item.global_data?.id,
    hasSectors: true,
  },
  {
    listKey:  OFFLINE_KEYS.other,
    type:     'other',
    detailUrl: (key) => `https://climbing.ge/api/get_article/get_locale_article_on_page/other/en/${key}`,
    getKey:   (item) => item.global_data?.url_title,
    getId:    (item) => null,
    hasSectors: false,
  },
  {
    listKey:  OFFLINE_KEYS.events,
    type:     'event',
    detailUrl: (key) => `https://climbing.ge/api/get_event/get_event_on_site_page/en/${key}`,
    getKey:   (item) => item.global_event?.id?.toString(),
    getId:    (item) => null,
    hasSectors: false,
  },
];

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

// --- Bulk download ---

export async function downloadAllData(onProgress) {
  let listCompleted = 0;
  let listFailed = 0;
  let articleCompleted = 0;
  let articleFailed = 0;
  let sectorsCompleted = 0;
  let sectorsFailed = 0;

  const cachedLists = {};

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

  // Phase 2: Download each article detail + its sectors
  for (const config of ARTICLE_CONFIGS) {
    const list = cachedLists[config.listKey];
    if (!Array.isArray(list)) continue;

    for (const item of list) {
      const urlKey = config.getKey(item);
      const articleId = config.getId(item);
      if (!urlKey) continue;

      // Download article detail
      if (onProgress) onProgress({ currentLabel: `Article: ${urlKey}`, phase: 'articles' });
      try {
        const { data } = await api.get(corsUrl(config.detailUrl(urlKey)));
        await saveArticleData(config.type, urlKey, data);
        articleCompleted++;
      } catch (_) {
        articleFailed++;
      }

      // Download sectors if this type has them
      if (config.hasSectors && articleId) {
        if (onProgress) onProgress({ currentLabel: `Sectors: ${urlKey}`, phase: 'sectors' });
        try {
          const { data } = await api.get(corsUrl(
            `https://climbing.ge/api/get_sector/get_sector_and_routes/${articleId}`
          ));
          await saveSectorsData(articleId, data);
          sectorsCompleted++;
        } catch (_) {
          sectorsFailed++;
        }
      }
    }
  }

  const totalCompleted = listCompleted + articleCompleted + sectorsCompleted;
  if (totalCompleted > 0) {
    await saveOfflineData(OFFLINE_KEYS.download_time, new Date().toISOString());
  }

  return {
    listCompleted, listFailed,
    articleCompleted, articleFailed,
    sectorsCompleted, sectorsFailed,
    completed: totalCompleted,
    failed: listFailed + articleFailed + sectorsFailed,
  };
}
