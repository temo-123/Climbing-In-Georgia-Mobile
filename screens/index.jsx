import * as React from 'react';
import { Image, ScrollView, Button, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

import SvgUri from 'react-native-svg'
// import Svg, { Path } from "react-native-svg";;


import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';


// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'

import 'react-native-gesture-handler';
const Tab = createBottomTabNavigator();

// export default function App() {
//   return (
//     <NavigationContainer>
//       <Tab.Navigator>
//         {/* <Tab.Screen name="Home" component={HomeScreen} />
//         <Tab.Screen name="Settings" component={SettingsScreen} /> */}
//       </Tab.Navigator>
//     </NavigationContainer>
//   );
// }

export default function HomeScreen({ navigation }) {
  return (
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>

        <View style={styles.feed}>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('outdoors_list')}>
            {/* <View style={styles.container}>
              <SvgUri
                width="50%"
                height="50%"
                uri="http://thenewcode.com/assets/images/thumbnails/homer-simpson.svg"
              />
            </View> */}
            <Image style={styles.card_img} source={require('../assets/images/indoor.png/')} />
            <Text style={styles.card_text}>Outdoor Spots</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('indoors_list')}>
            <Image style={styles.card_img} source={require('../assets/images/outdoor.png/')} />
            <Text style={styles.card_text}>Indoor Gyms</Text>
            {/* <FontAwesomeIcon icon="square-check" style={{ width: '88%', }}/> */}
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ices_list')}>
            <Image style={styles.card_img} source={require('../assets/images/ice.png/')} />
            <Text style={styles.card_text}>Ice & Mix</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('mountain_routes_list')}>
            <Image style={styles.card_img} source={require('../assets/images/mount.png/')} />
            <Text style={styles.card_text}>Mountain routes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('other_activities_list')}>
            <Image style={styles.card_img} source={require('../assets/images/other.png/')} />
            <Text style={styles.card_text}>Other Activity</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('events_list')}>
            <Image style={styles.card_img} source={require('../assets/images/event.png/')} />
            <Text style={styles.card_text}>Events</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottom_feed}>
          <TouchableOpacity style={styles.long_card} onPress={() => navigation.navigate('workouts_list')}>
            <View style={styles.long_card_image_view}>
              <Image style={styles.long_card_image} source={require('../assets/images/workout.png/')} />
            </View>
            <View style={styles.long_card_text_view}>
              <Text style={styles.long_card_text}>Workouts</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.long_card} onPress={() => navigation.navigate('about_us')}>
            <View style={styles.long_card_image_view}>
              <Image style={styles.long_card_image} source={require('../assets/images/about_us.png/')} />
            </View>
            <View style={styles.long_card_text_view}>
              <Text style={styles.long_card_text}>About us</Text>
            </View>
          </TouchableOpacity>
        </View>

      </ScrollView>
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
  long_card_text: {
    fontSize: 20
  },
});
