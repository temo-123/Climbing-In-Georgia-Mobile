import * as WebBrowser from 'expo-web-browser';
import api, { API_BASE_URL } from './api';

const API_BASE = API_BASE_URL;

// Google / Facebook sign-in through the backend's OAuth flow in a system
// browser tab (Chrome Custom Tabs / ASWebAuthenticationSession) — no native
// SDK and no client id, secret or token in the app (docs/OAUTH.md).
//
//   1. GET  /api/login/{provider}?mobile=1&nonce=N → { url }
//      (nonce: 16–128 chars [A-Za-z0-9_.~-], the server keeps only its hash)
//      The provider returns to the backend's /api/login/{provider}/mobile_callback
//      (registered in the Google / Facebook console), not to the website.
//   2. The tab ends on climbinggeorgia://oauth-callback?code=C&provider=…
//      or ?error=cancelled | no_email | provider_failed | invalid_state —
//      openAuthSessionAsync closes it there.
//   3. POST /api/login/mobile/exchange { code: C, nonce: N[, birthday] } →
//      { status: 'login', token, is_underage }
//      { status: 'registratione', new_user_email, setup_key, is_underage }
//      410 = code expired / used (5 min, single use), 403 = nonce doesn't match
//      (sign-in started elsewhere), 403 is_banned, 422 no e-mail.
//
// The one-time `code` keeps the API token out of the URL, and only the app
// that started the sign-in knows N, so a stolen deep link is useless.
// (Backend: SocialController::mobile_redirect / mobile_callback / mobile_exchange.)
//
// Must match app.json expo.scheme and the backend's MOBILE_APP_SCHEME.
export const REDIRECT_URL = 'climbinggeorgia://oauth-callback';

// GET /login/status → { google, facebook, mobile }. `mobile: true` means the
// backend has the app redirect flow above; without it the buttons stay
// hidden (the plain web flow would end on the website's login form).
export async function getSocialLoginStatus() {
  const res = await api.get(`${API_BASE}/login/status`);
  return res.data;
}

function randomNonce() {
  let out = '';
  const bytes = new Uint8Array(24);
  try {
    // Hermes has crypto.getRandomValues in recent React Native versions.
    globalThis.crypto.getRandomValues(bytes);
    bytes.forEach((b) => { out += b.toString(16).padStart(2, '0'); });
  } catch {
    for (let i = 0; i < 48; i++) out += Math.floor(Math.random() * 16).toString(16);
  }
  return out;
}

function parseQuery(url) {
  const query = (url.split('?')[1] || '').split('#')[0];
  return Object.fromEntries(new URLSearchParams(query));
}

export class SocialLoginError extends Error {
  constructor(message, extra = {}) {
    super(message);
    Object.assign(this, extra);
  }
}

// Full flow. Resolves to the backend's login answer; throws
// 'social_login_cancelled' when the user closes the tab or declines, a
// SocialLoginError whose message is the deep link's `error` code
// (no_email | provider_failed | invalid_state | no_code), or the axios error
// of the exchange call.
//
// Every failure carries `err.step` ('start' | 'browser' | 'callback' |
// 'exchange') so the message under the buttons can say where it broke.
function atStep(step, err) {
  if (err && typeof err === 'object' && !err.step) err.step = step;
  return err;
}

export async function startSocialLogin(provider, { birthday } = {}) {
  const nonce = randomNonce();
  let data;
  try {
    ({ data } = await api.get(`${API_BASE}/login/${provider}`, { params: { mobile: 1, nonce } }));
  } catch (err) { throw atStep('start', err); }
  if (!data?.url) throw atStep('start', new SocialLoginError('no_url'));

  let result;
  try {
    // A tab left open by an earlier attempt blocks a new one on Android.
    try { WebBrowser.dismissAuthSession?.(); } catch {}
    result = await WebBrowser.openAuthSessionAsync(data.url, REDIRECT_URL);
  } catch (err) { throw atStep('browser', err); }
  if (result.type !== 'success' || !result.url) {
    throw new Error('social_login_cancelled');
  }

  const q = parseQuery(result.url);
  if (q.error === 'cancelled') throw new Error('social_login_cancelled');
  if (q.error || !q.code) throw atStep('callback', new SocialLoginError(q.error || 'no_code'));

  const body = { code: q.code, nonce };
  if (birthday) body.birthday = birthday;
  try {
    const res = await api.post(`${API_BASE}/login/mobile/exchange`, body);
    return res.data;
  } catch (err) { throw atStep('exchange', err); }
}
