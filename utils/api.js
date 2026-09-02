import { Platform } from 'react-native';
import axios from 'axios';

const CORS_PROXY = 'https://corsproxy.io/?';

// Overridable per environment (e.g. a staging backend) via EXPO_PUBLIC_*
// vars — see .env.example. Every API call in the app should build off this
// instead of hardcoding the climbing.ge URL.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://climbing.ge/api';

const PUBLIC_IMAGES_BASE = process.env.EXPO_PUBLIC_IMG_BASE_URL || 'https://climbing.ge/public/images/';

// One base path per image category served under public/images/ — see
// CLAUDE.md's "Image URLs" table for what each corresponds to.
export const IMG_BASES = {
  outdoor: PUBLIC_IMAGES_BASE + 'outdoor_img/',
  ice: PUBLIC_IMAGES_BASE + 'ice_img/',
  indoor: PUBLIC_IMAGES_BASE + 'indoor_img/',
  mountRoute: PUBLIC_IMAGES_BASE + 'mount_route_img/',
  mountRouteDescription: PUBLIC_IMAGES_BASE + 'mount_route_description_img/',
  other: PUBLIC_IMAGES_BASE + 'other_img/',
  event: PUBLIC_IMAGES_BASE + 'event_img/',
  gallery: PUBLIC_IMAGES_BASE + 'article_gallery_img/',
  sector: PUBLIC_IMAGES_BASE + 'sector_img/',
  sectorLocal: PUBLIC_IMAGES_BASE + 'sector_local_img/',
  summitAscent: PUBLIC_IMAGES_BASE + 'summit_ascents_img/',
  userProfile: PUBLIC_IMAGES_BASE + 'user_profil_img/',
};

export function corsUrl(url) {
  return Platform.OS === 'web' ? CORS_PROXY + url : url;
}

// API filenames contain { } which are invalid in URIs — encode them.
export function imgUri(base, filename) {
  if (!filename) return null;
  return base + filename.replace(/{/g, '%7B').replace(/}/g, '%7D');
}

const api = axios.create({
  timeout: 20000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-App-Client': 'mobile',
  },
});

export default api;
