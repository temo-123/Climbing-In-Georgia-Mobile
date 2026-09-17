import * as WebBrowser from 'expo-web-browser';
import api, { API_BASE_URL } from './api';

const API_BASE = API_BASE_URL;

// climbinggeorgia://oauth-callback — must match app.json's expo.scheme and
// the backend's services.mobile_app.scheme (see SocialController::callback).
const REDIRECT_URL = 'climbinggeorgia://oauth-callback';

// GET /login/status → { google: bool, facebook: bool }. A provider is only
// `true` once client_id/client_secret/redirect are all set on the backend —
// use this to hide the corresponding button rather than showing a button
// that will fail.
export async function getSocialLoginStatus() {
  const res = await api.get(`${API_BASE}/login/status`);
  return res.data;
}

// Runs the full Google/Facebook OAuth flow in an in-app browser and resolves
// to whatever the backend's callback appended to the deep-link redirect:
//   { status: 'login', token }
//   { status: 'registratione', new_user_email }
//   { message, is_banned? }  (error / banned — no `status` key)
// Throws only if the user closes the browser without completing the flow.
export async function startSocialLogin(provider) {
  const { data } = await api.get(`${API_BASE}/login/${provider}`, { params: { mobile: 1 } });

  const result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);

  if (result.type !== 'success' || !result.url) {
    throw new Error('social_login_cancelled');
  }

  const query = result.url.split('?')[1] || '';
  return Object.fromEntries(new URLSearchParams(query));
}
