// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

import WorkoutCard from "../../components/cards/workout_card_component";

export default function App() {
  const img_easy = require('../../assets/images/training_easy.png/');
  const img_middle = require('../../assets/images/training_middle.png/');
  const img_hard = require('../../assets/images/training_hard.png/');
  return (
    <View style={styles.container}>
      <WorkoutCard 
        image={img_easy} 
        title='Easy training'
        category='easy'
      />
      <WorkoutCard 
        image={img_middle} 
        title='Middle training'
        category='middle'
      />
      <WorkoutCard 
        image={img_hard} 
        title='Hard training'
        category='hard'
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
