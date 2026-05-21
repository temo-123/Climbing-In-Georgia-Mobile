import { useState, useEffect } from 'react';
import api, { corsUrl } from './api';
import { loadOfflineData, saveOfflineData, OFFLINE_KEYS } from './offlineStorage';

const SITE_DATA_URL = 'https://climbing.ge/api/get_site_data/get_site_locale_data_for_site/en';

// Module-level cache so all pages share a single fetch
let _cache = null;
let _promise = null;

function getSiteData() {
  if (_cache) return Promise.resolve(_cache);
  if (!_promise) {
    _promise = api.get(corsUrl(SITE_DATA_URL))
      .then(({ data }) => {
        _cache = data;
        saveOfflineData(OFFLINE_KEYS.site_data, data);
        return data;
      })
      .catch(async () => {
        const cached = await loadOfflineData(OFFLINE_KEYS.site_data);
        if (cached) { _cache = cached; return cached; }
        return null;
      });
  }
  return _promise;
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
  const [description, setDescription] = useState('');

  useEffect(() => {
    getSiteData().then(data => {
      if (!data) return;
      const key = DESCRIPTION_KEYS[pageType];
      setDescription((key && data.locale_data?.[key]) || '');
    });
  }, [pageType]);

  return description;
}
