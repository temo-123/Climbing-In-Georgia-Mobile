import { Platform } from 'react-native';

// Features turned off on iOS for App Store review — one place, so they're
// easy to find and switch back on. See docs/APP_STORE.md.
const IOS = Platform.OS === 'ios';

// Guideline 4.8: Google / Facebook login needs Sign in with Apple next to it.
export const SOCIAL_LOGIN_ENABLED = !IOS;

// Guideline 3.1.1 / 3.2.2: money given to the app's developer inside the app
// must go through In-App Purchase (only Apple-approved nonprofits may take
// donations outside it). The card checkout would be rejected, so iOS has no
// donation button / "My donations".
export const DONATIONS_ENABLED = !IOS;
