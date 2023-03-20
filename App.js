import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import { Navigation } from './navigation/Navigation.jsx';

import { library } from '@fortawesome/fontawesome-svg-core'
import { fab } from '@fortawesome/free-brands-svg-icons'
import { faSquareCheck } from '@fortawesome/free-solid-svg-icons/faSquareCheck'
// import { faMugEmpty } from '@fortawesome/free-solid-svg-icons/faMugEmpty'

library.add(fab, faSquareCheck)

export default function App() {
  // return (
  //   <View>
  //     <Navigation />

  //     <StatusBar style="auto" />
  //   </View>
  // );

  return <Navigation />
}
