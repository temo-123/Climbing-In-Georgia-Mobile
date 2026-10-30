import { StyleSheet } from 'react-native'

// Design tokens mirrored from the website's design system ("chalk & granite",
// web repo resources/sass/abstracts/_bootstrap-config.scss + base/_tokens.scss).
// Keep these in sync with the site rather than inventing new colours —
// docs: web_docs/docs/FRONTEND/FRONTEND.md#design-system.
export const COLORS = {
  // Guide service accent (--cg-accent). `primary` is the name every existing
  // screen already uses, so it stays the main accent key.
  primary: '#1f93b0',
  primaryDark: '#176e84',   // --cg-accent-dark  (shade 25%)
  primarySoft: '#e4f2f6',   // --cg-accent-soft  (tint 88%)

  ink: '#15212b',           // granite — headings, dark surfaces
  ink2: '#24343f',          // body text
  stone: '#56646e',         // secondary copy
  muted: '#87939b',

  chalk: '#f5f3ee',         // page background
  chalk2: '#ebe7df',
  line: '#e3ded4',          // borders
  surface: '#ffffff',

  hold: '#ffc233',          // "hold yellow" — CTAs, grade tape
  holdDark: '#f0a800',
  rope: '#ff6a3d',          // "rope orange" — favourites, warnings

  success: '#18a06f',
  danger: '#cf3f45',
  warning: '#e07a3e',
  footer: '#484848',
}

// Page-head band colours per sketch ($cg-head-colors in _fun.scss).
export const HEAD_COLORS = {
  holds: '#3a6fb0',
  quickdraw: COLORS.primary,
  iceaxe: '#2b86b8',
  mountains: '#4f6276',
  trophy: '#b07a17',
  bolts: '#7a5a3c',
  tent: '#3d7a4f',
  rope: '#c25a36',
  shoe: COLORS.primary,
  tag: '#cf3f45',
  notebook: COLORS.primary,
  summit: '#6c45c4',        // summit service violet
  film: COLORS.primary,
  carabiners: COLORS.primary,
  partners: COLORS.primary,
  user: COLORS.primary,
  map: COLORS.primary,
  compass: '#46525e',
}

// Route-table column colours ($cg-route-cols in _ui.scss).
export const ROUTE_COLS = {
  num: '#64748b',
  name: '#1f93b0',
  height: '#18a06f',
  bolts: '#e07a3e',
  grade: '#6c45c4',
  grade2: '#a83d6e',
  info: '#c98a0c',
}

// Android can't synthesise bold for a custom font family — every weight is
// its own family name, so styles pick a family instead of setting fontWeight.
// Georgian glyphs fall back to the OS Georgian font automatically.
export const FONTS = {
  body: 'Manrope_400Regular',
  bodyMedium: 'Manrope_500Medium',
  bodySemi: 'Manrope_600SemiBold',
  bodyBold: 'Manrope_700Bold',
  bodyHeavy: 'Manrope_800ExtraBold',
  display: 'BarlowCondensed_600SemiBold',
  displayBold: 'BarlowCondensed_700Bold',
}

export const RADII = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 }

export const SHADOWS = {
  sm: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: COLORS.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 5,
  },
}

export const gStyle = StyleSheet.create({
    main_container: {
        flex: 1,
        padding: 16,
    },
    h1: {
      fontSize: 30,
      marginTop: 12,
      fontFamily: FONTS.displayBold,
      color: COLORS.ink,
      lineHeight: 34,
    },
    h2: {
      fontSize: 24,
      fontFamily: FONTS.displayBold,
      color: COLORS.ink,
    },
    h3: {
      fontSize: 18,
      fontFamily: FONTS.display,
      color: COLORS.ink,
    },
    h4: {
      fontSize: 13,
      fontFamily: FONTS.bodyBold,
      color: COLORS.ink2,
    },
    p: {
        fontSize: 14,
        lineHeight: 22,
        fontFamily: FONTS.body,
        color: COLORS.stone,
    },
    center: {
        fontSize: 12
    },
})
