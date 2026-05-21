// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

import React from 'react';

import { useNavigation } from '@react-navigation/native';

export default function indexCard({url, image, title}) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate(url)}>
      <Image style={styles.card_img} source={image} />
      <Text style={styles.card_text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    feed: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: 16,
      justifyContent: 'space-around'
    },
    bottom_feed: {
      flex: 1,
      flexDirection: 'column',
      padding: 16,
      paddingTop: 0,
    },
  
  
    card: {
      backgroundColor: 'white',
      width: '45%',
      height: '45%',
      aspectRatio: 1,
      alignItems: 'center',
      marginBottom: 16,
  
      borderWidth: 1.5,
      borderRadius: 20,
      borderColor: "#279fbb",
  
    },
    card_img:{
      width: '75%', 
      height: '75%',
      marginTop: 6,
      resizeMode: 'contain',
    },
    card_text: {
      fontSize: 20
    },
  
  
    long_card: {
      backgroundColor: 'white',
      width: '100%',
      height: 100,
      alignItems: 'center',
      marginBottom: 16,
  
      borderWidth: 1.5,
      borderRadius: 20,
      borderColor: "#279fbb",
  
      flexDirection: 'row',
    },
    long_card_image_view: {
      width: '50%', 
    },
    long_card_image: {
      width: '50%', 
      height: '100%',
      margin: 4,
      resizeMode: 'contain',
    },
    long_card_text: {
      fontSize: 20
    },
  });
  