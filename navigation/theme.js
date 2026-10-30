import { DefaultTheme } from '@react-navigation/native';
import { COLORS, FONTS } from '../assets/styles/styles';

// The website's `.cg-nav`: granite header with an accent ridge line under
// it, display-font title. Shared by the stack and the drawer so every screen
// header looks the same.
export const headerOptions = {
  headerStyle: { backgroundColor: COLORS.ink },
  headerTintColor: '#fff',
  headerTitleStyle: { fontFamily: FONTS.displayBold, fontSize: 22 },
  headerShadowVisible: false,
};

// Drawer-only extras: the ridge line is drawn as the header's bottom border
// (native-stack headers don't support borders, the drawer's JS header does).
export const drawerHeaderOptions = {
  ...headerOptions,
  headerStyle: {
    backgroundColor: COLORS.ink,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
};

export const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.chalk,
    card: COLORS.surface,
    text: COLORS.ink,
    border: COLORS.line,
  },
  fonts: {
    regular: { fontFamily: FONTS.body, fontWeight: 'normal' },
    medium: { fontFamily: FONTS.bodySemi, fontWeight: 'normal' },
    bold: { fontFamily: FONTS.bodyBold, fontWeight: 'normal' },
    heavy: { fontFamily: FONTS.bodyHeavy, fontWeight: 'normal' },
  },
};
