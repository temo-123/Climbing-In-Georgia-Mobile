import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { imgUri } from '../../utils/api';

function fmtTime(t) {
  // "08:00:00" → "08:00"
  return t ? t.substring(0, 5) : null;
}

export default function IndoorCard({ cardData }) {
  const navigation = useNavigation();
  const gd = cardData.global_data;

  const openTime = fmtTime(gd.open_time);
  const closeTime = fmtTime(gd.closed_time);
  const priceFrom = gd.price_from ?? null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('indoor_page', gd.url_title)}
    >
      <View style={styles.imageView}>
        <Image
          style={styles.image}
          source={{ uri: imgUri("https://climbing.ge/public/images/indoor_img/", gd.image) }}
          contentFit="cover"
        />
      </View>
      <View style={styles.textView}>
        <Text style={styles.title}>{cardData.locale_data.title}</Text>
        <View style={styles.infoRow}>
          {openTime && closeTime && (
            <Text style={styles.infoText}>{openTime} – {closeTime}</Text>
          )}
          {priceFrom != null && (
            <Text style={styles.infoText}>From {priceFrom} GEL</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    width: '100%',
    minHeight: 100,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderRadius: 10,
    borderColor: '#279fbb',
    flexDirection: 'row',
  },
  imageView: {
    width: '45%',
    height: 100,
  },
  image: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  textView: {
    flex: 1,
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
  },
  infoRow: {
    marginTop: 4,
    gap: 2,
  },
  infoText: {
    fontSize: 13,
    color: '#555',
  },
});
