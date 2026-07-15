import React, { useRef } from 'react';
import { View } from 'react-native';
import WebView from 'react-native-webview';

// reCAPTCHA v3 site keys are bound to a registered domain/origin. A WebView
// loaded via source={{ html }} (even with a baseUrl) never gives Google's
// domain validation a real navigated origin — this is why mobile submissions
// were rejected before. Instead this WebView navigates (source={{ uri }}) to
// a small static page actually hosted on climbing.ge, so the origin is real.
// See public/recaptcha-mobile.html in the backend repo for that page's
// content — it's generic (reads ?sitekey=&action= from its own query
// string), so the site key below is the only thing that needs to match.
const HOST_URL = process.env.EXPO_PUBLIC_RECAPTCHA_HOST_URL || 'https://climbing.ge/recaptcha-mobile.html';

// v3 site key registered specifically for this mobile app against the above
// page's domain — a *separate* key from the web frontend's. Configured via
// EXPO_PUBLIC_RECAPTCHA_V3_MOBILE_SITE_KEY (see .env.example). The matching
// secret does NOT go here — it belongs on the backend as
// GOOGLE_CAPTCHA_V3_MOBILE_SECRET_KEY, which ReCaptchaV3Service::verifySmart()
// already tries (at a lower 0.3 threshold) whenever the primary web secret
// doesn't validate a token. Backend needs no further changes for this.
const SITE_KEY = process.env.EXPO_PUBLIC_RECAPTCHA_V3_MOBILE_SITE_KEY;

let webviewRef = null;
let pendingResolver = null;

function buildUri(action) {
  const params = new URLSearchParams({ sitekey: SITE_KEY || '', action });
  return `${HOST_URL}?${params.toString()}`;
}

function settle(data) {
  if (!pendingResolver) return;
  const { resolve, reject, timeout } = pendingResolver;
  pendingResolver = null;
  clearTimeout(timeout);
  if (typeof data === 'string' && data.startsWith('ERROR:')) {
    reject(new Error(data.slice(6)));
  } else {
    resolve(data);
  }
}

export function RecaptchaHost() {
  const ref = useRef(null);

  function handleMessage(event) {
    settle(event.nativeEvent.data);
  }

  function handleError(syntheticEvent) {
    // WebView-level failure (DNS, offline, TLS, etc.) — surface it immediately
    // rather than waiting out the full getRecaptchaToken timeout.
    settle(`ERROR:${syntheticEvent?.nativeEvent?.description || 'reCAPTCHA page failed to load'}`);
  }

  return (
    // Deliberately NOT 0x0 — Android's WebView frequently fails to fully
    // initialize (skips layout/rendering, never fires load callbacks
    // reliably) for a view with zero measured area, which showed up as
    // intermittent "reCAPTCHA is not ready yet" on real devices even long
    // after app launch. 1x1 + absolute positioning off-screen keeps it
    // invisible while giving Android a real surface to render into.
    <View style={{ position: 'absolute', top: -1000, left: 0, width: 1, height: 1, overflow: 'hidden' }}>
      <WebView
        ref={(r) => { ref.current = r; webviewRef = r; }}
        source={{ uri: buildUri('login') }}
        onMessage={handleMessage}
        onError={handleError}
        onHttpError={handleError}
        javaScriptEnabled
        domStorageEnabled
        incognito={false}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
      />
    </View>
  );
}

export function getRecaptchaToken(action = 'login', timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!webviewRef) {
      reject(new Error('reCAPTCHA is not ready yet'));
      return;
    }
    if (!SITE_KEY) {
      reject(new Error('EXPO_PUBLIC_RECAPTCHA_V3_MOBILE_SITE_KEY is not configured'));
      return;
    }
    const timeout = setTimeout(() => {
      pendingResolver = null;
      reject(new Error('reCAPTCHA timed out'));
    }, timeoutMs);
    pendingResolver = { resolve, reject, timeout };
    // v3 tokens are meant to be short-lived and single-use per action, so
    // navigate fresh each call rather than reuse whatever the page last
    // executed (including its own initial on-mount load, above).
    webviewRef.injectJavaScript(`window.location.href = ${JSON.stringify(buildUri(action))}; true;`);
  });
}

export function isRecaptchaFailure(err) {
  return err?.response?.status === 422 && /recaptcha/i.test(err?.response?.data?.message || '');
}
// Old name some call sites still import.
export const isRecaptchaScoreFailure = isRecaptchaFailure;

// reCAPTCHA v3 scores vary between calls, and a mobile token now has two
// secrets it can validate against server-side (see verifySmart() above) — on
// a recaptcha-specific 422 (not a validation/network error), mint a fresh
// token and retry once before surfacing the failure to the user.
export async function withRecaptchaRetry(action, requestFn, maxAttempts = 2) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const token = await getRecaptchaToken(action);
    try {
      return await requestFn(token);
    } catch (err) {
      if (attempt === maxAttempts || !isRecaptchaFailure(err)) throw err;
    }
  }
}
