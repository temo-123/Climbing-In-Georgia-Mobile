import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL } from './api';

// The account keeps the time of the user's last offline-guidebook download in
// users.use_offline_data_on_mobile (timestamp, null = never / removed):
//   POST   get_options/offline_download → stamps now() → { use_offline_data_on_mobile }
//   DELETE get_options/offline_download → sets null     → { use_offline_data_on_mobile: null }
// The server sets the time itself (phone clocks can be wrong). Older backends
// stored a boolean here — `true` is read as "downloaded, time unknown".
//
// A download often finishes with bad signal (or before the endpoint exists —
// unknown /api paths answer 200 with the SPA HTML), so a report that doesn't
// come back as JSON with the field is kept as pending and retried on the next
// login / app start.
const PENDING_KEY = '@offline_download_sync_pending';
const URL = `${API_BASE_URL}/get_options/offline_download`;

function isAnswer(data) {
  return !!data && typeof data === 'object' && 'use_offline_data_on_mobile' in data;
}

// → true when the account now has the new time.
export async function reportOfflineDownload() {
  try {
    const { data } = await api.post(URL, {});
    if (isAnswer(data)) {
      await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
      return true;
    }
  } catch {}
  await AsyncStorage.setItem(PENDING_KEY, 'post').catch(() => {});
  return false;
}

export async function clearOfflineDownloadOnAccount() {
  try {
    const { data } = await api.delete(URL);
    if (isAnswer(data)) {
      await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});
      return true;
    }
  } catch {}
  await AsyncStorage.setItem(PENDING_KEY, 'delete').catch(() => {});
  return false;
}

// Retry a report that didn't get through. → true when something was sent.
export async function flushPendingOfflineSync() {
  let pending = null;
  try { pending = await AsyncStorage.getItem(PENDING_KEY); } catch {}
  if (pending === 'post') return reportOfflineDownload();
  if (pending === 'delete') return clearOfflineDownloadOnAccount();
  return false;
}

// The account value as a Date, `true` (old boolean backend) or null.
export function accountOfflineDownload(user) {
  const v = user?.use_offline_data_on_mobile;
  if (!v) return null;
  if (v === true || v === 1) return true;
  const d = new Date(String(v).replace(' ', 'T'));
  return Number.isNaN(d.getTime()) ? true : d;
}
