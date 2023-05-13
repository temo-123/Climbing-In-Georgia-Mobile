// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView} from 'react-native';

import { EventCard } from "../../components/cards/event_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"

export default function App() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Article_list_header_text 
        title="Events" 
        description="Events description 1"
      />
      <View style={styles.container}>
        <EventCard />
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
