import * as React from 'react';
import { Image, ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';

import 'react-native-gesture-handler';
import { COLORS } from '../assets/styles/styles';
const Tab = createBottomTabNavigator();

import IndexCard from '../components/cards/index_card_component';
import PageFooter from '../components/PageFooter';

export default function HomeScreen({ navigation }) {
  const { t } = useTranslation();

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <View style={styles.feed}>
        <IndexCard url='outdoors_list' image={require('../assets/images/outdoor.png')} title={t('home.outdoor')} />
        <IndexCard url='indoors_list' image={require('../assets/images/indoor.png')} title={t('home.indoor')} />
        <IndexCard url='ices_list' image={require('../assets/images/ice.png')} title={t('home.ice')} />
        <IndexCard url='mountain_routes_list' image={require('../assets/images/mount.png')} title={t('home.mountain')} />
        <IndexCard url='other_activities_list' image={require('../assets/images/other.png')} title={t('home.other')} />
        <IndexCard url='summits_list' image={require('../assets/images/summit.png')} title={t('home.summits')} />
      </View>

      <View style={styles.bottom_feed}>
        <TouchableOpacity style={styles.long_card} onPress={() => navigation.navigate('about_us')}>
          <View style={styles.long_card_image_view}>
            <Image style={styles.long_card_image} source={require('../assets/images/about_us.png')} />
          </View>
          <View style={styles.long_card_text_view}>
            <Text style={styles.long_card_text}>{t('home.about_us')}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <PageFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  feed: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-around',
  },
  bottom_feed: {
    flexDirection: 'column',
    padding: 16,
    paddingTop: 0,
  },
  long_card: {
    backgroundColor: 'white',
    width: '100%',
    height: 100,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderRadius: 20,
    borderColor: COLORS.primary,
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
  long_card_text_view: {},
  long_card_text: {
    fontSize: 20,
  },
});
