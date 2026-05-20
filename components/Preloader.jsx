import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Preloader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#279fbb" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
