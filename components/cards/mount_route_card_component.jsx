import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';

import React from 'react';

import { useNavigation } from '@react-navigation/native';
import { imgUri } from '../../utils/api';

export default function outdoorCard({cardData}) {
  const navigation = useNavigation();
  return (
    <TouchableOpacity style={styles.outdoor_article_card} onPress={() => navigation.navigate('mountain_route_page', { url_title: cardData.global_data.url_title, mount_masive: cardData.mount_masive })}>
      <View style={styles.outdoor_article_card_image_view}>
        <Image style={styles.outdoor_article_card_image} source={{uri: imgUri("https://climbing.ge/public/images/mount_route_img/", cardData.global_data.image)}} contentFit="contain" />
      </View>
      <View style={styles.outdoor_article_card_text}>
        <Text style={styles.outdoor_article_card_title}>{cardData.locale_data.title}</Text>
        {cardData.mount_masive ? (
          <Text style={styles.outdoor_article_card_masive}>{cardData.mount_masive}</Text>
        ) : null}
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
    width: '100%',
    height: '100%',
    borderRadius: 10,
    resizeMode: 'contain',
  },
  outdoor_article_card_text: {
    flex: 1,
    padding: 4
  },
  outdoor_article_card_title: {
    fontSize: 18,
    fontWeight: '500',
  },
  outdoor_article_card_masive: {
    fontSize: 12,
    color: '#279fbb',
    marginTop: 2,
  },
  outdoor_article_card_routes: {
    flexDirection: 'row',
    marginTop: 3,
  },
  outdoor_article_card_routes_text: {
    fontSize: 14,
  },
})
