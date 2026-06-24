import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from './api';
import i18n from './i18n';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

const QUEUE_KEY = '@ascent_queue';
const API = 'https://climbing.ge/api/summit';

export async function queueAscent(data) {
  const queue = await getQueue();
  queue.push({ ...data, _id: `${Date.now()}_${Math.random().toString(36).slice(2)}` });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
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
    const { _id, image_uri, summit_id, ...fields } = item;
    try {
      if (image_uri) {
        const fd = new FormData();
        Object.entries(fields).forEach(([k, v]) => {
          if (v != null) fd.append(k, String(v));
        });
        const ext = (image_uri.split('.').pop() || 'jpg').toLowerCase();
        fd.append('image', { uri: image_uri, name: `ascent.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
        await api.post(`${API}/ascent/${summit_id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`${API}/ascent/${summit_id}`, fields);
      }
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
