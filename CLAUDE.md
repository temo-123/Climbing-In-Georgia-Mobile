# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (choose platform)
npx expo start
npx expo start --android
npx expo start --ios
npx expo start --web

# Build Android (EAS cloud build)
eas build -p android --profile preview         # .apk, internal testing build
eas build -p android --profile production      # .aab, for Google Play submission (auto-increments version)
eas build -p android --profile production-apk  # .apk of the production build, same version, no auto-increment
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
- Detail pages are Stack screens navigated to via `navigation.navigate(screen_name, url_title)`

**Screen pattern:** Each list screen fetches data in `useEffect` via axios, stores it in local `useState`, and renders a `FlatList` of card components. Cards navigate to detail pages passing `url_title`. Detail pages re-fetch via `route.params`.

**API base URL:** `https://climbing.ge/api/`

Key endpoints:
- `GET /api/get_article/get_locale_articles/{type}/en` — list screens (`type`: outdoor, indoor, ice, mountain_routes, other_activities, events)
- `GET /api/get_article/get_locale_article_on_page/{type}/en/{url_title}` — detail pages
- `GET /api/get_sector/get_sector_and_routes/{article_id}` — sectors/routes for both sport and ice articles

**No global state management** — all state is local to each screen via hooks.

**Styling:** `StyleSheet.create()` inline per component. Shared typography in `assets/styles/styles.js` (exported as `gStyle`). Primary theme color: `#279fbb`. `styled-components` is installed but not used.

## Image URLs

All image filenames from the API contain `{XXXXXX}` in the name (e.g. `2025-01-01{123456}.webp`). These must be encoded via `imgUri(base, filename)` from `utils/api.js` which replaces `{`→`%7B` and `}`→`%7D`.

All images are served from `https://climbing.ge/public/images/`:

| Content | Base path |
|---------|-----------|
| Sector topo images (sport + ice) | `public/images/sector_img/` |
| Sub-area overview images (`local_images`) | `public/images/sector_local_img/` |
| Article gallery images (`gallery_images`) | `public/images/article_gallery_img/` |
| Outdoor card/header images | `public/images/outdoor_img/` |
| Ice card images | `public/images/ice_img/` |
| Indoor card images | `public/images/indoor_img/` |
| Mountain route card images | `public/images/mount_route_img/` |
| Other activity card images | `public/images/other_img/` |
| Event card images | `public/images/event_img/` |

**Never use** `https://climbing.ge/images/TYPE_img/` (without `public/`) for filenames containing `{}` — the server returns SPA HTML instead of the image for those paths.

## Sector Data Structure

The sectors API (`get_sector/get_sector_and_routes/{id}`) returns an array of items. Two item types exist:

**Type A** — direct sector:
```
{ sector, sector_imgs, sport_routes, mtps, boulder_route }
```

**Type B** — sub-area grouping:
```
{ local_images, sectors: [{ sector, sector_imgs, sport_routes, mtps }] }
```

Ice articles use the same endpoint and structure as sport sectors. Ice routes have `grade` in WI/M format.

## Key Components

- `components/Routes_and_sectors/Sport_sector/spot_sectors.jsx` — renders sport sectors (Type A + B)
- `components/Routes_and_sectors/Ice_sectors/ice_sectors.jsx` — renders ice sectors (same API as sport)
- `components/Routes_and_sectors/Sport_sector/items/routes_tab.jsx` — FR grade route table with color coding
- `components/Routes_and_sectors/Sport_sector/items/multi_pitch_tab.jsx` — multi-pitch route display
- `components/Routes_and_sectors/Sport_sector/items/sector_info_bar.jsx` — sector info chips (sun/shade, walk time, etc.)
- `components/Routes_and_sectors/Ice_sectors/items/ice_routes_tab.jsx` — WI/M grade route table

## Grade Color Coding

Route table row colors (matches website CSS):
- Header: `#f6d27e`
- Moderate-hard (FR 6c+–7b / WI4+–WI5): `#dfad8d`
- Hard (FR 7b+ and above / WI5+): `#df8d8d`
