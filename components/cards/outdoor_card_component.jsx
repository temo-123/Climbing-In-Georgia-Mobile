// import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';

import React from 'react';

import { useNavigation } from '@react-navigation/native';

export default function outdoorCard({cardData}) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.outdoor_article_card} onPress={() => navigation.navigate('outdoor_page')}>
      <View style={styles.outdoor_article_card_image_view}>
        <Image style={styles.outdoor_article_card_image} source={{uri: "https://climbing.ge/images/outdoor_img/" + cardData.area.image}} />
      </View>
      <View style={styles.outdoor_article_card_text}>
        <Text style={styles.outdoor_article_card_title} onPress={() => navigation.navigate('outdoor_page')}>{cardData.area[0][0].title}</Text>
        <View>
          <View style={styles.outdoor_article_card_routes}>
            <Text style={styles.outdoor_article_card_routes_text}>Sectors - {cardData.route_quantyty.sectors}</Text>
          </View>
          <View style={styles.outdoor_article_card_routes}>
            <Text style={styles.outdoor_article_card_routes_text}>Routes - {cardData.route_quantyty.routes} </Text>
            <Text style={styles.outdoor_article_card_routes_text}>Multy pitchs - {cardData.route_quantyty.mtps}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  outdoor_article_card: {
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
  outdoor_article_card_image_view: {
    width: '45%', 
  },
  outdoor_article_card_image: {
    height: '100%',
    borderRadius: 10,
    resizeMode: 'contain',
  },
  outdoor_article_card_text: {
    flex: 1,
    padding: 4
  },
  outdoor_article_card_title: {
    fontSize: 20,
    float: 'top'
  },
  outdoor_article_card_routes: {
    flexDirection: 'row',
    marginTop: 3,
  },
  outdoor_article_card_routes_text: {
    fontSize: 14,
  },
})
