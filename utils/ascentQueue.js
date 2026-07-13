import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from './api';
import i18n from './i18n';
import { withRecaptchaRetry } from './recaptcha';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const QUEUE_KEY = '@ascent_queue';
const API = 'https://climbing.ge/api/summit';

export async function queueAscent(data) {
  const queue = await getQueue();
  queue.push({ ...data, _id: `${Date.now()}_${Math.random().toString(36).slice(2)}` });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

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

export async function syncQueue() {
  const queue = await getQueue();
  if (!queue.length) return { uploaded: 0, failed: 0 };

  let uploaded = 0;
  let failed = 0;

  for (const item of queue) {
    const { _id, image_uri, summit_id, url_title, ...fields } = item;
    try {
      await withRecaptchaRetry('make_ascent', async (recaptcha_token) => {
        const fieldsWithCaptcha = { ...fields, recaptcha_token };
        if (image_uri) {
          const fd = new FormData();
          Object.entries(fieldsWithCaptcha).forEach(([k, v]) => {
            if (v == null) return;
            fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
          });
          const ext = (image_uri.split('.').pop() || 'jpg').toLowerCase();
          // Field name must be "photo" — the backend reads $request->file('photo').
          fd.append('photo', { uri: image_uri, name: `ascent.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
          // Do not set Content-Type manually — RN/axios must generate the multipart boundary itself.
          // Longer timeout than the shared default — see SubmitAscentScreen.jsx.
          return api.post(`${API}/ascent/${summit_id}`, fd, { timeout: 60000 });
        }
        return api.post(`${API}/ascent/${summit_id}`, fieldsWithCaptcha);
      });
      await removeFromQueue(_id);
      uploaded++;
    } catch {
      failed++;
    }
  }

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
