<h1 align="center">Climbing In Georgia — Mobile Guidebook</h1>
<h3 align="center">Powered by <a href="https://climbing.ge">climbing.ge</a></h3>

<p align="center"><img src="docs/images/header logo(bacground).png" width="400"></p>

---

## About

Mobile guidebook for climbers in Georgia. Browse outdoor sport climbing areas, ice climbing spots, indoor gyms, mountain routes, and events — all from [climbing.ge](https://climbing.ge). Works fully offline after downloading data.

## Tech Stack

- **React Native** 0.81.5
- **Expo** SDK 54
- **React Navigation** v7 (Drawer + Stack)
- **Axios** for API requests
- **@react-native-async-storage/async-storage** for offline cache
- **@react-native-firebase/analytics** for analytics
- **react-native-reanimated-table** for route tables
- **FontAwesome** icons via `@fortawesome/react-native-fontawesome`

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npx expo start

# Run on Android
npx expo start --android
```

Open the project in **Expo Go** on your phone by scanning the QR code.

## Build

```bash
npm install -g eas-cli
eas login

# Preview APK (for testing)
eas build -p android --profile preview

# Production AAB (for Play Store)
eas build -p android --profile production
```

The download link is provided after the cloud build finishes (~5–10 min).

## Features

- Outdoor sport climbing areas with sector topos, route tables, and grade colors
- Ice & mix climbing sectors with WI/M grade tables
- Multi-pitch route display
- Sector info chips (sun/shade, walking time, helmet, climbing character)
- Article gallery images with full-screen viewer
- Indoor gyms with opening hours and prices
- Mountain routes, other activities, and events
- **Offline mode** — download all data with one tap and browse without internet

## Offline Mode

Open the side menu and tap **Offline Mode**. Press **Download All Data** while connected to the internet. All lists, article pages, and sector/route data are saved to your device. After that the app works fully without a connection — a yellow banner appears when showing cached content.

## Project Structure

```
App.js
navigation/
  Navigation.jsx          — root Stack + screen tracking
  DrawerNavigator.jsx     — drawer menu screens
screens/
  lists/                  — article list screens (FlatList + cards)
  article_pages/          — detail pages per category
  offline_download_screen.jsx — offline download UI
components/
  cards/                  — card components for list screens
  article/                — article content blocks
  Routes_and_sectors/
    Sport_sector/         — sport climbing sector + route rendering
    Ice_sectors/          — ice climbing sector + route rendering
  OfflineBanner.jsx       — yellow banner shown in offline mode
  OfflineError.jsx        — full-screen message when no cached data
assets/
  styles/styles.js        — shared typography (gStyle)
utils/
  api.js                  — axios instance, corsUrl(), imgUri()
  offlineStorage.js       — AsyncStorage cache for offline use
  analytics.js            — Firebase Analytics helpers
  useSiteData.js          — shared site description hook
```

## Version

**1.2.5**

---

<p align="center">Best wishes from <a href="https://climbing.ge">climbing.ge</a></p>
