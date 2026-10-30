import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../locales/en.json';
import ka from '../locales/ka.json';
// The website's own translations (scripts/sync-web-i18n.js), so shared
// features use the site's exact wording: t('site.guide.gym_hours.title').
import siteEn from '../locales/site.en.json';
import siteKa from '../locales/site.ka.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, site: siteEn } },
    ka: { translation: { ...ka, site: siteKa } },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
