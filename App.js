import { StyleSheet, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Navigation } from './navigation/Navigation.jsx';
import { LocaleProvider } from './utils/LocaleContext';
import './utils/i18n';

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
library.add(fab, faSquareCheck)

LogBox.ignoreLogs(['Unable to activate keep awake']);

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <Navigation />
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
