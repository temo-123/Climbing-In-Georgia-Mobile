import { StyleSheet, Text, View } from 'react-native';
import axios from 'axios'
import React, { useState } from 'react';

export default function App() {
  const [quantity_data, useData] = useState([])

  React.useEffect(() => {
    axios
    .get('https://climbing.ge/api/sectors_and_routes_quantity')
    .then(({ data }) => {
      useData(data);
    })
    .catch(error => {
      Alert.alert('ERROR!', 'Axios request is fale')
    })
  }, []);

  return (
    <View style={styles.container}>
        <Text style={styles.route_quantyti_text}>
            In Georgia are  
                {quantity_data.sectors} outdoor climbing sectors, 
                {quantity_data.sport_routes} sport climbing routes, 
                {quantity_data.boulder_routes} boulder routes, 
                {quantity_data.mtps} multy pitch. You can see all outdoor climbing arias info on this page.
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