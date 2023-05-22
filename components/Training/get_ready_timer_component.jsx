import React, { useState }  from 'react';
import { Text, View, StyleSheet, Button, Alert} from 'react-native';

import Constants from 'expo-constants';
import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'; // https://www.npmjs.com/package/react-native-countdown-circle-timer

// import Constants from 'expo-constants';

export default function GetReady() {
    // const [isPlaying, setIsPlaying] = React.useState(true)
    return(
      <View style={styles.container}>
        <View style={styles.head_buttons}>
            {/* <Button color="#fa5035" title="Stop workout and go back" onPress={ () =>  showConfirmDialog()} /> */}
        </View>
        <Text style={styles.start_title}>Get Ready</Text>
        {/* <CountdownCircleTimer
            isPlaying
            duration={4}
            colors={['#004777', '#F7B801', '#A30000',]}
            colorsTime={[7, 5, 2,]}
            // onComplete={()=> {
            //   ChangeProces('workout')
            // }}
        >
          {({ remainingTime }) => <Text style={styles.timer_secunds_text}>{remainingTime}</Text>}
        </CountdownCircleTimer> */}
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
    are_you_ready_title: {
      fontSize: 50,
      color: "#4a3ee5",
      marginBottom: '10%'
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