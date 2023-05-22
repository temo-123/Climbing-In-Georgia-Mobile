import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import RoutesTable from "../../components/Routes_and_sectors/routes_tab";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.h1}>outdoor spot!</Text>
      <Text style={styles.h2}>outdoor spot!</Text>
      <Text>outdoor spot!</Text>
      <RoutesTable />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  h1: {
    fontSize: 26
  },
  h2: {
    fontSize: 20
  }
});
