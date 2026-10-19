import * as WebBrowser from 'expo-web-browser';

// Texts are managed on the website — always show the live page, never a
// hardcoded copy. Georgian pages live under a /ka prefix.
const SITE = 'https://climbing.ge';

export function legalUrl(page, locale) {
  return `${SITE}${locale === 'ka' ? '/ka' : ''}/${page}`;
}

// In-app browser (Custom Tab / SFSafariViewController), not the external browser app.
export function openPrivacyPolicy(locale) {
  return WebBrowser.openBrowserAsync(legalUrl('privacy_policy', locale));
}

export function openTermsOfUse(locale) {
  return WebBrowser.openBrowserAsync(legalUrl('terms_of_use', locale));
}
