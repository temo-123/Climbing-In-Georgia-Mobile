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

> Console setup, the backend flow it needs (with a ready prompt), testing and troubleshooting: [OAUTH.md](OAUTH.md).

No native SDK and **no keys in the app**: the backend's OAuth flow runs in a system browser tab (`expo-web-browser` `openAuthSessionAsync`) and ends on `climbinggeorgia://oauth-callback`.

```
SocialLoginButtons → startSocialLogin(provider, { birthday })   (utils/socialAuth.js)
  ├─ GET /api/login/{provider}?mobile=1&nonce=N[&birthday]  → { url }
  ├─ browser tab → provider → /api/login/{provider}/mobile_callback
  ├─ 302 climbinggeorgia://oauth-callback?code=C&nonce=N   (or ?message=…[&is_banned=1])
  └─ POST /api/login/mobile/exchange { code: C, nonce: N }
       ├─ { status: 'login', token, is_underage }                → loginWithToken(token)
       └─ { status: 'registratione', new_user_email, setup_key } → social_create_password
```

`social_create_password` (`screens/auth/SocialCreatePasswordScreen.jsx`) → `POST /api/login/social/create_password/{email}` with `{ setup_key, data: { password, password_confirmation } }` → `{ token }`; `403` = key expired → *Sign in again*.

The buttons render only when `GET /api/login/status` returns `mobile: true` and the provider is configured. On a backend without the mobile flow they're hidden, rather than opening the website's login form.

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
