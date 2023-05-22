import React, { useState }  from 'react';
import { Text, View, StyleSheet, Button, Alert} from 'react-native';

import Constants from 'expo-constants';
// import { CountdownCircleTimer } from 'react-native-countdown-circle-timer'; // https://www.npmjs.com/package/react-native-countdown-circle-timer

import { useNavigation } from '@react-navigation/native';

import GetReady from "../components/Training/get_ready_timer_component";
import RestTimer from "../components/Training/rest_timer_component";
import WorkoutTimer from "../components/Training/workout_timer_component";

export default function App() {
  const [proces, useProces] = useState("starting_button")
  const [navigation] = useState(useNavigation());

  // if (proces == 'rest') {
  //   return (
  //     // RestTimer()
  //     <RestTimer />
  //   )
  // }
  // else if (proces == 'workout') {
  //   return (
  //     // WorkoutTimer()
  //     <WorkoutTimer />
  //   )
  // }
  // else 
  if (proces == 'starting_timer') {
    return (
      // StartingTimer()
      <GetReady />
    )
  }
  else if (proces == 'starting_button') {
    return (
      StartingButton()
    )
  }

  function ChangeProces(action) {
    // proces = action
    useProces(action)
    // console.log(proces)
  }

  function showConfirmDialog () {
    // const navigation = useNavigation();
    return Alert.alert(
      "Are your sure?",
      "Are you sure you want to stop trainbing and go back?",
      [
        // The "Yes" button
        {
          text: "Yes",
          onPress: () => {
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
  }

  function StartingButton () {
    const [isPlaying, setIsPlaying] = React.useState(true)
    return(
      <View style={styles.container}>
        <View style={styles.head_buttons}>
            <Button color="#fa5035" title="Stop workout and go back" onPress={ () =>  showConfirmDialog()} />
        </View>
        <Text style={styles.are_you_ready_title}>Are You Ready?</Text>
        <View style={styles.head_buttons}>
            <Button color="#3ec1e5" title="Lets Start" onPress={ () =>  ChangeProces('starting_timer')} />
        </View> 
      </View>
    )
  }

  // function StartingTimer () {
  //   const [isPlaying, setIsPlaying] = React.useState(true)
  //   return(
  //     <View style={styles.container}>
  //       <View style={styles.head_buttons}>
  //           <Button color="#fa5035" title="Stop workout and go back" onPress={ () =>  showConfirmDialog()} />
  //       </View>
  //       <Text style={styles.start_title}>Get Ready</Text>
  //       <CountdownCircleTimer
  //           isPlaying
  //           duration={4}
  //           colors={['#004777', '#F7B801', '#A30000',]}
  //           colorsTime={[7, 5, 2,]}
  //           onComplete={()=> {
  //             ChangeProces('workout')
  //           }}
  //       >
  //         {({ remainingTime }) => <Text style={styles.timer_secunds_text}>{remainingTime}</Text>}
  //       </CountdownCircleTimer>
  //     </View>
  //   )
  // }

  // function WorkoutTimer () {
  //   const [isPlaying, setIsPlaying] = React.useState(true)
  //   return(
  //     <View style={styles.container}>
  //       <View style={styles.head_buttons}>
  //           <Button color="#fa5035" title="Stop workout and go back" onPress={ () =>  showConfirmDialog()} />
  //       </View>
  //       <Text style={styles.start_title}>Start</Text>
  //       <CountdownCircleTimer
  //           isPlaying
  //           duration={7}
  //           colors={['#004777', '#F7B801', '#A30000',]}
  //           colorsTime={[7, 5, 2,]}
  //           onComplete={()=> {
  //             ChangeProces('rest')
  //           }}
  //       >
  //         {({ remainingTime }) => <Text style={styles.timer_secunds_text}>{remainingTime}</Text>}
  //       </CountdownCircleTimer>
  //       <View style={styles.footer_buttons}>
  //           <View style={styles.pause_button}>
  //               <Button color="#009b38" title="Puse" onPress={() => setIsPlaying(prev => !prev)} />
  //           </View>
  //           <View style={styles.skip_button}>
  //               <Button color="#3579fa" title="Skip this episod"  />
  //           </View>
  //       </View>
  //     </View>
  //   )
  // }

  // function RestTimer () {
  //   const [isPlaying, setIsPlaying] = React.useState(true)
  //   return (
  //     <View style={styles.container}>
  //       <View style={styles.head_buttons}>
  //           <Button color="#fa5035" title="Stop workout and go back" onPress={ () => showConfirmDialog()} />
  //       </View>
  //       <Text style={styles.rest_title}>Rest</Text>
  //       <CountdownCircleTimer
  //           isPlaying
  //           duration={7}
  //           colors={['#A30000', '#F7B801', '#004777', ]}
  //           colorsTime={[7, 5, 2,]}
  //           onComplete={()=> {
  //             ChangeProces('workout')
  //           }}
  //       >
  //         {({ remainingTime }) => <Text style={styles.timer_secunds_text}>{remainingTime}</Text>}
  //       </CountdownCircleTimer>
  //       <View style={styles.footer_buttons}>
  //           <View style={styles.pause_button}>
  //               <Button color="#009b38" title="Puse" onPress={() => setIsPlaying(prev => !prev)} />
  //           </View>
  //           <View style={styles.skip_button}>
  //               <Button color="#3579fa" title="Skip this episod"  />
  //           </View>
  //       </View>
  //     </View>
  //   )
  // }

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
