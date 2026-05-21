import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = FileSystem.documentDirectory + 'img_cache/';
const MAP_KEY = '@image_cache_map';

let _map = null;

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
      const result = await FileSystem.downloadAsync(url, localPath);
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
