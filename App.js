import { StyleSheet, Text, View, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Navigation } from './navigation/Navigation.jsx';

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
library.add(fab, faSquareCheck)

LogBox.ignoreLogs(['Unable to activate keep awake']);

// import { GoogleAnalyticsTracker } from 'react-native-google-analytics-bridge';

export default function App() {
// let tracker = new GoogleAnalyticsTracker('5206567952');
// tracker.trackScreenView('Home')

  // const GStyle = GStyle
  if(1==1){
    return (
      <SafeAreaProvider>
        <Navigation />
      </SafeAreaProvider>
    )
  }
  else{
    return (
      <View style={styles.container}>
        <Text>You are ofline! Need network for get data!</Text>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});