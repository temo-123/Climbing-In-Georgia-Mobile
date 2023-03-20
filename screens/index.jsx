import * as React from 'react';
import { Button, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'

export default function HomeScreen({ navigation }) {
  return (
    <View>

      <View style={styles.feed}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('outdoors_list')}>
          <Text>Outdoor Spots</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('indoors_list')}>
          <Text>Indoor Gymsss</Text>

          <FontAwesomeIcon icon="square-check" style={{ width: '88%', }}/>

          {/* <FontAwesomeIcon icon="fa-house" /> */}
          {/* <Text>Favorite beverage: </Text><FontAwesomeIcon icon="mug-saucer" /> */}

        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ices_list')}>
          <Text>Ice & Mix</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('mountain_routes_list')}>
          <Text>Mountain routes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('other_activities_list')}>
          <Text>Other Activity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('events_list')}>
          <Text>Events</Text>
        </TouchableOpacity>
      </View>



      {/* <View style={styles.about_feed}>
        <View style={styles.about_us_card}>
          <Button
            title="About us"
            onPress={() => navigation.navigate('about_us')}
          />
          <Text>About us</Text>
        </View>
      </View> */}

      {/* <View style={styles.workout_feed}>
        <View style={styles.workout_card}>
          <Button
            title="Workouts"
            onPress={() => navigation.navigate('aboutUs')}
          />
          <Text>Workout</Text>

        </View>
      </View> */}

    </View>
  );
}

const styles = StyleSheet.create({
  feed: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    justifyContent: 'space-between'  
  },

  about_feed: {
    // flex: 1,
    flexDirection: 'column',
    flexWrap: 'wrap',
    padding: 16,
    aspectRatio: 1,
    justifyContent: 'space-between'  
  },

  card: {
    backgroundColor: 'white',
    width: '28%',
    height: '28%',
    aspectRatio: 1,
    marginBottom: 16,
    alignItems: 'center',
  },

  about_us_card: {
    backgroundColor: 'white',
    width: '68%',
    height: '28%',
    aspectRatio: 1,
    alignItems: 'center',
    marginBottom: 16  
  },

  workout_card: {
    backgroundColor: 'white',
    width: '48%',
    height: '28%',
    aspectRatio: 1,
    alignItems: 'center',
    marginBottom: 16  
  }
});
