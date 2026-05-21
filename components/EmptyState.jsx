import React, { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

const IMAGES = [
  'https://climbing.ge/public/images/404/404_page/1.jpg',
  'https://climbing.ge/public/images/404/404_page/2.jpg',
  'https://climbing.ge/public/images/404/404_page/3.jpg',
  'https://climbing.ge/public/images/404/404_page/4.jpg',
];

export default function EmptyState({ message = 'No content here yet.\nCheck back soon!' }) {
  // Pick a random image once on mount (stable ref, no re-render flicker)
  const uri = useRef(IMAGES[Math.floor(Math.random() * IMAGES.length)]).current;

  return (
    <View style={styles.container}>
      <Image source={{ uri }} style={styles.image} contentFit="contain" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  image: {
    width: 260,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
