import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
    const [isPlaying, setIsPlaying] = React.useState(true)
    return (
      <View style={styles.container}>
        <View style={styles.head_buttons}>
            <Button color="#fa5035" title="Stop workout and go back" onPress={ () => showConfirmDialog()} />
        </View>
        <Text style={styles.rest_title}>Rest</Text>
        <CountdownCircleTimer
            isPlaying
            duration={7}
            colors={['#A30000', '#F7B801', '#004777', ]}
            colorsTime={[7, 5, 2,]}
            onComplete={()=> {
              ChangeProces('workout')
            }}
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
    flex: 1,
    padding: 16,
  },
});
