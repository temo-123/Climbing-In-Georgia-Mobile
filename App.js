// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Navigation } from './navigation/Navigation.jsx';
// import { DrawerNavigation } from '@react-navigation/drawer'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
// import { faMugEmpty } from '@fortawesome/free-solid-svg-icons/faMugEmpty'
// import { registerRootComponent } from 'expo';

// import GStyle from './assets/styles/styles.js'

// import { GoogleAnalyticsTracker } from "react-native-google-analytics-bridge";

library.add(fab, faSquareCheck)

export default function App() {
// let tracker = new GoogleAnalyticsTracker("5206567952");
// tracker.trackScreenView("Home");
  // const GStyle = GStyle
  if(1==1){
    return (
      <Navigation />
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