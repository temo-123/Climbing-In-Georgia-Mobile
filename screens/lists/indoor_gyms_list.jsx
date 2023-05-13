import { Image, StyleSheet, Text, View, Alert, ScrollView, TouchableOpacity } from 'react-native';
import axios from 'axios'

import { IndoorCard } from "../../components/cards/indoor_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"

export default function App() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Article_list_header_text 
        title="Indoor Climbing In Georgia" 
        description="description 1"
      />
      <View style={styles.container}>
        <IndoorCard />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
