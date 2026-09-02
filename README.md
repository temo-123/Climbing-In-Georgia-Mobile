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

Authentication is optional — all content is freely accessible without an account. When logged in, the drawer header shows the user's avatar and a "Hi {name}" greeting (tapping it opens the profile screen).

| Screen | Description |
|--------|-------------|
| **My Profile** | Own climber profile summary — avatar, followers/following, points, 4-axis radar chart of activity — plus the account menu below (tapping the avatar opens a modal with the full detail, including recent activity) |
| **Options** | Avatar upload, read-only profile summary with an "Edit" modal (name/surname/email/country/city/phone/bio), unlimited "My Links" list, "Change Password" modal |
| **My Ascents** | History of recorded summit ascents |
| **My Comments** | Comments left on articles |
| **My Route Reviews** | Reviews submitted for routes and multi-pitch routes |
| **My Donations** | Donation history *(currently always empty — no backend endpoint exists yet for this, see [`docs/CLIMBER_PROFILE.md`](docs/CLIMBER_PROFILE.md#known-backend-issues))* |
| **Favorites** | Saved outdoor areas and interested events |
| **Climbers Directory** | Searchable, sortable ("A-Z" / "Top Active") directory of every climber, reached from the "All climbers" link on the profile screen |

#### Climber Profile

Every user — logged in or not — has a public climber profile (mirrors the equivalent climbing.ge website feature): avatar, bio, unlimited "extra links", follower/following counts, a computed "points" score, and a radar chart across route reviews / MTP reviews / ascents / comments. Users can follow each other; following someone emails them a notification (server-side). Full documentation, including the exact API contract and known backend bugs, is in [`docs/CLIMBER_PROFILE.md`](docs/CLIMBER_PROFILE.md).

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
                      ├── user_favorites
                      ├── climbers_list      — directory of all climbers
                      └── climber_profile    — one climber's full profile (params: userId)
```

---

## API

Base URL: `https://climbing.ge/api/`

| Endpoint | Purpose |
|----------|---------|
| `GET /get_article/get_locale_articles/{type}/en` | List screen data (`type`: outdoor, indoor, ice, mountain_routes, other_activities, events) |
| `GET /get_article/get_locale_article_on_page/{type}/en/{url_title}` | Article detail page |
| `GET /get_sector/get_sector_and_routes/{article_id}` | Sectors and routes for sport and ice articles |
| `GET /summit/list` | Summit list |
| `GET /summit/show/{url_title}` | Summit detail |
| `GET /summit/ascents/{url_title}` | Ascent list for a summit |
| `POST /summit/ascent/{summit_id}` | Record a new ascent (auth required) |
| `GET /summit/my_ascents` | Own ascent history (auth required) |
| `GET /get_climber_profile/{user_id}` | Public climber profile — points, followers, radar-chart stats, recent activity |
| `GET /get_climber_profile/list` | Public climbers directory (paginated, searchable, sortable) |
| `POST /set_user_follow/follow/{user_id}` / `DELETE .../unfollow/{user_id}` | Follow / unfollow another climber (auth required) |
| `POST /login` | Login (RSA-encrypted password) |
| `POST /register` | Register new user |
| `POST /logout` | Revoke token |
| `GET /auth_user` | Get authenticated user + permissions |
| `POST /password/send_forget_mail` | Send password reset email |

See [`docs/AUTH.md`](docs/AUTH.md) for full authentication documentation including RSA password encryption details, and [`docs/CLIMBER_PROFILE.md`](docs/CLIMBER_PROFILE.md) for the full climber-profile/follow/avatar-upload/extra-links API contract.

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
| react-native-svg | 15.12.1 | Inline-SVG radar chart on climber profiles |
| expo-image-picker | ~17.0.11 | Avatar photo picker + ascent-proof photo capture |
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
                                  UserFavoritesScreen, ClimbersListScreen,
                                  ClimberProfileScreen
components/
  cards/                        — card components for every list category
  article/                      — article header, general info, mountain massif blocks
  Routes_and_sectors/
    Sport_sector/               — sport/boulder sector renderer (Type A + B)
    Ice_sectors/                — ice sector renderer
  user/                         — see docs/CLIMBER_PROFILE.md for the full breakdown
    ClimberProfileContent.jsx   — fetches + renders one climber's profile (shared)
    ClimberProfileModal.jsx     — quick-view modal
    ClimberCard.jsx             — directory grid card
    RadarStatsChart.jsx         — inline-SVG 4-axis activity chart
    UserLinksManager.jsx        — unlimited "extra links" CRUD
    FormModal.jsx               — shared bottom-sheet form-modal chrome
    EditProfileModal.jsx        — profile-info edit modal
    ChangePasswordModal.jsx     — password-change modal
    WriteOnWebsiteButton.jsx    — "not supported in-app yet" CTA
  CachedImage.jsx               — image with offline fallback
  ImageViewerModal.jsx          — full-screen image viewer
  EmbedBlock.jsx                — embedded iframe/video blocks
  EmptyState.jsx                — empty list placeholder
  OfflineBanner.jsx             — yellow offline banner
  OfflineError.jsx              — full-screen no-cache error
  Preloader.jsx                 — loading spinner
  PageFooter.jsx                — "Powered by climbing.ge" footer
utils/
  api.js                        — axios instance, corsUrl(), imgUri(), IMG_BASES
  AuthContext.js                — user/token state + login/logout/register/refreshUser actions
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
  CI_CD.md                      — EAS build & Play Store submit pipeline
  CLIMBER_PROFILE.md            — climber profile / follow / avatar / extra-links feature
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

The above can also be run automatically from GitHub Actions (manual trigger, optional auto-submit to the Play Store internal testing track) — see [`docs/CI_CD.md`](docs/CI_CD.md).

---

## Version

**1.2.17**

---

<p align="center">Best wishes from <a href="https://climbing.ge">climbing.ge</a></p>
