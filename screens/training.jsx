import React, { useState }  from 'react';
import { Text, View, StyleSheet, Button, Alert} from 'react-native';
import Constants from 'expo-constants';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer';

import { useNavigation } from '@react-navigation/native';

export default function App() {
  const [isPlaying, setIsPlaying] = React.useState(true)

  const [showBox, setShowBox] = useState(true);
  const navigation = useNavigation();

  const showConfirmDialog = () => {
    return Alert.alert(
      "Are your sure?",
      "Are you sure you want to stop trainbing and go back?",
      [
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
            setShowBox(false);
            navigation.goBack();
          },
        },
        // The "No" button
        // Does nothing but dismiss the dialog when tapped
        {
          text: "No",
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
        <View style={styles.head_buttons}>
            <Button color="#fa5035" title="Stop workout and go back" onPress={() => showConfirmDialog()} />
        </View>
        <Text style={styles.start_title}>Start</Text>
        <Text style={styles.rest_title}>Rest</Text>
        <CountdownCircleTimer
            isPlaying
            duration={7}
            colors={['#004777', '#F7B801', '#A30000', '#A30000']}
            colorsTime={[7, 5, 2, 0]}
        >
            {({ remainingTime }) => <Text style={styles.timer_secunds_text}>{remainingTime}</Text>}
        </CountdownCircleTimer>
        <View style={styles.footer_buttons}>
            <View style={styles.pause_button}>
                <Button color="#009b38" title="Puse" onPress={() => setIsPlaying(prev => !prev)} />
            </View>
            <View style={styles.skip_button}>
                <Button color="#3579fa" title="Skip this episod"  />
            </View>
        </View>
  </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: Constants.statusBarHeight,
    flex: 1,
    padding: 16,
  },
  timer_secunds_text: {
    fontSize: 50,
  },
  head_buttons: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '10%'
  },
  stop_button: {
    
  },
  start_title: {
    fontSize: 50,
    color: "#fa5035",
    marginBottom: '10%'
  },
  rest_title: {
    fontSize: 50,
    color: "#009b38",
    marginBottom: '10%'
  },
  footer_buttons: {
    marginTop: '20%',
    flexDirection: 'column',
  },
  pause_button: {
    paddingLeft: '15%',
    paddingRight: '15%',
  },
  skip_button: {
    padding: '15%',
  }
});
