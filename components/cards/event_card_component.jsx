// import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';

import React from 'react';

import { useNavigation } from '@react-navigation/native';

export default function outdoorCard({cardData}) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.article_card} onPress={() => navigation.navigate('event_page')}>
      <View style={styles.article_card_image_view}>
        <Image style={styles.article_card_image} source={{uri: "https://climbing.ge/images/event_img/" + cardData.global_event.image }} />
      </View>
      <View style={styles.article_card_text}>
        <View style={styles.event_datas}>
          <View style={styles.event_calendar_start}>
            <Text style={styles.event_start_calendar_head}>Start</Text>
            {/* <Text style={styles.event_start_calendar_day}> May 4 (10:00)</Text> */}
            <Text style={styles.event_start_calendar_day}>{cardData.global_event.start_data}</Text>
            {/* <Text style={styles.event_start_calendar_time}>10:00</Text> */}
          </View>
          <View style={styles.event_calendar_end}>
            <Text style={styles.event_end_calendar_head}>And</Text>
            {/* <Text style={styles.event_end_calendar_day}>May 4 (18:00)</Text> */}
            <Text style={styles.event_start_calendar_day}>{cardData.global_event.end_data}</Text>
            {/* <Text style={styles.event_end_calendar_tile}>18:00</Text> */}
          </View>
        </View>
        <Text style={styles.article_card_title} onPress={() => navigation.navigate('event_page')}>{cardData.locale_event.title}</Text>
        {/* <Text style={styles.article_card_description}>article description</Text> */}
        
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  article_card: {
    backgroundColor: 'white',
    width: '100%',
    height: 100,
    alignItems: 'center',
    marginBottom: 16,

    borderWidth: 1.5,
    borderRadius: 10,
    borderColor: "#279fbb",

    flexDirection: 'row',
  },
  article_card_image_view: {
    width: '45%', 
  },
  article_card_image: {
    height: '100%',
    borderRadius: 10,
    resizeMode: 'contain',
  },
  article_card_text: {
    flex: 1,
    padding: 4
  },
  article_card_title: {
    fontSize: 20,
    float: 'top'
  },
  // article_card_routes: {
  //   flexDirection: 'row',
  //   marginBottom: 3,
  // },
  // article_card_routes_text: {
  //   fontSize: 14,
  // },
  event_datas: {
    flexDirection: 'row',
  },
  event_calendar_start: {
    // backgroundColor: '#ooo',
    flexGrow: 1,
    // alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 5,
    borderColor: "#279fbb",

    margin: 4,
    // padding: 4,
    flexDirection: 'column',
  },
  event_calendar_end: {
    // justifyContent: 'flex-end',
    // backgroundColor: '#ooo',
    // boarder: 1,
    // right: 0,
    flexGrow: 1,
    // alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 5,
    borderColor: "#279fbb",

    margin: 4,
    // padding: 4,
    flexDirection: 'column',
  },
  event_start_calendar_head: {
    backgroundColor: "#065fd4",
    color: "#fff"
    
  },
  event_end_calendar_head: {
    // flexDirection: 'column',
    backgroundColor: "#065fd4",
    color: "#fff"
  }
})
