import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import React from 'react';
import { useNavigation } from '@react-navigation/native';

export default function indexCard({ url, image, title }) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate(url)}>
      <Image style={styles.card_img} source={image} contentFit="contain" />
      <Text
        style={styles.card_text}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.65}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    width: '45%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 16,
    borderWidth: 1.5,
    borderRadius: 20,
    borderColor: '#279fbb',
    paddingBottom: 8,
  },
  card_img: {
    width: '72%',
    height: '68%',
    marginTop: 6,
  },
  card_text: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 6,
    color: '#222',
  },
});
