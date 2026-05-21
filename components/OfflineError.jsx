import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCloudXmark } from '@fortawesome/free-solid-svg-icons';

export default function OfflineError() {
  return (
    <View style={styles.container}>
      <FontAwesomeIcon icon={faCloudXmark} size={64} color="#ccc" />
      <Text style={styles.title}>You are offline</Text>
      <Text style={styles.message}>
        No cached data found.{'\n'}
        Connect to the internet and download data from{'\n'}
        <Text style={styles.highlight}>Offline Mode</Text> in the menu.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  highlight: {
    color: '#279fbb',
    fontWeight: '600',
  },
});
