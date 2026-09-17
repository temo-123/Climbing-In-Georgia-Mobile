import { useEffect, useRef } from 'react';
import { useNetwork } from './NetworkContext';

// Re-runs `load` the moment the device regains connectivity. Screens/components
// that fall back to cached offline data on a failed request only ever retry on
// their own mount/dependency changes otherwise — without this, a page opened
// while offline keeps showing the stale cached snapshot forever even after the
// device is back online, instead of the live server data it should show.
export function useRefetchOnReconnect(load) {
  const { isOffline } = useNetwork();
  const wasOffline = useRef(isOffline);
  useEffect(() => {
    if (wasOffline.current && !isOffline) load();
    wasOffline.current = isOffline;
  }, [isOffline, load]);
}
