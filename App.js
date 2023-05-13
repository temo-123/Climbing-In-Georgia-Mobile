// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Navigation } from './navigation/Navigation.jsx';
// import { DrawerNavigation } from '@react-navigation/drawer'

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
// import { faMugEmpty } from '@fortawesome/free-solid-svg-icons/faMugEmpty'
// import { registerRootComponent } from 'expo';
// import { GoogleAnalyticsTracker } from "react-native-google-analytics-bridge";
// let tracker = new GoogleAnalyticsTracker("1:791740222419:android:3c905a7f3272ef68d63d26");
// tracker.trackScreenView("Home");



library.add(fab, faSquareCheck)

export default function App() {
  if(1==1){
    return (
      // <View style={styles.container}>
        <Navigation />
      // </View>
    )
    
    // const Drawer = DrawerNavigation();

    // return  (
    //   <Navigation>
    //     <Drawer.Navigator
    //           drawerType="front"
    //           initialRouteName="Profile"
    //           drawerContentOptions={{
    //             activeTintColor: '#e91e63',
    //             itemStyle: { marginVertical: 10 },
    //           }}
    //     >
    //     </Drawer.Navigator>
    //   </Navigation>
    // )
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