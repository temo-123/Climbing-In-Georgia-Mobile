import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_BASE_URL, corsUrl } from './api';
import { useLocale } from './LocaleContext';

// Region names (shared by outdoor, indoor and ice articles via
// `outdoor_region`): GET get_region/get_local_regions/{lang} → [{ id, name }].
// Cached on the device so region filters keep their names offline.
export function useRegions() {
  const { locale } = useLocale();
  const [regions, setRegions] = useState({});
  useEffect(() => {
    const key = `@regions_${locale}`;
    let alive = true;
    const toMap = (list) => Object.fromEntries((Array.isArray(list) ? list : []).map((r) => [r.id, r.name]));
    AsyncStorage.getItem(key).then((v) => { if (alive && v) setRegions(toMap(JSON.parse(v))); }).catch(() => {});
    api.get(corsUrl(`${API_BASE_URL}/get_region/get_local_regions/${locale}`))
      .then(({ data }) => {
        if (!alive) return;
        setRegions(toMap(data));
        AsyncStorage.setItem(key, JSON.stringify(data)).catch(() => {});
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [locale]);
  return regions;
}

export function regionIdsOf(item) {
  return (item?.global_data?.outdoor_region || []).map((r) => r.id);
}
