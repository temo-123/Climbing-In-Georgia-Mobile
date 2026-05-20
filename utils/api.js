import { Platform } from 'react-native';
import axios from 'axios';

const CORS_PROXY = 'https://corsproxy.io/?';

export function corsUrl(url) {
  return Platform.OS === 'web' ? CORS_PROXY + url : url;
}

const api = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json',
  },
});

export default api;
