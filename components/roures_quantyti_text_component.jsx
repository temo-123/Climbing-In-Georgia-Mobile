import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
        <Text style={styles.route_quantyti_text}>
            In Georgia are  
                666 outdoor climbing sectors, 
                666 sport climbing routes, 
                666 boulder routes, 
                666 multy pitch. You can see all outdoor climbing arias info on this page.
        </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: '2%',
    paddingLeft: 24,
    paddingRight: 24,
    alignItems: 'center',
  },
  route_quantyti_text: {
    fontSize: 16,
  },
});