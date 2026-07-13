<h1 align="center">Climbing In Georgia — Mobile Guidebook</h1>
<h3 align="center">Powered by <a href="https://climbing.ge">climbing.ge</a></h3>

<p align="center"><img src="docs/images/header logo(bacground).png" width="400"></p>

---

## About

**Climbing In Georgia** is the official mobile guidebook for climbers visiting or living in Georgia (the country). It is the mobile companion to [climbing.ge](https://climbing.ge) — the national climbing database — and mirrors all content from the website in a fast, offline-capable mobile experience.

The app covers every major discipline practiced in Georgia: sport climbing, bouldering, multi-pitch, ice & mix, mountaineering, indoor gyms, and organised events. All data is fetched live from the climbing.ge API and can be downloaded once for fully offline use — essential when climbing in areas without mobile coverage.

---

## Features

### Content Browsing

- **Outdoor Sport Climbing** — browse crag listings with cover images, sector counts, route totals, and multi-pitch counts. Tap any crag to view its full page: gallery, general info, how to get there, best season, sector topos with photos, and colour-coded route tables (French grade system).
- **Ice & Mix Climbing** — same structure as outdoor crags. Route tables use WI/M grades. Dry-tooling and ice sectors are handled separately.
- **Indoor Gyms** — gym cards with opening hours, pricing, and contact details.
- **Mountaineering Routes** — multi-pitch alpine routes with mountain massif descriptions, topos, and best-time guidance.
- **Other Activities** — via ferrata, canyoning, trekking, and other adventure activities listed alongside climbing.
- **Events & Competitions** — upcoming and past climbing events across Georgia.

### Route Tables

- French (FR) and YDS grade columns for sport routes
- WI/M grade column for ice routes
- Row colour coding: header in `#f6d27e`, moderate-hard grades in `#dfad8d`, hard grades in `#df8d8d`
- Per-route detail modal: height, bolts, anchor type, bolt type, author, creation date
- Multi-pitch route display with pitch-by-pitch breakdown

### Sector Info

Each sector shows info chips: sun/shade exposure (full sun, full shade, shade AM/PM, shade 10+, shade 15+), helmet requirement, kids-friendly, family-friendly, climbing character (vertical, overhang, slab, roof), and walk-in time.

### Gallery & Images

Full-screen image viewer for article gallery photos and sector topo images. All images are served from `https://climbing.ge/public/images/` with filenames that contain `{}` characters safely URL-encoded via the `imgUri()` utility.

### Summit Tracker

A logbook system for mountaineering summits:

- Browse the full summit list with peak names (English + Georgian), region, and elevation
- View summit detail pages with description and the list of recorded ascents
- **Record an ascent** — select the route climbed, add a comment, and optionally attach your GPS coordinates captured on-device
- **QR code scanning** — scan the QR code placed at a summit marker to auto-identify the summit and jump straight to the ascent submission screen
- Requires a climbing.ge account (login prompted automatically)

### User Account

Authentication is optional — all content is freely accessible without an account. When logged in, the side drawer shows the user's name and email and provides access to:

| Screen | Description |
|--------|-------------|
| **My Profile** | Edit name, surname, email; change password |
| **Options** | Account settings |
| **My Ascents** | History of recorded summit ascents |
| **My Comments** | Comments left on articles |
| **My Route Reviews** | Reviews submitted for individual routes |
| **My Donations** | Donation history |
| **Favorites** | Saved outdoor areas, products, and interested events |

### Offline Mode

Download all content with a single tap while connected to the internet. After that, the app works with no connection:

- All list screens (outdoor, indoor, ice, mountain, other, events) served from cache
- All article/detail pages served from cache
- All sector and route data served from cache
- All article images downloaded and served from the local image cache (`expo-image`)
- A yellow banner appears at the top of every screen that is showing cached data
- If a screen has no cached data and there is no connection, a full-screen error message guides the user to the Offline Mode download screen

Re-download at any time to refresh all content.

### Localisation

The app is fully localised in **English** and **Georgian (ქართული)**. Language can be switched from the side drawer. The selected language is persisted across sessions and also controls which locale the API returns article content in (`/en` or `/ka` path segments).

---

## Navigation Structure

```
App.js
  └── AuthProvider
       └── LocaleProvider
            └── Navigation (Stack)
                 ├── Drawer Navigator
                 │    ├── Home               — index/landing screen
                 │    ├── Outdoor Spots      — outdoor_spots_list
                 │    ├── Indoor Gyms        — indoor_gyms_list
                 │    ├── Ice & Mix          — ice_spots_list
                 │    ├── Mountain Routes    — mountain_routes_list
                 │    ├── Other Activity     — other_activities_list
                 │    ├── Events             — events_list
                 │    ├── Summit Tracker     — summits_list
                 │    ├── About Us           — about_us
                 │    └── Offline Mode       — offline_download_screen
                 │
                 ├── Detail pages (Stack screens)
                 │    ├── outdoor_spot_page
                 │    ├── indoor_gym_page
                 │    ├── ice_spot_page
                 │    ├── mountain_route_page
                 │    ├── other_activity_page
                 │    └── event_page
                 │
                 ├── Summit screens
                 │    ├── summit_detail
                 │    ├── submit_ascent
                 │    └── qr_scanner
                 │
                 ├── Auth screens
                 │    ├── login
                 │    ├── register
                 │    └── forgot_password
                 │
                 └── User screens
                      ├── user_profile
                      ├── user_options
                      ├── user_ascents
                      ├── user_comments
                      ├── user_route_reviews
                      ├── user_donations
                      └── user_favorites
```

---

## API

Base URL: `https://climbing.ge/api/`

| Endpoint | Purpose |
|----------|---------|
| `GET /get_article/get_locale_articles/{type}/en` | List screen data (`type`: outdoor, indoor, ice, mountain_routes, other_activities, events) |
| `GET /get_article/get_locale_article_on_page/{type}/en/{url_title}` | Article detail page |
| `GET /get_sector/get_sector_and_routes/{article_id}` | Sectors and routes for sport and ice articles |
| `GET /summit` | Summit list |
| `GET /summit/{url_title}` | Summit detail + ascent list |
| `POST /summit/{id}/ascent` | Record a new ascent (auth required) |
| `POST /login` | Login (RSA-encrypted password) |
| `POST /register` | Register new user |
| `POST /logout` | Revoke token |
| `GET /auth_user` | Get authenticated user + permissions |
| `POST /password/send_forget_mail` | Send password reset email |

See [`docs/AUTH.md`](docs/AUTH.md) for full authentication documentation including RSA password encryption details.

---

## Tech Stack

| Library | Version | Role |
|---------|---------|------|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo SDK | 54 | Build toolchain, camera, location |
| React Navigation v7 | — | Drawer + Stack navigation |
| Axios | ^1.3.4 | HTTP client for API requests |
| i18next + react-i18next | ^26 / ^17 | EN/KA localisation |
| @react-native-async-storage | 2.2.0 | Offline cache + token storage |
| @react-native-firebase/analytics | ^24 | Firebase Analytics event tracking |
| expo-image | ~3.0.11 | Performant cached image rendering |
| expo-camera | ~17.0.10 | QR code scanning |
| expo-location | ~19.0.8 | GPS capture for ascent recording |
| node-forge | ^1.4.0 | RSA-2048 password encryption (login) |
| react-native-render-html | ^6.3.4 | Render HTML article body content |
| react-native-reanimated-table | ^0.0.2 | Route grade tables |
| FontAwesome | ^6.3 | Icons throughout the app |

---

## Project Structure

```
App.js                          — root component, global providers
navigation/
  Navigation.jsx                — root Stack navigator + screen tracking
  DrawerNavigator.jsx           — drawer menu (10 primary routes)
  CustomDrawerContent.jsx       — drawer UI (language switcher, auth state)
screens/
  index.jsx                     — home/landing screen
  about_us.jsx                  — about the project
  offline_download_screen.jsx   — download manager for offline mode
  lists/                        — one file per content category (FlatList + cards)
  article_pages/                — one detail page per category
  auth/                         — LoginScreen, RegisterScreen, ForgotPasswordScreen
  summit/                       — SummitsListScreen, SummitDetailScreen,
  |                               SubmitAscentScreen, QRScannerScreen
  user/                         — UserProfileScreen, UserOptionsScreen,
                                  UserAscentsScreen, UserCommentsScreen,
                                  UserRouteReviewsScreen, UserDonationsScreen,
                                  UserFavoritesScreen
components/
  cards/                        — card components for every list category
  article/                      — article header, general info, mountain massif blocks
  Routes_and_sectors/
    Sport_sector/               — sport/boulder sector renderer (Type A + B)
    Ice_sectors/                — ice sector renderer
  CachedImage.jsx               — image with offline fallback
  ImageViewerModal.jsx          — full-screen image viewer
  EmbedBlock.jsx                — embedded iframe/video blocks
  EmptyState.jsx                — empty list placeholder
  OfflineBanner.jsx             — yellow offline banner
  OfflineError.jsx              — full-screen no-cache error
  Preloader.jsx                 — loading spinner
  PageFooter.jsx                — "Powered by climbing.ge" footer
utils/
  api.js                        — axios instance, corsUrl(), imgUri()
  AuthContext.js                — user/token state + login/logout/register actions
  LocaleContext.js              — active locale state (EN/KA)
  i18n.js                       — i18next initialisation
  offlineStorage.js             — AsyncStorage read/write helpers
  imageCache.js                 — expo-image prefetch/cache helpers
  rsaEncrypt.js                 — RSA-2048 PKCS#1v1.5 password encryption
  analytics.js                  — Firebase Analytics helpers
  useSiteData.js                — shared hook for site description text
  sectorCount.js                — route/sector count aggregation helpers
locales/
  en.json                       — English translation strings
  ka.json                       — Georgian translation strings
assets/
  styles/styles.js              — shared typography (gStyle)
  icon.png / splash.png         — app icons
docs/
  AUTH.md                       — full authentication documentation
```

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on a connected Android device or emulator
npx expo start --android

# Run on iOS simulator
npx expo start --ios
```

Open the project in **Expo Go** on your phone by scanning the QR code shown in the terminal.

**Module aliases** (configured via `babel-plugin-module-resolver`):
- `@` → `./src`
- `assets` → `./assets`

---

## Build

```bash
npm install -g eas-cli
eas login

# Preview APK (for testing / side-loading)
eas build -p android --profile preview

# Production AAB (for Google Play Store — auto-increments version)
eas build -p android --profile production

# Production APK (same version as above, for side-loading a production build)
eas build -p android --profile production-apk
```

The EAS cloud build takes approximately 5–10 minutes. A download link is provided when it completes.

Use `production-apk` when you need a `.apk` of the same release you submitted to Google Play (e.g. to share outside the Play Store) — it reuses the production build config but skips the automatic version bump so it doesn't drift from the `.aab` you already submitted.

---

## Version

**1.2.7**

---

<p align="center">Best wishes from <a href="https://climbing.ge">climbing.ge</a></p>
