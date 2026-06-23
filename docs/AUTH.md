# Authentication — Mobile App

Documentation for the login/register/auth flow in the Climbing In Georgia React Native app.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [RSA Password Encryption](#rsa-password-encryption)
- [Auth Flow](#auth-flow)
- [File Reference](#file-reference)
- [Token Storage](#token-storage)
- [Error Codes](#error-codes)

---

## Overview

Auth is **optional** — users can browse all climbing content without an account. Login/Register are accessible from the side drawer. When authenticated, the drawer shows the user's name, email, and a Logout button.

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
                 │    └── "Login / Register" button → navigate('login')
                 │    └── User info + Logout (when authenticated)
                 ├── login           → screens/auth/LoginScreen.jsx
                 ├── register        → screens/auth/RegisterScreen.jsx
                 ├── forgot_password → screens/auth/ForgotPasswordScreen.jsx
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
User taps "Logout" in drawer
        ↓
POST /api/logout  (revokes token server-side)
        ↓
AsyncStorage.removeItem('@auth_token')
Delete Authorization header from axios
setUser(null), setToken(null)
        ↓
Drawer updates: shows "Login / Register" button
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

## File Reference

| File | Purpose |
|------|---------|
| `utils/AuthContext.js` | React context — `user`, `token`, `isLoading` state + `login`, `logout`, `register`, `forgotPassword` functions |
| `utils/rsaEncrypt.js` | `encryptPassword(plaintext)` — RSA-2048 PKCS1v1_5 encryption using node-forge |
| `screens/auth/LoginScreen.jsx` | Login form UI (email + password) |
| `screens/auth/RegisterScreen.jsx` | Register form UI (name, surname, email, password, confirm) |
| `screens/auth/ForgotPasswordScreen.jsx` | Forgot password form + success state |
| `navigation/Navigation.jsx` | Adds `login`, `register`, `forgot_password` to the stack navigator |
| `navigation/CustomDrawerContent.jsx` | Shows user info + Logout or Login/Register button |
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

> If login returns **400 "Invalid encrypted password"**, the RSA public key in `utils/rsaEncrypt.js` is out of sync with the server's private key. Contact the backend to get the updated public key.
