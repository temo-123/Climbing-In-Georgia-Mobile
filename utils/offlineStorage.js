import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from './api';
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

const GALLERY_BASE    = IMG_BASES.gallery;
const SECTOR_IMG_BASE = IMG_BASES.sector;
const LOCAL_IMG_BASE  = IMG_BASES.sectorLocal;
const ASCENT_PHOTO_BASE = IMG_BASES.summitAscent;
const ROUTE_DESC_IMG_BASE = IMG_BASES.mountRouteDescription;

const HTML_IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;

// Pulls out <img src="..."> URLs embedded in rich-text HTML fields (article
// body, "how to get", massif description, etc.) so they get downloaded
// alongside the header/gallery images that already have dedicated fields —
// otherwise inline body images just never load once offline.
function extractHtmlImageUrls(...htmlStrings) {
  const urls = [];
  for (const html of htmlStrings) {
    if (!html || typeof html !== 'string') continue;
    for (const match of html.matchAll(HTML_IMG_SRC_RE)) {
      urls.push(match[1]);
    }
  }
  return urls;
}

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
    { key: OFFLINE_KEYS.outdoor,     url: `${API_BASE_URL}/get_article/get_locale_articles/outdoor/${locale}`,     label: 'Outdoor Spots' },
    { key: OFFLINE_KEYS.ice,         url: `${API_BASE_URL}/get_article/get_locale_articles/ice/${locale}`,         label: 'Ice Climbing' },
    { key: OFFLINE_KEYS.indoor,      url: `${API_BASE_URL}/get_article/get_locale_articles/indoor/${locale}`,      label: 'Indoor Gyms' },
    { key: OFFLINE_KEYS.mount_route, url: `${API_BASE_URL}/get_article/get_locale_articles/mount_route/${locale}`, label: 'Mountain Routes' },
    { key: OFFLINE_KEYS.other,       url: `${API_BASE_URL}/get_article/get_locale_articles/other/${locale}`,       label: 'Other Activities' },
    { key: OFFLINE_KEYS.events,      url: `${API_BASE_URL}/get_event/get_event_on_site_list/${locale}`,            label: 'Events' },
    { key: OFFLINE_KEYS.site_data,   url: `${API_BASE_URL}/get_site_data/get_site_locale_data_for_site/${locale}`, label: 'Site Data' },
    { key: OFFLINE_KEYS.summits,     url: `${API_BASE_URL}/summit/list`,                                           label: 'Summits' },
  ];
}

