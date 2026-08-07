import api, { API_BASE_URL } from './api';

const API_BASE = API_BASE_URL;
const cache = {};

export function getDonationSiteData(locale) {
  if (cache[locale]) return cache[locale];
  const promise = api.get(`${API_BASE}/get_site_data/get_site_locale_data_for_site/${locale}`)
    .then(res => {
      const data = res.data?.locale_data ?? {};
      return {
        short_description: data.donation_short_description ?? '',
        terms_of_use: data.donation_terms_of_use ?? '',
        description: data.donation_description ?? '',
      };
    })
    .catch(() => {
      delete cache[locale];
      return { short_description: '', terms_of_use: '', description: '' };
    });
  cache[locale] = promise;
  return promise;
}
