import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import api, { corsUrl, API_BASE_URL } from './api';
import i18n from './i18n';
import { withRecaptchaRetry } from './recaptcha';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const QUEUE_KEY = '@ascent_queue';
const API = `${API_BASE_URL}/summit`;

// Lightweight pub/sub so UI (e.g. a "N ascents pending" banner) can react
// live to queue/sync changes without polling AsyncStorage on a timer.
const listeners = new Set();

export function subscribeToQueue(fn) {
  listeners.add(fn);
  getQueue().then(fn);
  return () => listeners.delete(fn);
}

async function notifyListeners() {
  const queue = await getQueue();
  listeners.forEach(fn => fn(queue));
}

export async function queueAscent(data) {
  const queue = await getQueue();
  queue.push({ ...data, _id: `${Date.now()}_${Math.random().toString(36).slice(2)}` });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  notifyListeners();

  if (!IS_EXPO_GO) {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('summit.queued_notification_title'),
          body: i18n.t('summit.queued_notification_body', { count: queue.length }),
          channelId: 'ascent_sync',
        },
        trigger: null,
      });
    } catch {}
  }
}

export async function getQueue() {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function removeFromQueue(id) {
  const queue = await getQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue.filter(item => item._id !== id)));
}

// User-initiated discard of a queued ascent (e.g. from the pending-ascents
// list) — distinct from removeFromQueue's internal use after a successful
// upload, this one needs to notify subscribers since it doesn't happen as
// part of a syncQueue() pass (which notifies once at the end on its own).
export async function discardQueuedAscent(id) {
  await removeFromQueue(id);
  await notifyListeners();
}

// Records why a queued item's last sync attempt failed, without dropping it
// from the queue — otherwise a stuck item retries silently forever with no
// way for the user to ever find out something is wrong (see SummitsListScreen's
// pending-ascents banner, which surfaces this).
async function markItemError(id, message) {
  const queue = await getQueue();
  const next = queue.map(item => (item._id === id
    ? { ...item, lastError: message, lastErrorAt: new Date().toISOString() }
    : item));
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
}

export function describeError(err) {
  if (!err?.isAxiosError) return err?.message || 'reCAPTCHA failed';
  if (!err.response) {
    // Axios collapses DNS failure, connection refused, TLS error, and dropped
    // connection into the same generic "Network Error" message — the `code`
    // (ECONNABORTED/timeout, ERR_NETWORK, etc.) is what actually distinguishes
    // them, so surface it instead of leaving the user with just "Network Error".
    const code = err.code ? ` (${err.code})` : '';
    return `${err.message || 'Network error'}${code}`;
  }
  const fieldErrors = err.response.data?.errors;
  if (fieldErrors) return Object.values(fieldErrors).flat().join(' ');
  return err.response.data?.message || `Server error (${err.response.status})`;
}

// A single running sync at a time — otherwise the network-reconnect listener
// and the AppState foreground listener in App.js can both fire syncQueue()
// within milliseconds of each other and race to upload the same items twice.
let syncInFlight = null;

export function syncQueue() {
  if (syncInFlight) return syncInFlight;
  syncInFlight = runSync().finally(() => { syncInFlight = null; });
  return syncInFlight;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// A queued item can sit on the device across many app sessions before it
// finally gets a chance to sync — long enough for Android to reclaim the
// ImagePicker temp/cache file its photo pointed at. Uploading a FormData part
// backed by a file that no longer exists fails at the transport layer (shows
// up to the user as a bare "Network Error", indistinguishable from a real
// connectivity problem) instead of a clean, fixable error. Check first and
// degrade to submitting without the photo rather than losing the whole ascent.
async function resolvePhotoUri(image_uri) {
  if (!image_uri) return null;
  try {
    const info = await FileSystem.getInfoAsync(image_uri);
    return info.exists ? image_uri : null;
  } catch {
    return null;
  }
}

async function uploadOne(item) {
  const { summit_id, image_uri, url_title, summit_title, queue_reason, ...fields } = item;
  const photoUri = await resolvePhotoUri(image_uri);
  return withRecaptchaRetry('make_ascent', async (recaptcha_token) => {
    const fieldsWithCaptcha = { ...fields, recaptcha_token };
    if (photoUri) {
      const fd = new FormData();
      Object.entries(fieldsWithCaptcha).forEach(([k, v]) => {
        if (v == null) return;
        fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
      });
      const ext = (photoUri.split('.').pop() || 'jpg').toLowerCase();
      // Field name must be "photo" — the backend reads $request->file('photo').
      fd.append('photo', { uri: photoUri, name: `ascent.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      // Do not set Content-Type manually — RN/axios must generate the multipart boundary itself.
      // Longer timeout than the shared default — see SubmitAscentScreen.jsx.
      return api.post(corsUrl(`${API}/ascent/${summit_id}`), fd, { timeout: 60000 });
    }
    // Also reached when a photo was queued but its local file is gone — the
    // ascent itself still uploads, just without the photo.
    return api.post(corsUrl(`${API}/ascent/${summit_id}`), fieldsWithCaptcha, { timeout: 30000 });
  });
}

// A queued item's first attempt racing right after a reconnect can hit a
// connection that isn't fully usable yet (see the App.js reconnect-debounce
// comment) — retry a genuine transport-level failure a couple of times in
// place before giving up and asking the user to tap "Sync Now" again.
async function uploadWithRetry(item) {
  const MAX_ATTEMPTS = 3;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await uploadOne(item);
    } catch (err) {
      const isTransportFailure = err?.isAxiosError && !err.response;
      if (attempt === MAX_ATTEMPTS || !isTransportFailure) throw err;
      await sleep(1500 * attempt);
    }
  }
}

async function runSync() {
  const queue = await getQueue();
  if (!queue.length) return { uploaded: 0, failed: 0 };

  let uploaded = 0;
  let failed = 0;

  for (const item of queue) {
    const { _id, lastError, lastErrorAt, ...uploadItem } = item;
    try {
      await uploadWithRetry(uploadItem);
      await removeFromQueue(_id);
      uploaded++;
    } catch (err) {
      failed++;
      await markItemError(_id, describeError(err));
    }
  }

  notifyListeners();

  if (uploaded > 0 && !IS_EXPO_GO) {
    try {
      const Notifications = await import('expo-notifications');
      await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('summit.sync_notification_title'),
          body: i18n.t('summit.sync_notification_body', { count: uploaded }),
          channelId: 'ascent_sync',
        },
        trigger: null,
      });
    } catch {}
  }

  return { uploaded, failed };
}
