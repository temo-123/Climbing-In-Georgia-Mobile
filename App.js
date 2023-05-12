import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Navigation } from './navigation/Navigation.jsx';

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
// import { faMugEmpty } from '@fortawesome/free-solid-svg-icons/faMugEmpty'

library.add(fab, faSquareCheck)



// NetInfo.getConnectionInfo().then(connectionInfo => {
//   console.log(
//     'Initial, type: ' +
//       connectionInfo.type +
//       ', effectiveType: ' +
//       connectionInfo.effectiveType,
//   );
// });
// function handleFirstConnectivityChange(connectionInfo) {
//   console.log(
//     'First change, type: ' +
//       connectionInfo.type +
//       ', effectiveType: ' +
//       connectionInfo.effectiveType,
//   );
//   NetInfo.removeEventListener(
//     'connectionChange',
//     handleFirstConnectivityChange,
//   );
// }
// NetInfo.addEventListener(
//   'connectionChange',
//   handleFirstConnectivityChange,
// );



export default function App() {
  // return (
  //   <View>
  //     <Navigation />

  //     <StatusBar style="auto" />
  //   </View>
  // );



  // if (
  //   appState.current.match(/inactive|background/) &&
  //   nextAppState === "active"
  // ) {
  //   // TODO SET USERS ONLINE STATUS TO TRUE
  // } else {
  //  // TODO SET USERS ONLINE STATUS TO FALSE
  // }


  if(1==1){
    return <Navigation />
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
