import { StyleSheet, LogBox, AppState, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import * as Network from 'expo-network';

import { Navigation } from './navigation/Navigation.jsx';
import { LocaleProvider } from './utils/LocaleContext';
import { NetworkProvider } from './utils/NetworkContext';
import { AuthProvider } from './utils/AuthContext';
import { getQueue, syncQueue } from './utils/ascentQueue';
import { RecaptchaHost } from './utils/recaptcha';
import DonationButton from './components/donation/DonationButton';
import './utils/i18n';

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
library.add(fab, faSquareCheck)

LogBox.ignoreLogs([
  'Unable to activate keep awake',
  'setLayoutAnimationEnabledExperimental is currently a no-op',
]);

const IS_EXPO_GO = Constants.appOwnership === 'expo';

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    setupNotifications();
    trySyncQueue();

    const appStateSub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        trySyncQueue();
      }
      appState.current = nextState;
    });

    // Ascents queued while offline previously only synced on the next
    // background→foreground transition — someone who queues an ascent and
    // then just waits for signal (walking down from a summit) with the app
    // still open would never see it upload. This fires the moment
    // connectivity actually returns instead.
    let networkSub;
    let reconnectTimer;
    try {
      networkSub = Network.addNetworkStateListener(state => {
        // "isConnected" is link-layer ("Wi-Fi/cellular is up"), not proof the
        // route to the internet actually works yet (DHCP/DNS can lag a couple
        // seconds behind the OS reporting connected) — a short settle delay
        // avoids syncing into that gap and marking a queued ascent as failed
        // for a connection that was never really usable in the first place.
        clearTimeout(reconnectTimer);
        if (state.isConnected) reconnectTimer = setTimeout(trySyncQueue, 2000);
      });
    } catch {}

    return () => {
      appStateSub.remove();
      networkSub?.remove();
      clearTimeout(reconnectTimer);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <NetworkProvider>
            <AuthProvider>
              <RecaptchaHost />
              <Navigation />
              <DonationButton />
            </AuthProvider>
          </NetworkProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

async function setupNotifications() {
  if (IS_EXPO_GO) return;
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') return;
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('ascent_sync', {
        name: 'Ascent Sync',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
  } catch {}
}

async function trySyncQueue() {
  try {
    const queue = await getQueue();
    if (queue.length > 0) {
      await syncQueue();
    }
  } catch {}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
