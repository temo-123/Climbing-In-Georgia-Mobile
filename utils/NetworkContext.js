import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Network from 'expo-network';

// App-wide connectivity flag. Individual screens already do their own
// "the request failed, fall back to cache" handling; this is for the UI that
// has to know about being offline *before* any request happens — the drawer's
// offline indicator and the user-panel gate.
const NetworkContext = createContext({ isOffline: false });

export function NetworkProvider({ children }) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let sub;

    // isInternetReachable runs its own active probe and gives false negatives
    // on some carriers/DNS setups — isConnected ("the link is up") is the
    // trustworthy signal, same choice as SubmitAscentScreen makes.
    Network.getNetworkStateAsync()
      .then(state => { if (mounted) setIsOffline(!state.isConnected); })
      .catch(() => {});

    try {
      sub = Network.addNetworkStateListener(state => {
        if (mounted) setIsOffline(!state.isConnected);
      });
    } catch {}

    return () => {
      mounted = false;
      sub?.remove();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isOffline }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  return useContext(NetworkContext);
}
