import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App(props) {
  return (
    <View style={styles.container}>
      <Text style={styles.page_header_title}>{props.title}</Text>
      <View style={styles.horizontal}>
        <View style={styles.horizontal_line} />
      </View>
      <Text style={styles.page_heheader_text}>{props.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: '2%',
    alignItems: 'center',
  },
  page_header_title: {
    fontSize: 20,
  },
  page_heheader_text: {
    fontSize: 12,
    paddingTop: '2%',
  },
  horizontal: {
    flexDirection: 'row', 
    alignItems: 'center',
    paddingLeft: 26,
    paddingRight: 26
  },
  horizontal_line: {
    flex: 1, 
    height: 1, 
    backgroundColor: '#000'
  }
});