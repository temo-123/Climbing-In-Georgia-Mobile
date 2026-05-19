# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose platform)
npx expo start
npx expo start --android
npx expo start --ios
npx expo start --web
```

No lint or test scripts are configured in this project.

## Module Aliases

Babel is configured with `babel-plugin-module-resolver`:
- `@` → `./src`
- `assets` → `./assets`

The `react-native-reanimated/plugin` must remain last in the babel plugins list.

## Architecture

**Entry:** `App.js` → `navigation/Navigation.jsx` → `navigation/DrawerNavigator.jsx`

**Navigation stack:**
- Stack Navigator wraps a Drawer Navigator
- Drawer has 8 primary routes (Home, Outdoor, Indoor, Ice, Mountaineering, Other, Events, About)
- Detail pages are Stack screens navigated to via `navigation.navigate(screen_name, { id })`

**Screen pattern:** Each list screen fetches data in `useEffect` via axios, stores it in local `useState`, and renders a `FlatList` of card components. Cards navigate to detail pages passing the item ID. Detail pages re-fetch via the ID in `route.params`.

**API base URL:** `https://climbing.ge/api/`

Key endpoints:
- `GET /api/articles/{type}/en` — list screens (`type`: outdoor, indoor, ice, mountain_routes, other_activities, events)
- `GET /api/article/{type}/en/{id}` — detail pages
- `GET /api/sector/get_sector_and_routes/{id}` — sectors/routes for a spot

**No global state management** — all state is local to each screen via hooks.

**Styling:** `StyleSheet.create()` inline per component. Shared typography in `assets/styles/styles.js` (exported as `gStyle`). Primary theme color: `#279fbb`. `styled-components` is installed but not used.

**Image base URLs:**
- `https://climbing.ge/images/outdoor_img/{filename}`
- `https://climbing.ge/public/images/sector_img/{filename}`
