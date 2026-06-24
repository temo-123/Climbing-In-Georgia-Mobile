import { StyleSheet, LogBox, AppState, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';

import { Navigation } from './navigation/Navigation.jsx';
import { LocaleProvider } from './utils/LocaleContext';
import { AuthProvider } from './utils/AuthContext';
import { getQueue, syncQueue } from './utils/ascentQueue';
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

    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        trySyncQueue();
      }
      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AuthProvider>
            <Navigation />
          </AuthProvider>
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
