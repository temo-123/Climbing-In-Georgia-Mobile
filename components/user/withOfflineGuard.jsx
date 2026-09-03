import React from 'react';
import { useNetwork } from '../../utils/NetworkContext';
import OfflinePanelNotice from './OfflinePanelNotice';

// Wraps a user-panel screen so it renders the offline notice instead of
// mounting the screen (and firing requests that can only fail) while there is
// no connection. Call it at module level — a new wrapper created during render
// would remount the screen on every re-render.
export default function withOfflineGuard(Screen) {
  function OfflineGuarded(props) {
    const { isOffline } = useNetwork();
    if (isOffline) return <OfflinePanelNotice />;
    return <Screen {...props} />;
  }
  OfflineGuarded.displayName = `withOfflineGuard(${Screen.displayName || Screen.name || 'Screen'})`;
  return OfflineGuarded;
}
