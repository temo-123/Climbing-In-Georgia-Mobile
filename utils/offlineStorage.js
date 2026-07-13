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
  summits:      '@offline_summits',
  download_time:'@offline_download_time',
};

const GALLERY_BASE    = 'https://climbing.ge/public/images/article_gallery_img/';
const SECTOR_IMG_BASE = 'https://climbing.ge/public/images/sector_img/';
const LOCAL_IMG_BASE  = 'https://climbing.ge/public/images/sector_local_img/';

// Backstop against a request that never settles. Racing a plain setTimeout
// against the request (as this used to do) only stops *our* code from
// waiting — it doesn't cancel the underlying connection, which stays open
// and can exhaust the device's connection pool for climbing.ge, causing
// *later* requests to queue forever even though each individual one "timed
// out" from our perspective. This actually aborts via AbortController, so
// the connection is genuinely released. requestFn receives the abort signal
// and must pass it through to axios's `signal` option.
async function withTimeout(requestFn, ms, label) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await requestFn(controller.signal);
  } catch (err) {
    if (controller.signal.aborted) {
      throw new Error(`Timed out after ${ms}ms: ${label}`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function buildListEndpoints(locale) {
  return [
    { key: OFFLINE_KEYS.outdoor,     url: `https://climbing.ge/api/get_article/get_locale_articles/outdoor/${locale}`,     label: 'Outdoor Spots' },
    { key: OFFLINE_KEYS.ice,         url: `https://climbing.ge/api/get_article/get_locale_articles/ice/${locale}`,         label: 'Ice Climbing' },
    { key: OFFLINE_KEYS.indoor,      url: `https://climbing.ge/api/get_article/get_locale_articles/indoor/${locale}`,      label: 'Indoor Gyms' },
    { key: OFFLINE_KEYS.mount_route, url: `https://climbing.ge/api/get_article/get_locale_articles/mount_route/${locale}`, label: 'Mountain Routes' },
    { key: OFFLINE_KEYS.other,       url: `https://climbing.ge/api/get_article/get_locale_articles/other/${locale}`,       label: 'Other Activities' },
    { key: OFFLINE_KEYS.events,      url: `https://climbing.ge/api/get_event/get_event_on_site_list/${locale}`,            label: 'Events' },
    { key: OFFLINE_KEYS.site_data,   url: `https://climbing.ge/api/get_site_data/get_site_locale_data_for_site/${locale}`, label: 'Site Data' },
    { key: OFFLINE_KEYS.summits,     url: `https://climbing.ge/api/summit/list`,                                           label: 'Summits' },
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

// --- Summit detail/routes/ascents cache ---
// Summit list itself is cached under OFFLINE_KEYS.summits by the generic list
// download below — these are per-summit, cached separately since summits use
// their own API shape (no sectors/gallery/localized article endpoints).

export async function saveSummitData(url_title, data) {
  await saveOfflineData(`@summit_${url_title}`, data);
}

export async function loadSummitData(url_title) {
  return loadOfflineData(`@summit_${url_title}`);
}

// Route list for a summit (SubmitAscentScreen's route picker) — keyed by
// summit_id since that's what GET /summit/routes/{id} takes, not url_title.
export async function saveSummitRoutesData(summit_id, data) {
  await saveOfflineData(`@summit_routes_${summit_id}`, data);
}

export async function loadSummitRoutesData(summit_id) {
  return loadOfflineData(`@summit_routes_${summit_id}`);
}

// Ascent history for a summit (SummitDetailScreen) — inherently live/social
// data, so this is a best-effort "last seen" snapshot, not a source of truth.
export async function saveSummitAscentsData(url_title, data) {
  await saveOfflineData(`@summit_ascents_${url_title}`, data);
}

export async function loadSummitAscentsData(url_title) {
  return loadOfflineData(`@summit_ascents_${url_title}`);
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
  let summitsCompleted = 0;
  let summitsFailed = 0;
  let imagesCompleted = 0;
  // Sub-parts of the summit phase. Each is independent — one failing (e.g. a
  // summit with no routes yet) doesn't block caching the others for the same
  // summit, so offline ascent submission degrades gracefully per-field rather
  // than all-or-nothing.
  let summitRoutesCompleted = 0;
  let summitRoutesFailed = 0;
  let summitAscentsCompleted = 0;
  let summitAscentsFailed = 0;

  const LIST_ENDPOINTS = buildListEndpoints(locale);
  const ARTICLE_CONFIGS = buildArticleConfigs(locale);

  const cachedLists = {};
  const allImageUrls = [];
  // [TEMP DEBUG] capture what actually failed, since the try/catch below was
  // silently discarding the real error — surfaced via the result object.
  const debugErrors = [];

  // Phase 1: Download category lists
  for (const ep of LIST_ENDPOINTS) {
    try {
      const { data } = await withTimeout(
        (signal) => api.get(corsUrl(ep.url), { signal }), 20000, ep.label,
      );
      await saveOfflineData(ep.key, data);
      cachedLists[ep.key] = data;
      listCompleted++;
    } catch (err) {
      listFailed++;
      debugErrors.push({
        phase: 'list', label: ep.label, url: ep.url,
        message: err?.message, status: err?.response?.status, data: err?.response?.data,
      });
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
        const { data } = await withTimeout(
          (signal) => api.get(corsUrl(config.detailUrl(urlKey)), { signal }), 20000, urlKey,
        );
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
          const { data } = await withTimeout(
            (signal) => api.get(corsUrl(
              `https://climbing.ge/api/get_sector/get_sector_and_routes/${articleId}`
            ), { signal }),
            20000, `sectors:${urlKey}`,
          );
          await saveSectorsData(articleId, data);
          sectorsCompleted++;
          allImageUrls.push(...collectSectorImageUrls(data));
        } catch (_) {
          sectorsFailed++;
        }
      }
    }
  }

  // Phase 2.5: Download each summit's detail, routes, and ascent history (its
  // own API shape — no sectors, gallery or localized article endpoints, so it
  // doesn't fit ARTICLE_CONFIGS). This is what lets SummitsListScreen,
  // SummitDetailScreen and SubmitAscentScreen (route picker + GPS
  // verification against the summit's real coords) all work while offline —
  // without it, the ascent-queueing flow is unreachable or badly degraded.
  const summitList = cachedLists[OFFLINE_KEYS.summits];
  if (Array.isArray(summitList)) {
    for (const summit of summitList) {
      if (!summit.url_title) continue;
      if (onProgress) onProgress({ currentLabel: `Summit: ${summit.url_title}`, phase: 'summits' });
      try {
        const { data } = await withTimeout(
          (signal) => api.get(corsUrl(`https://climbing.ge/api/summit/show/${summit.url_title}`), { signal }),
          20000, summit.url_title,
        );
        await saveSummitData(summit.url_title, data);
        summitsCompleted++;
      } catch (err) {
        summitsFailed++;
        debugErrors.push({
          phase: 'summit-detail', label: summit.url_title,
          url: `https://climbing.ge/api/summit/show/${summit.url_title}`,
          message: err?.message, status: err?.response?.status, data: err?.response?.data,
        });
      }

      if (summit.id != null) {
        try {
          const { data } = await withTimeout(
            (signal) => api.get(corsUrl(`https://climbing.ge/api/summit/routes/${summit.id}`), { signal }),
            20000, `routes:${summit.url_title}`,
          );
          await saveSummitRoutesData(summit.id, data);
          summitRoutesCompleted++;
        } catch (err) {
          summitRoutesFailed++;
          debugErrors.push({
            phase: 'summit-routes', label: summit.url_title,
            url: `https://climbing.ge/api/summit/routes/${summit.id}`,
            message: err?.message, status: err?.response?.status, data: err?.response?.data,
          });
        }
      }

      try {
        const { data } = await withTimeout(
          (signal) => api.get(corsUrl(`https://climbing.ge/api/summit/ascents/${summit.url_title}`), { signal }),
          20000, `ascents:${summit.url_title}`,
        );
        await saveSummitAscentsData(summit.url_title, data);
        summitAscentsCompleted++;
      } catch (err) {
        summitAscentsFailed++;
        debugErrors.push({
          phase: 'summit-ascents', label: summit.url_title,
          url: `https://climbing.ge/api/summit/ascents/${summit.url_title}`,
          message: err?.message, status: err?.response?.status, data: err?.response?.data,
        });
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

  const totalCompleted = listCompleted + articleCompleted + sectorsCompleted
    + summitsCompleted + summitRoutesCompleted + summitAscentsCompleted;
  if (totalCompleted > 0) {
    await saveOfflineData(OFFLINE_KEYS.download_time, new Date().toISOString());
  }

  return {
    listCompleted, listFailed,
    articleCompleted, articleFailed,
    sectorsCompleted, sectorsFailed,
    summitsCompleted, summitsFailed,
    summitRoutesCompleted, summitRoutesFailed,
    summitAscentsCompleted, summitAscentsFailed,
    imagesCompleted,
    completed: totalCompleted,
    failed: listFailed + articleFailed + sectorsFailed
      + summitsFailed + summitRoutesFailed + summitAscentsFailed,
    debugErrors, // [TEMP DEBUG] remove once the summit download failure is diagnosed
  };
}
