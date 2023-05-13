// import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';

import React from 'react';

import { useNavigation } from '@react-navigation/native';

export default function WorkoutCard (props) {
  const navigation = useNavigation();
  // console.log(props.image)
  // const imgs = {
  //   test_img: require('../../assets/images/workout.png/')
  // }
  // console.log()
  return (
    <TouchableOpacity style={styles.long_card} onPress={() => navigation.navigate('training', {category: props.category})}>
      <View style={styles.long_card_image_view}>
        {/* <Image style={styles.long_card_image} source={require('../../assets/images/workout.png/')} /> */}
        {/* <Image style={styles.long_card_image} source={require(props.image)} /> */}
        <Image style={styles.long_card_image} source={props.image} />
      </View>
      <View style={styles.long_card_text_view}>
        <Text style={styles.long_card_text}>{props.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
    long_card: {
      backgroundColor: 'white',
      width: '100%',
      height: 100,
      // aspectRatio: 1,
      alignItems: 'center',
      marginBottom: 16,
  
      borderWidth: 1.5,
      borderRadius: 20,
      borderColor: "#279fbb",
  
      flexDirection: 'row',
    },
    long_card_image_view: {
      width: '50%', 
      // height: '50%',
      // resizeMode: 'contain',
    },
    long_card_image: {
      width: '50%', 
      height: '100%',
      margin: 4,
      resizeMode: 'contain',
    },
    long_card_text_view: {
      // fontSize: 20
    },
    long_card_text: {
      fontSize: 20
    },
})
