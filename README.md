<h1 align="center">Climbing In Georgia — Mobile Guidebook</h1>
<h3 align="center">Powered by <a href="https://climbing.ge">climbing.ge</a></h3>

<p align="center"><img src="docs/images/header logo(bacground).png" width="400"></p>

---

## About

Mobile guidebook for climbers in Georgia. Browse outdoor sport climbing areas, ice climbing spots, indoor gyms, mountain routes, and events. All data is fetched live from the [climbing.ge](https://climbing.ge) API.

## Tech Stack

- **React Native** 0.83.6
- **Expo** SDK 55
- **React Navigation** v7 (Drawer + Stack)
- **Axios** for API requests
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

## Build APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The APK download link is provided after the cloud build finishes (~5–10 min).

## Features

- Outdoor sport climbing areas with sector topos, route tables, and grade colors
- Ice climbing sectors with WI/M grade tables
- Multi-pitch route display
- Sector info chips (sun/shade, walking time, helmet, climbing character)
- Article gallery images
- Indoor gyms, mountain routes, other activities, events

## Project Structure

```
App.js
navigation/
  Navigation.jsx
  DrawerNavigator.jsx
screens/
  lists/          — article list screens (FlatList + cards)
  article_pages/  — detail pages per category
components/
  cards/          — card components for list screens
  article/        — article content blocks
  Routes_and_sectors/
    Sport_sector/ — sport climbing sector + route rendering
    Ice_sectors/  — ice climbing sector + route rendering
assets/
  styles/styles.js — shared typography (gStyle)
utils/
  api.js          — axios instance, corsUrl(), imgUri()
```

## Version

**0.1.5** — Release / Build / Front

---

<p align="center">Best wishes from <a href="https://climbing.ge">climbing.ge</a></p>
