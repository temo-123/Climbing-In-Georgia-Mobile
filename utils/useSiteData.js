import { useState, useEffect } from 'react';
import api, { corsUrl, API_BASE_URL } from './api';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from './offlineStorage';
import { useLocale } from './LocaleContext';

// Per-locale module-level cache
const _caches = {};
const _promises = {};

function getSiteData(locale) {
  if (_caches[locale]) return Promise.resolve(_caches[locale]);
  if (!_promises[locale]) {
    _promises[locale] = api
      .get(corsUrl(`${API_BASE_URL}/get_site_data/get_site_locale_data_for_site/${locale}`))
      .then(({ data }) => {
        _caches[locale] = data;
        saveOfflineData(OFFLINE_KEYS.site_data, data);
        return data;
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.site_data);
        if (cached) { _caches[locale] = cached; return cached; }
        return null;
      });
  }
  return _promises[locale];
}

const DESCRIPTION_KEYS = {
  outdoor:      'outdoor_description',
  ice:          'ice_description',
  indoor:       'indoor_description',
  mount_route:  'mount_description',
  other:        'other_activity_description',
  events:       'event_description',
};

export function useSiteDescription(pageType) {
  const { locale } = useLocale();
  const [description, setDescription] = useState('');

  useEffect(() => {
    getSiteData(locale).then(data => {
      if (!data) return;
      const key = DESCRIPTION_KEYS[pageType];
      setDescription((key && data.locale_data?.[key]) || '');
    });
  }, [pageType, locale]);

  return description;
}
