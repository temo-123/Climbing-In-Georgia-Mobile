# Authentication — Mobile App

Documentation for the login/register/auth flow in the Climbing In Georgia React Native app.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [RSA Password Encryption](#rsa-password-encryption)
- [Auth Flow](#auth-flow)
- [Social Login (Google/Facebook)](#social-login-googlefacebook)
- [File Reference](#file-reference)
- [Token Storage](#token-storage)
- [Error Codes](#error-codes)

---

## Overview

Auth is **optional** — users can browse all climbing content without an account. Login/Register are accessible from the side drawer. When authenticated, the drawer header shows the user's avatar and a "Hi {name}" greeting (tapping the avatar opens the full profile screen); Logout lives in the profile screen's menu, not the drawer — see [`docs/CLIMBER_PROFILE.md`](CLIMBER_PROFILE.md) for the profile screen itself.

In addition to email/password, LoginScreen and RegisterScreen both offer **Google/Facebook sign-in** — see [Social Login](#social-login-googlefacebook) below. Each provider's button only renders if the backend reports that provider as configured (`GET /login/status`), so an app build with no Google/Facebook credentials set on the backend just shows the email/password form.

Backend: Laravel 11 + Laravel Sanctum (token-based auth).  
Token lifetime: 7 days (configurable via `SANCTUM_TOKEN_EXPIRATION`).

---

## Architecture

```
App.js
  └── AuthProvider (utils/AuthContext.js)         ← stores user + token state
       └── LocaleProvider
            └── Navigation
                 ├── Drawer (always visible)
                 │    └── "Login / Register" button (guest) → navigate('login')
                 │    └── Avatar + "Hi {name}" → navigate('user_profile') (authenticated)
                 ├── login                    → screens/auth/LoginScreen.jsx
                 │        └── components/auth/SocialLoginButtons.jsx (Google/Facebook)
                 ├── register                 → screens/auth/RegisterScreen.jsx
                 │        └── components/auth/SocialLoginButtons.jsx (Google/Facebook)
                 ├── social_create_password   → screens/auth/SocialCreatePasswordScreen.jsx
                 ├── forgot_password          → screens/auth/ForgotPasswordScreen.jsx
                 └── ... (all other screens, accessible without auth)
```

---

## API Endpoints

Base URL: `https://climbing.ge/api`

| Method | Path | Auth Required | Description |
|--------|------|---------------|-------------|
| `POST` | `/login` | No | Login with RSA-encrypted password |
| `POST` | `/register` | No | Register new user |
| `POST` | `/logout` | Bearer token | Revoke current token |
| `GET` | `/auth_user` | Bearer token | Get authenticated user + permissions |
| `POST` | `/password/send_forget_mail` | No | Send password reset email |
| `POST` | `/password/reset_password` | No | Reset password with token |
| `GET` | `/login/status` | No | Which OAuth providers are configured — `{ google, facebook }` |
| `GET` | `/login/{provider}` | No | Get the Google/Facebook authorization URL to open |
| `GET` | `/login/{provider}/callback` | No (browser only) | OAuth callback — see [Social Login](#social-login-googlefacebook) |
| `POST` | `/login/social/create_password/{email}` | No | Set a password for a brand-new social signup, returns a token |

### POST `/login`

Password **must** be RSA-encrypted before sending (see [RSA Password Encryption](#rsa-password-encryption)).

```json
// Request
{
  "email": "user@example.com",
  "password": "<base64-RSA-PKCS1v15-encrypted>"
}

// Response 200
{
  "token": "5|abc123...",
  "user": {
    "id": 1,
    "name": "John",
    "surname": "Doe",
    "email": "user@example.com",
    "roles": ["user"]
  },
  "message": "Login successful"
}

// Response 422 — wrong credentials
{ "message": "auth.failed" }

// Response 403 — account banned
{ "message": "Your account has been banned." }

// Response 422 — validation error
{ "message": "Validation failed", "errors": { "email": ["..."] } }
```

### POST `/register`

Password is sent in **plain text** (no encryption required for registration).

```json
// Request
{
  "name": "John",
  "surname": "Doe",
  "email": "user@example.com",
  "password": "mypassword",
  "password_confirmation": "mypassword"
}

// Response 201
{
  "token": "1|xyz789...",
  "user": { "id": 1, "name": "John", "email": "user@example.com" }
}
```

Validation rules: name required, surname required, email unique, password min 6 chars + confirmed.

### GET `/auth_user`

Used on app start to restore session. Requires `Authorization: Bearer <token>` header.

```json
// Response 200
{
  "id": 5,
  "name": "John",
  "surname": "Doe",
  "email": "user@example.com",
  "avatar": "avatars/john.jpg",
  "roles": ["user"],
  "casl_permissions": [
    { "action": "add", "subject": "comment" }
  ]
}

// Response 401 — token invalid or expired
{ "message": "Unauthenticated." }
```

### POST `/password/send_forget_mail`

```json
// Request
{ "email": "user@example.com" }

// Response 200
{ "message": "Reset link sent." }
```

---

## RSA Password Encryption

The climbing.ge backend decrypts login passwords using RSA private key (`storage/framework/private.key`). The mobile app must encrypt passwords with the matching **RSA-2048 public key** using **PKCS#1 v1.5** padding before sending.

**Library used:** `node-forge` (pure JS, works in React Native).

**Implementation:** `utils/rsaEncrypt.js`

```js
import { encryptPassword } from '../utils/rsaEncrypt';

const encrypted = encryptPassword('myPlainPassword');
// → base64 string of 344 chars, e.g. "ABC123...=="
```

The public key is hardcoded in `utils/rsaEncrypt.js`. If the backend rotates its RSA key pair, update `PUBLIC_KEY_PEM` in that file.

> **Why RSA?** The web frontend encrypts passwords client-side so they are never transmitted in plain text over HTTP (defense-in-depth on top of HTTPS).

---

## Auth Flow

### Login

```
User taps "Login" in drawer
        ↓
Navigate to LoginScreen
        ↓
User submits email + password
        ↓
encryptPassword(password)      ← RSA PKCS1v1_5 encryption (node-forge)
        ↓
POST /api/login { email, password: <encrypted> }
        ↓
On success: store token in AsyncStorage('@auth_token')
            set Authorization header on axios instance
            setUser + setToken in AuthContext
        ↓
navigation.goBack() → back to whatever screen opened Login
```

### Session Restore (App Start)

```
App mounts → AuthProvider useEffect fires
        ↓
AsyncStorage.getItem('@auth_token')
        ↓
If token found:
  Set Authorization header
  GET /api/auth_user
  → success: setUser(data), setToken(stored)
  → 401: clear token + header
        ↓
setIsLoading(false) → app renders
```

### Logout

```
User taps "Logout" in the My Profile screen menu (screens/user/UserProfileScreen.jsx)
        ↓
POST /api/logout  (revokes token server-side)
        ↓
AsyncStorage.removeItem('@auth_token')
Delete Authorization header from axios
setUser(null), setToken(null)
        ↓
navigation.navigate('HomeDrawer', { screen: 'home' })  — returns to the home screen
        ↓
Drawer header updates: shows the app icon + "Login / Register" button again
```

### Register

```
User navigates to RegisterScreen
        ↓
POST /api/register { name, surname, email, password, password_confirmation }
        ↓
On success: token + user returned (same as login)
Store token, update AuthContext
navigation.goBack()
```

---

## Social Login (Google/Facebook)

The backend already runs a standard web OAuth flow for climbing.ge (Laravel Socialite: redirect to provider → provider redirects back to a backend callback → callback exchanges the code and returns the result). The mobile app reuses that **exact same flow** through an in-app browser rather than talking to Google/Facebook directly — no native Google Sign-In / FBSDK, no separate mobile OAuth client, no client-side `client_id`.

### Why an in-app browser, not a native SDK

A native SDK (`@react-native-google-signin/google-signin`, `react-native-fbsdk-next`) needs its own OAuth client per platform (Android SHA-1 fingerprint, iOS bundle ID, FB key hash) and a backend endpoint that verifies a native ID/access token — a different code path than the Socialite flow the backend already has for web. Reusing the web flow via [`expo-web-browser`](https://docs.expo.dev/versions/latest/sdk/webbrowser/)'s `openAuthSessionAsync` needed only one small backend change (below) and no new credentials.

### The one thing that had to change on the backend

`SocialController::callback()` normally returns raw JSON — fine for the web SPA reading the response body directly, useless for a React Native in-app browser session, which only ever gets handed the *final URL* it landed on (`WebBrowser.openAuthSessionAsync` cannot read a response body). So:

1. The app requests the authorize URL with `GET /login/{provider}?mobile=1`.
2. The backend folds `mobile=1` into OAuth's `state` parameter (`?state=mobile`) — the one custom value providers echo back unchanged — since Socialite's `stateless()` mode has no session to carry a flag through otherwise.
3. In the callback, if `state=mobile`, the backend responds with a `302` to `{MOBILE_APP_SCHEME}://oauth-callback?...` (the same data as the JSON body, as query params) instead of JSON. That custom scheme is what `openAuthSessionAsync` is watching for — the moment the in-app browser navigates there, Expo closes it and hands the URL back to the app.

Web behavior (no `state=mobile`) is completely unchanged — same JSON responses as before.

```
MOBILE                              BACKEND                          GOOGLE/FACEBOOK
  │                                    │                                    │
  ├─ GET /login/google?mobile=1 ─────▶│                                    │
  │◀──────────── { url } ─────────────┤                                    │
  │                                    │                                    │
  ├─ WebBrowser.openAuthSessionAsync(url, 'climbinggeorgia://oauth-callback')
  │                                    │                                    │
  ├───────────────── in-app browser opens `url` ─────────────────────────▶│
  │                                    │◀────── user approves ─────────────┤
  │                                    │◀── GET .../callback?code=...&state=mobile
  │                                    ├─ exchanges code, finds/creates user
  │◀── 302 climbinggeorgia://oauth-callback?status=login&token=... ────────┤
  │  (Expo detects the scheme match, closes the browser, returns the URL)  │
  ├─ parse query params from result.url                                    │
```

### Outcomes

`startSocialLogin(provider)` (in `utils/socialAuth.js`) resolves to one of:

| Result | Meaning | App behavior |
|---|---|---|
| `{ status: 'login', token }` | Existing user (matched by email) | `loginWithToken(token)` → fetches `/auth_user`, completes session |
| `{ status: 'registratione', new_user_email }` | Brand-new user — backend already created the `User` row (with an unusable random password) and a `social_accounts` row | Navigate to `social_create_password` with that email |
| `{ message, is_banned? }` (no `status`) | Provider error, no email returned, or the matched user is banned | Shown inline as an error under the buttons |
| *(throws)* `social_login_cancelled` | User closed the in-app browser before finishing | Swallowed silently — no error shown |

### Finishing a new signup

`social_create_password` (`screens/auth/SocialCreatePasswordScreen.jsx`) collects a password + confirmation and calls:

```json
// POST /login/social/create_password/{email}
// Request — note the `data` wrapper; the backend reads $request->data['password']
{ "data": { "password": "...", "password_confirmation": "..." } }

// Response 200
{ "message": "Password created successfully", "token": "6|abc123..." }
```

The returned token goes through the same `loginWithToken()` as an existing-user social login.

### Configuration

| Where | Var | Notes |
|---|---|---|
| Backend `.env` | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_URL` | Same OAuth client used by the web frontend — no separate mobile client |
| Backend `.env` | `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` / `FACEBOOK_URL` | Same idea |
| Backend `.env` | `MOBILE_APP_SCHEME` | Must equal this app's `expo.scheme` (`app.json`) — defaults to `climbinggeorgia` |
| `app.json` | `expo.scheme` | `"climbinggeorgia"` — must match `MOBILE_APP_SCHEME` on the backend and the hardcoded `REDIRECT_URL` in `utils/socialAuth.js` |
| Mobile `.env` | `EXPO_PUBLIC_GOOGLE_CLIENT_ID` / `EXPO_PUBLIC_FACEBOOK_CLIENT_ID` | **Dev-only UI preview**, not real config — any non-empty value force-shows that provider's button in a `__DEV__` build even if the backend reports it unconfigured, so the button can be styled/tested before real backend credentials exist. No effect in release builds; tapping the button still hits the real backend and won't complete a login for an unconfigured provider. |

`GET /login/status` returns `false` for a provider unless *all three* of its `client_id`/`client_secret`/`redirect` are set (and not the literal placeholder `"..."`) — see `SocialController::isProviderConfigured()` in the backend repo. `SocialLoginButtons` hides a provider's button entirely when its status is `false` (dev override aside), and hides itself completely if both are `false`.

> **Testing note:** `expo-web-browser` itself works in Expo Go, but the `climbinggeorgia://` scheme redirect that closes the browser and returns control to the app is only registered at the OS level in a real dev-client/EAS build — **not** in plain Expo Go. Verify this flow with `eas build --profile preview` (or a dev client), not `npx expo start`.

---

## File Reference

| File | Purpose |
|------|---------|
| `utils/AuthContext.js` | React context — `user`, `token`, `isLoading` state + `login`, `loginWithToken`, `logout`, `register`, `forgotPassword`, `refreshUser` functions |
| `utils/rsaEncrypt.js` | `encryptPassword(plaintext)` — RSA-2048 PKCS1v1_5 encryption using node-forge |
| `utils/socialAuth.js` | `getSocialLoginStatus()` (`GET /login/status`) and `startSocialLogin(provider)` — runs the in-app browser OAuth flow, see [Social Login](#social-login-googlefacebook) |
| `components/auth/SocialLoginButtons.jsx` | Shared Google/Facebook button row, used by both LoginScreen and RegisterScreen |
| `screens/auth/LoginScreen.jsx` | Login form UI (email + password) + `SocialLoginButtons` |
| `screens/auth/RegisterScreen.jsx` | Register form UI (name, surname, email, password, confirm) + `SocialLoginButtons` |
| `screens/auth/SocialCreatePasswordScreen.jsx` | Set-a-password step for a brand-new Google/Facebook signup |
| `screens/auth/ForgotPasswordScreen.jsx` | Forgot password form + success state |
| `navigation/Navigation.jsx` | Adds `login`, `register`, `forgot_password`, `social_create_password` to the stack navigator |
| `navigation/CustomDrawerContent.jsx` | Drawer header — avatar + "Hi {name}" (authenticated, tap → `user_profile`) or app icon + Login/Register button (guest) |
| `App.js` | Wraps app in `<AuthProvider>` |

---

## Token Storage

Token is stored in `AsyncStorage` under the key `@auth_token`.

The `api` axios instance (from `utils/api.js`) receives `Authorization: Bearer <token>` as a default header on login, and it is removed on logout.

```js
// Set on login/register
api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Clear on logout
delete api.defaults.headers.common['Authorization'];
```

Social login only ever gets back a bare token (the callback / `create_password` responses have no `user` object), so it goes through `loginWithToken(token)` instead of `login()` — that sets the header, then fetches `/auth_user` itself before caching and setting state.

---

## Error Codes

| HTTP | `message` | Meaning |
|------|-----------|---------|
| 200 | — | Login/register success |
| 400 | `Invalid encrypted password` | RSA decryption failed server-side — public key mismatch |
| 401 | `Unauthenticated.` | Token missing, expired, or revoked |
| 403 | `Your account has been banned.` | User is banned |
| 422 | `auth.failed` | Wrong email or password |
| 422 | `Validation failed` + `errors` | Missing/invalid fields |
| 500 | `Server configuration error` | RSA private key not found on server |
| 500 | `Could not initiate social login.` | `GET /login/{provider}` failed — provider misconfigured despite passing `isProviderConfigured()` |
| 422 | `Social login failed: could not retrieve user from provider.` | Code exchange with Google/Facebook failed |
| 422 | `No email returned from provider. Please allow email access.` | User denied the email permission on the provider's consent screen |
| 403 | `Your account has been banned.` (+ `is_banned: true`) | The email matched a banned user |

> If login returns **400 "Invalid encrypted password"**, the RSA public key in `utils/rsaEncrypt.js` is out of sync with the server's private key. Contact the backend to get the updated public key.
