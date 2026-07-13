// SDK 54's expo-file-system default export moved to a new File/Directory API;
// the imperative methods this file uses (getInfoAsync, downloadAsync,
// createDownloadResumable, etc.) are the stable legacy implementation, not a
// deprecated shim — import from here explicitly rather than the main entry.
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = FileSystem.documentDirectory + 'img_cache/';
const MAP_KEY = '@image_cache_map';

let _map = null;

// FileSystem.downloadAsync has no built-in timeout — a single stuck download
// (dead URL, dropped connection, etc.) used to block this whole loop forever.
// Racing a plain setTimeout against it (an earlier version of this fix) only
// stopped *this code* from waiting — the underlying native download kept
// running and holding its connection, which can starve the connection pool
// for later requests to the same host. createDownloadResumable's
// cancelAsync() actually tears down the native download, not just our await.
async function downloadWithTimeout(url, localPath, ms) {
  const resumable = FileSystem.createDownloadResumable(url, localPath);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    resumable.cancelAsync().catch(() => {});
  }, ms);
  try {
    const result = await resumable.downloadAsync();
    if (!result) throw new Error('Download cancelled or timed out');
    return result;
  } catch (err) {
    throw timedOut ? new Error(`Timed out after ${ms}ms`) : err;
  } finally {
    clearTimeout(timer);
  }
}

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash * 33) ^ str.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function urlToLocalPath(url) {
  const ext = url.replace(/\?.*$/, '').split('.').pop().slice(0, 6) || 'img';
  return CACHE_DIR + djb2Hash(url) + '.' + ext;
}

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

async function loadMap() {
  if (_map) return _map;
  try {
    const raw = await AsyncStorage.getItem(MAP_KEY);
    _map = raw ? JSON.parse(raw) : {};
  } catch {
    _map = {};
  }
  return _map;
}

async function persistMap() {
  try {
    await AsyncStorage.setItem(MAP_KEY, JSON.stringify(_map));
  } catch {}
}

// Returns local file URI if the image is cached, otherwise returns the remote URL.
export async function resolveImageUri(remoteUrl) {
  if (!remoteUrl) return remoteUrl;
  const map = await loadMap();
  const localPath = map[remoteUrl];
  if (!localPath) return remoteUrl;
  try {
    const info = await FileSystem.getInfoAsync(localPath);
    if (info.exists) return localPath;
  } catch {}
  return remoteUrl;
}

// Download and locally cache an array of image URLs.
// onProgress(done, total) is called after each image attempt.
export async function downloadImages(urls, onProgress) {
  if (!urls || urls.length === 0) return 0;
  const unique = [...new Set(urls.filter(Boolean))];

  await ensureDir();
  const map = await loadMap();
  let done = 0;
  let changed = false;

  for (const url of unique) {
    try {
      if (map[url]) {
        const info = await FileSystem.getInfoAsync(map[url]);
        if (info.exists) {
          done++;
          if (onProgress) onProgress(done, unique.length);
          continue;
        }
      }
      const localPath = urlToLocalPath(url);
      const result = await downloadWithTimeout(url, localPath, 20000);
      if (result.status === 200) {
        map[url] = localPath;
        changed = true;
      }
    } catch {}
    done++;
    if (onProgress) onProgress(done, unique.length);
  }

  if (changed) {
    _map = map;
    await persistMap();
  }
  return done;
}

// Remove all cached images and the URL map.
export async function clearImageCache() {
  _map = {};
  try {
    await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
    await AsyncStorage.removeItem(MAP_KEY);
  } catch {}
}
