# OAuth Setup for the Mobile App: Google, Facebook, Strava

How the Climbing In Georgia app (Expo, `ge.climbing.app`, URL scheme `climbinggeorgia`) signs in with Google / Facebook and connects Strava, what to set up in each provider's console, and what the backend has to provide.

**No keys in the app.** No client id, secret, client token, SHA-1 or key hash: the app reuses the backend's existing OAuth apps through a system browser tab. The web setup (OAuth apps, consent screens, backend `.env`) is in the backend repo, `docs/OAUTH_SETUP.md`.

| Provider | Used for | App code | Status (2026-11-13) |
|---|---|---|---|
| Google | Sign in / sign up | `utils/socialAuth.js`, `components/auth/SocialLoginButtons.jsx` | Backend live (2026-11-13). Waiting for [checklist](#setup-checklist) steps 1 and 5 |
| Facebook | Sign in / sign up | same | Same as Google |
| Strava | Import an activity as a summit ascent's GPS track | — | Not in the app yet. Plan in [Strava](#strava) |

## Table of Contents

- [Setup checklist](#setup-checklist)
- [Live status](#live-status)
- [How it works](#how-it-works)
- [Why not the native SDKs](#why-not-the-native-sdks)
- [Google console](#google-console)
- [Facebook console](#facebook-console)
- [Backend: mobile redirect flow](#backend-mobile-redirect-flow)
- [Strava](#strava)
- [App configuration](#app-configuration)
- [Testing](#testing)
- [Store requirements](#store-requirements)
- [Troubleshooting](#troubleshooting)
- [Reference](#reference)

---

## Setup checklist

Do these in order. Social login works once 1–4 are done.

| # | Where | What | Done? (2026-11-13) |
|---|---|---|---|
| 1 | This repo | Remove the unused native SDKs: `npm uninstall @react-native-google-signin/google-signin react-native-fbsdk-next`. Otherwise an **unconfigured** Facebook SDK is linked into the next build | **No**, both are still in `package.json` |
| 2 | Backend | The [mobile redirect flow](#backend-mobile-redirect-flow) | **Yes**, commit `3372a97`, live |
| 3 | Google console | Add `https://user.climbing.ge/api/login/google/mobile_callback` to the web client's redirect URIs | **Yes**: Google accepts it (consent opens, no `redirect_uri_mismatch`) |
| 4 | Facebook console | Add `https://user.climbing.ge/api/login/facebook/mobile_callback` to Valid OAuth Redirect URIs | Can't be checked with curl (Facebook blocks it). Confirm on the phone |
| 5 | EAS | New build: `eas build -p android --profile preview`, then [test](#testing) | After 1–4 |
| 6 | Backend + app | Strava: [plan](#strava) | Later |

## Live status

Re-run this to see where the backend is:

```bash
curl -s https://climbing.ge/api/login/status; echo
curl -s 'https://climbing.ge/api/login/google?mobile=1&nonce=test1234567890abcd' | grep -o 'redirect_uri=[^&"]*'
curl -s -o /dev/null -w 'mobile_callback: %{http_code} %{redirect_url}\n' 'https://climbing.ge/api/login/google/mobile_callback?error=access_denied'
curl -s -o /dev/null -w 'exchange: %{http_code}\n' -X POST -H 'Accept: application/json' -H 'Content-Type: application/json' -d '{"code":"x","nonce":"y"}' https://climbing.ge/api/login/mobile/exchange
```

| Check | Expected | Result on 2026-11-13 (after deploy) |
|---|---|---|
| `/login/status` | `{"google":true,"facebook":true,"mobile":true}` | ✔ |
| `?mobile=1&nonce=…` URL | `redirect_uri=…/api/login/google/mobile_callback` + `state` | ✔ (Google and Facebook) |
| `?mobile=1&nonce=bad` | `422 Invalid nonce.` | ✔ |
| `mobile_callback` with a real state + fake code | `302 climbinggeorgia://oauth-callback?error=provider_failed` | ✔ |
| the same state again | `…?error=invalid_state` (single use) | ✔ |
| `mobile_callback?error=access_denied` | `…?error=cancelled` | ✔ |
| `mobile/exchange` with a fake code | `410` JSON | ✔ |

Still not checked: a real Google / Facebook account end to end. That needs the app build. Production still returns stack traces on errors: set `APP_DEBUG=false`.

---|---|---|
| `/login/status` | `{"google":true,"facebook":true,"mobile":true}` | `{"google":true,"facebook":true}`, no `mobile`, so **the app hides the buttons** |
| `?mobile=1` URL | `redirect_uri=https%3A%2F%2Fuser.climbing.ge%2Fapi%2Flogin%2Fgoogle%2Fmobile_callback` | `…%2Flogin%2Fgoogle%2Fcallback`, the website page |
| `mobile_callback?error=…` | `302` to `climbinggeorgia://oauth-callback?message=…` | `200` website HTML (route missing) |
| `exchange` (fake code) | `410` JSON | `405` (route missing). Production also returns the stack trace: set `APP_DEBUG=false` |

---

## How it works

```
App                                    Backend (climbing.ge)                          Provider
 │ GET /api/login/google?mobile=1&nonce=N ─▶│  (keeps only sha256(N), state → cache 15 min)
 │◀── { url } (redirect_uri = …/api/login/google/mobile_callback, state)                  │
 │ openAuthSessionAsync(url, 'climbinggeorgia://oauth-callback')                           │
 │ ─── system browser tab ────────────────────────────────────────────────────────────▶ │ consent
 │                                       │◀── 302 /api/login/google/mobile_callback?code&state
 │                                       │ state (single use) → Socialite user → profile cached
 │                                       │ under a one-time CODE (5 min)
 │◀── 302 climbinggeorgia://oauth-callback?code=CODE&provider=google ──────────────────────│
 │     or ?error=cancelled | no_email | provider_failed | invalid_state                    │
 │ POST /api/login/mobile/exchange { code, nonce: N, birthday? } ─▶│ sha256(N) must match │
 │◀── { status:'login', token, is_underage }  or  { status:'registratione', new_user_email, setup_key }
```

- `status: 'login'` → `loginWithToken(token)`. `status: 'registratione'` → `social_create_password` → `POST /api/login/social/create_password/{email}` with `{ setup_key, data: { password, password_confirmation } }`.
- Deep-link errors: `cancelled` (the user closed or denied the consent; the app shows nothing), `no_email`, `provider_failed`, `invalid_state` (expired or reused). Exchange errors: `410` code expired or used, `403` nonce mismatch ("started on another device"), `403 is_banned` (the account gate shows "Account suspended"), `422` no e-mail.
- **Why a one-time `code`:** the API token never appears in a URL. **Why the `nonce`:** only the app that started the sign-in knows it (the server stores its hash), so a deep link caught by another app can't be exchanged.
- `birthday` (from the Register form) is sent with the **exchange**, and stored only for a new account.
- The buttons show only when `GET /api/login/status` returns `mobile: true` *and* the provider is configured. On a backend without the mobile flow they stay hidden, instead of opening the website's login form.
- Uses Chrome Custom Tabs / `ASWebAuthenticationSession`, a real browser, which Google allows. Never move this into a `react-native-webview`: Google blocks OAuth in embedded WebViews (`disallowed_useragent`).

## Why not the native SDKs

The backend also has `POST /api/login/{provider}/mobile` (native SDK token → login). It works, but the app would need the Facebook App ID + **Client Token compiled in** and the Facebook SDK. It would also need an Android OAuth client per signing key (EAS + Play) in Google Cloud and Facebook key hashes, and it can't run in Expo Go. The browser flow needs none of that, so the app doesn't use the native endpoint (leaving it on the backend does no harm).

---

## Google console

[console.cloud.google.com](https://console.cloud.google.com) → the project of the **web** client (`280938897359-…`, the backend's `GOOGLE_CLIENT_ID`) → *APIs & Services → Credentials → `climbing.ge web` → Authorized redirect URIs → Add*:

```
https://user.climbing.ge/api/login/google/mobile_callback
```

Keep the web URI. The consent screen must be **In production**. Nothing else: no Android / iOS client, no SHA-1.

## Facebook console

[developers.facebook.com/apps](https://developers.facebook.com/apps) → app `1187261237293649` → *Use cases → Authentication and account creation → Customize → Settings → Valid OAuth Redirect URIs → add*:

```
https://user.climbing.ge/api/login/facebook/mobile_callback
```

Keep the web URI. The app must be **Live**, with permissions `email` + `public_profile`. No Android platform, key hash or client token.

---

## Backend: mobile redirect flow

**Deployed** (commit `3372a97`, `SocialController::mobile_redirect / mobile_callback / mobile_exchange`). The deployed contract differs from the prompt below in three details, and the app follows the deployed version:
1. The deep link carries `code` + `provider`, not the nonce. The nonce is checked at the exchange.
2. Errors come as `?error=<code>`, not `?message=`.
3. `birthday` goes to the exchange.

The original prompt, for reference:

```
In the climbing.ge Laravel backend, add the mobile-app redirect flow for Google / Facebook login. The Expo
app opens the OAuth URL in a system browser tab (expo-web-browser openAuthSessionAsync), which can only read
the FINAL URL it lands on: climbinggeorgia://oauth-callback. No keys in the app. Keep the existing web flow and
the existing POST /api/login/{provider}/mobile (native token) endpoint unchanged; reuse
SocialController::login_or_register() for the user logic.

1. Config: config/services.php 'mobile_app' => ['scheme' => env('MOBILE_APP_SCHEME', 'climbinggeorgia')];
   google / facebook get 'mobile_redirect' => env('GOOGLE_MOBILE_URL') / env('FACEBOOK_MOBILE_URL'), defaulting to
   APP_SSH . USER_PAGE_URL . "/api/login/{provider}/mobile_callback" (same style as the Strava redirect).

2. GET /api/login/{provider}?mobile=1&nonce=<16-128 chars [A-Za-z0-9]>[&birthday=YYYY-MM-DD]
   (SocialController::redirect): when mobile=1, validate nonce (and birthday: date|before:today|after:1900-01-01),
   state = Crypt::encryptString(json_encode(['m'=>1,'n'=>nonce,'b'=>birthday,'t'=>time()])), and build the URL
   with ->stateless()->redirectUrl(mobile_redirect)->with(['state' => $state]). Ignore ?return. Answer { url }.

3. New public route GET /api/login/{provider}/mobile_callback (throttle:30,1) → SocialController::mobile_callback():
   - decrypt state (invalid or older than 15 min → error redirect); ?error=… (user cancelled) → error redirect;
   - Socialite::driver($provider)->stateless()->redirectUrl(mobile_redirect)->user() (the same redirect URL as
     step 2, or Google rejects the code exchange);
   - $response = login_or_register(provider, id, email, name, avatar, [], birthday from state);
   - 2xx: $code = Str::random(48); Cache::put('social_mobile:'.hash('sha256',$code), ['n'=>nonce,
     'payload'=>$response->getData(true)], now()->addMinutes(2));
     redirect()->away("{scheme}://oauth-callback?" . http_build_query(['code'=>$code,'nonce'=>nonce]));
   - non-2xx (no e-mail, banned): redirect()->away("{scheme}://oauth-callback?" . http_build_query([
     'message'=>data.message, 'is_banned'=>data.is_banned ? 1 : null, 'nonce'=>nonce]));
   - EVERY path ends with a redirect to the scheme — never JSON or an HTML page (the user would be stuck in the tab).

4. New public route POST /api/login/mobile/exchange { code, nonce } (throttle:30,1): Cache::pull the entry
   (single use); missing → 410 {"message":"This sign-in expired. Please try again."}; nonce must hash_equals the
   stored one (else 410). Return the stored payload as JSON with status 200 — exactly what callback() returns
   ({status:'login', token, is_underage} or {status:'registratione', new_user_email, setup_key, is_underage}).
   It's a token-less POST, so the age / e-mail gates don't apply; make sure no other middleware blocks it.

5. GET /api/login/status: add "mobile": true when the mobile flow is available (scheme set and both routes
   exist). The app shows the buttons only when mobile is true.

6. Feature tests (mock Socialite): existing user → scheme redirect with code+nonce → exchange returns token;
   second exchange of the same code → 410; wrong nonce → 410; new user → registratione + setup_key accepted by
   create_password; banned → is_banned=1 in the redirect; ?error=access_denied → message redirect; invalid
   state → message redirect; web callback unchanged.

7. Docs: docs/AUTH.md + docs/OAUTH_SETUP.md — the mobile flow and the two redirect URIs to register:
   Google client "Authorized redirect URIs" and Facebook "Valid OAuth Redirect URIs":
   https://user.climbing.ge/api/login/{google|facebook}/mobile_callback
```

---

## Strava

**Not in the app yet.** On the web, a summit ascent can import a Strava activity as its GPS track (backend `docs/SUMMIT.md → GPS tracks`). This is how to add it to the app without a second Strava app.

### Console

[strava.com/settings/api](https://www.strava.com/settings/api), the existing `climbing.ge` API application. **Nothing to change:** the Authorization Callback Domain stays `user.climbing.ge`. The app reuses the backend callback `https://user.climbing.ge/api/strava/callback`, which is on that domain. Strava allows only **one** callback domain per app, so don't point Strava at `climbinggeorgia://` directly. The token exchange needs the client secret anyway, which must never be in the app.

Before releasing it in the app, request more athlete capacity (a new Strava app is limited to one athlete) through the developer program form on the API settings page.

### Backend change needed

Today `StravaCallbackController` always redirects to the website (`/my_ascents?strava=…`). For the app it must redirect to the scheme instead:

- `GET /api/strava/connect_url?mobile=1` → put `m: 1` into the encrypted `state` (next to `u` and `t`).
- In the callback, when the state has `m: 1`, redirect to `climbinggeorgia://strava-callback?strava=connected` (or `denied` / `scope` / `error`) instead of the web page.

Prompt:

```
In the climbing.ge Laravel backend, let the mobile app connect Strava. GET /api/strava/connect_url accepts
?mobile=1; StravaService::authorize_url() then adds "m":1 to the encrypted state JSON. StravaCallbackController
reads it via StravaService::user_from_state() (return the decoded array, or add a helper) and, when m=1,
redirects to config('services.mobile_app.scheme') . '://strava-callback?strava={connected|denied|scope|error}'
instead of the user page — on every path, including the error ones. The redirect_uri sent to Strava stays the
same (https://user.climbing.ge/api/strava/callback), so the Strava app's callback domain doesn't change. Add
feature tests for the mobile and web variants.
```

### App side (when it's built)

1. `GET /api/strava/status` → show the feature only when `configured: true`.
2. `GET /api/strava/connect_url?mobile=1` → `WebBrowser.openAuthSessionAsync(url, 'climbinggeorgia://strava-callback')` → read `strava=` from the returned URL.
3. Then `GET /api/strava/activities?date=` (±3 days of the ascent) and the same import call the web uses. Disconnect is `DELETE /api/strava/disconnect`, which stays open for unverified e-mails.
4. **Strava API terms:** a user's Strava data may be shown only to that user. Keep only derived numbers, never the track points (same as the web).

---

## App configuration

Nothing secret, nothing per provider:

| File | Key | Value |
|---|---|---|
| `app.json` | `expo.scheme` | `climbinggeorgia` (must equal the backend's `MOBILE_APP_SCHEME`) |
| `utils/socialAuth.js` | `REDIRECT_URL` | `climbinggeorgia://oauth-callback` |

Changing the scheme needs a new EAS build (it's native).

---

## Testing

The `climbinggeorgia://` redirect needs a dev-client or EAS build (Expo Go can't register the scheme): `eas build -p android --profile preview`.

1. `curl -s https://climbing.ge/api/login/status` → `{"google":true,"facebook":true,"mobile":true}`. Without `mobile` the buttons are hidden by design.
2. `curl -s 'https://climbing.ge/api/login/google?mobile=1&nonce=test1234567890ab'` → the URL contains `redirect_uri=https%3A%2F%2Fuser.climbing.ge%2Fapi%2Flogin%2Fgoogle%2Fmobile_callback`.
3. Phone: Login → **Continue with Google** → browser tab → pick an account that has a climbing.ge account → the tab closes and you're logged in.
4. An account without one → *Create a Password* → logged in. On the Register screen a birthday picked first is stored on the new account.
5. Close the tab halfway → nothing happens (no error).
6. Same for Facebook.

---

## Store requirements

- **Google Play:** in-app and web account deletion exist. List them in the Data safety form.
- **Apple App Store (if the iOS build is published):** guideline 4.8 requires **Sign in with Apple** next to Google / Facebook login. The backend has no Apple provider. Add one, or hide the buttons on iOS.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| No Google / Facebook buttons | `GET /login/status` has no `mobile: true` (backend flow not deployed), or the provider isn't configured |
| The tab ends on the website's login form | The backend ignored `mobile=1` (old backend). An app with this code hides the buttons in that case |
| Google `redirect_uri_mismatch` | The `mobile_callback` URI isn't in the web client's Authorized redirect URIs, or the authorize and exchange steps use different redirect URLs |
| Facebook "URL blocked" | The `mobile_callback` URI is missing from Valid OAuth Redirect URIs |
| "Sign-in couldn't be confirmed" | Deep link `provider_failed` / `invalid_state`, or the exchange answered `410` (code older than 5 min or already used) / `403` (nonce mismatch). Try again |
| Nothing happens in Expo Go | Expected. Use a dev-client / EAS build |
| "This link has expired…" on Create a Password | `setup_key` missing, used or older than 1 hour. Sign in again |

---

## Reference

| Method | Path | Used by the app | Notes |
|---|---|---|---|
| GET | `/api/login/status` | yes | `{ google, facebook, mobile }` |
| GET | `/api/login/{provider}?mobile=1&nonce=…` | yes | `{ url }`; `422` invalid nonce |
| GET | `/api/login/{provider}/mobile_callback` | via browser | Always ends in `climbinggeorgia://oauth-callback?code=…&provider=…` or `?error=…` |
| POST | `/api/login/mobile/exchange` | yes | `{ code, nonce, birthday? }` → login answer; `410` expired / used, `403` wrong nonce |
| POST | `/api/login/social/create_password/{email}` | yes | `{ setup_key, data }` → `{ token }`; `403` = key expired |
| POST | `/api/login/{provider}/mobile` | no | Native-SDK token login (exists, unused by the app) |
| GET | `/api/strava/status`, `/connect_url?mobile=1`, `/activities`, DELETE `/disconnect` | planned | See [Strava](#strava) |

Related: [AUTH.md](AUTH.md) and the backend repo's `docs/OAUTH_SETUP.md`.