function buildArticleConfigs(locale) {
  return [
    {
      listKey:    OFFLINE_KEYS.outdoor,
      type:       'outdoor',
      imgBase:    IMG_BASES.outdoor,
      detailUrl:  (key) => `${API_BASE_URL}/get_article/get_locale_article_on_page/outdoor/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => item.global_data?.id,
      getImage:   (item) => item.global_data?.image,
      hasSectors: true,
    },
    {
      listKey:    OFFLINE_KEYS.ice,
      type:       'ice',
      imgBase:    IMG_BASES.ice,
      detailUrl:  (key) => `${API_BASE_URL}/get_article/get_locale_article_on_page/ice/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => item.global_data?.id,
      getImage:   (item) => item.global_data?.image,
      hasSectors: true,
    },
    {
      listKey:    OFFLINE_KEYS.indoor,
      type:       'indoor',
      imgBase:    IMG_BASES.indoor,
      detailUrl:  (key) => `${API_BASE_URL}/get_article/get_locale_article_on_page/indoor/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => null,
      getImage:   (item) => item.global_data?.image,
      hasSectors: false,
    },
    {
      listKey:    OFFLINE_KEYS.mount_route,
      type:       'mount_route',
      imgBase:    IMG_BASES.mountRoute,
      detailUrl:  (key) => `${API_BASE_URL}/get_article/get_locale_article_on_page/mount_route/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => item.global_data?.id,
      getImage:   (item) => item.global_data?.image,
      hasSectors: true,
      hasMassive: true,
    },
    {
      listKey:    OFFLINE_KEYS.other,
      type:       'other',
      imgBase:    IMG_BASES.other,
      detailUrl:  (key) => `${API_BASE_URL}/get_article/get_locale_article_on_page/other/${locale}/${key}`,
      getKey:     (item) => item.global_data?.url_title,
      getId:      (item) => null,
      getImage:   (item) => item.global_data?.image,
      hasSectors: false,
    },
    {
      listKey:    OFFLINE_KEYS.events,
      type:       'event',
      imgBase:    IMG_BASES.event,
      detailUrl:  (key) => `${API_BASE_URL}/get_event/get_event_on_site_page/${locale}/${key}`,
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

// --- Mountain route description-photo list cache ---

export async function saveRouteImagesData(articleId, data) {
  await saveOfflineData(`@route_images_${articleId}`, data);
}

export async function loadRouteImagesData(articleId) {
  return loadOfflineData(`@route_images_${articleId}`);
}

// --- Mountain massif detail cache ---

export async function saveMassiveData(locale, articleId, data) {
  await saveOfflineData(`@massive_${locale}_${articleId}`, data);
}

export async function loadMassiveData(locale, articleId) {
  return loadOfflineData(`@massive_${locale}_${articleId}`);
}

// --- Region/massif-grouped list cache (region & massif filter UI) ---
// Separate from OFFLINE_KEYS.outdoor/mount_route (the flat lists used
// elsewhere) since this is the grouped shape the filter UI needs — same
// articles, reorganized by region/mountain massif, per locale.

export async function saveOutdoorByRegionData(locale, data) {
  await saveOfflineData(`@outdoor_by_region_${locale}`, data);
}

export async function loadOutdoorByRegionData(locale) {
  return loadOfflineData(`@outdoor_by_region_${locale}`);
}

export async function saveMountRoutesByMassifData(locale, data) {
  await saveOfflineData(`@mount_routes_by_massif_${locale}`, data);
}

export async function loadMountRoutesByMassifData(locale) {
  return loadOfflineData(`@mount_routes_by_massif_${locale}`);
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
  let massiveCompleted = 0;
  let massiveFailed = 0;
  let routeImagesCompleted = 0;
  let routeImagesFailed = 0;
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
  let groupedListsCompleted = 0;
  let groupedListsFailed = 0;

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

  // Phase 1.5: Region/massif-grouped lists — powers the filter UI on the
  // outdoor and mountain-route list screens while offline.
  const GROUPED_ENDPOINTS = [
    { label: 'Outdoor by Region', url: `${API_BASE_URL}/get_outdoor/get_spots_by_regions/${locale}`, save: saveOutdoorByRegionData },
    { label: 'Mount Routes by Massif', url: `${API_BASE_URL}/get_mount_route/get_mount_routes_by_maunt/${locale}`, save: saveMountRoutesByMassifData },
  ];
  for (const ep of GROUPED_ENDPOINTS) {
    if (onProgress) onProgress({ currentLabel: ep.label, phase: 'grouped_lists' });
    try {
      const { data } = await withTimeout(
        (signal) => api.get(corsUrl(ep.url), { signal }), 20000, ep.label,
      );
      await ep.save(locale, data);
      groupedListsCompleted++;
    } catch (err) {
      groupedListsFailed++;
      debugErrors.push({
        phase: 'grouped-list', label: ep.label, url: ep.url,
        message: err?.message, status: err?.response?.status, data: err?.response?.data,
      });
    }
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

        const ld = data.locale_data || {};
        const gi = data.general_info || {};
        allImageUrls.push(...extractHtmlImageUrls(
          ld.text, ld.how_get, ld.best_time, ld.what_need, ld.info, ld.route, ld.routes,
          gi.best_time?.text, gi.what_need_info?.text, gi.info_block?.text, gi.routes_info?.text,
        ));
      } catch (_) {
        articleFailed++;
      }

      if (config.type === 'mount_route' && articleId) {
        if (onProgress) onProgress({ currentLabel: `Route photos: ${urlKey}`, phase: 'route_images' });
        try {
          const { data } = await withTimeout(
            (signal) => api.get(corsUrl(
              `${API_BASE_URL}/get_mount_route/get_mount_routes_images/${articleId}`
            ), { signal }),
            20000, `route_images:${urlKey}`,
          );
          if (Array.isArray(data)) {
            await saveRouteImagesData(articleId, data);
            routeImagesCompleted++;
            for (const img of data) {
              if (img.image) allImageUrls.push(imgUri(ROUTE_DESC_IMG_BASE, img.image));
            }
          }
        } catch (_) {
          routeImagesFailed++;
        }
      }

      if (config.hasSectors && articleId) {
        if (onProgress) onProgress({ currentLabel: `Sectors: ${urlKey}`, phase: 'sectors' });
        try {
          const { data } = await withTimeout(
            (signal) => api.get(corsUrl(
              `${API_BASE_URL}/get_sector/get_sector_and_routes/${articleId}`
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

      if (config.hasMassive && articleId) {
        if (onProgress) onProgress({ currentLabel: `Massif: ${urlKey}`, phase: 'massive' });
        try {
          const { data } = await withTimeout(
            (signal) => api.get(corsUrl(
              `${API_BASE_URL}/get_mount/on_page/${locale}/${articleId}`
            ), { signal }),
            20000, `massive:${urlKey}`,
          );
          await saveMassiveData(locale, articleId, data);
          massiveCompleted++;

          const mld = data.locale_data || {};
          allImageUrls.push(...extractHtmlImageUrls(
            mld.description, mld.text, mld.best_time, mld.how_get,
          ));
        } catch (_) {
          massiveFailed++;
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
          (signal) => api.get(corsUrl(`${API_BASE_URL}/summit/show/${summit.url_title}`), { signal }),
          20000, summit.url_title,
        );
        await saveSummitData(summit.url_title, data);
        summitsCompleted++;
      } catch (err) {
        summitsFailed++;
        debugErrors.push({
          phase: 'summit-detail', label: summit.url_title,
          url: `${API_BASE_URL}/summit/show/${summit.url_title}`,
          message: err?.message, status: err?.response?.status, data: err?.response?.data,
        });
      }

      if (summit.id != null) {
        try {
          const { data } = await withTimeout(
            (signal) => api.get(corsUrl(`${API_BASE_URL}/summit/routes/${summit.id}`), { signal }),
            20000, `routes:${summit.url_title}`,
          );
          await saveSummitRoutesData(summit.id, data);
          summitRoutesCompleted++;
        } catch (err) {
          summitRoutesFailed++;
          debugErrors.push({
            phase: 'summit-routes', label: summit.url_title,
            url: `${API_BASE_URL}/summit/routes/${summit.id}`,
            message: err?.message, status: err?.response?.status, data: err?.response?.data,
          });
        }
      }

      try {
        const { data } = await withTimeout(
          (signal) => api.get(corsUrl(`${API_BASE_URL}/summit/ascents/${summit.url_title}`), { signal }),
          20000, `ascents:${summit.url_title}`,
        );
        await saveSummitAscentsData(summit.url_title, data);
        summitAscentsCompleted++;
        const ascentList = data?.ascents ?? data ?? [];
        for (const ascent of (Array.isArray(ascentList) ? ascentList : [])) {
          if (ascent.photo) allImageUrls.push(imgUri(ASCENT_PHOTO_BASE, ascent.photo));
        }
      } catch (err) {
        summitAscentsFailed++;
        debugErrors.push({
          phase: 'summit-ascents', label: summit.url_title,
          url: `${API_BASE_URL}/summit/ascents/${summit.url_title}`,
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
    + massiveCompleted + routeImagesCompleted + groupedListsCompleted + summitsCompleted
    + summitRoutesCompleted + summitAscentsCompleted;
  if (totalCompleted > 0) {
    await saveOfflineData(OFFLINE_KEYS.download_time, new Date().toISOString());
  }

  return {
    listCompleted, listFailed,
    articleCompleted, articleFailed,
    sectorsCompleted, sectorsFailed,
    massiveCompleted, massiveFailed,
    routeImagesCompleted, routeImagesFailed,
    groupedListsCompleted, groupedListsFailed,
    summitsCompleted, summitsFailed,
    summitRoutesCompleted, summitRoutesFailed,
    summitAscentsCompleted, summitAscentsFailed,
    imagesCompleted,
    completed: totalCompleted,
    failed: listFailed + articleFailed + sectorsFailed + massiveFailed + routeImagesFailed
      + groupedListsFailed + summitsFailed + summitRoutesFailed + summitAscentsFailed,
    debugErrors, // [TEMP DEBUG] remove once the summit download failure is diagnosed
  };
}
