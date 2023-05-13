// import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

import { MountCard } from "../../components/cards/mount_route_card_component";
import  Article_list_header_text  from "../../components/article_list_header_text_component"
 
export default function App() {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Article_list_header_text 
        title="Mounain Climbing In Georgia" 
        description="description 1"
      />
      <View style={styles.container}>
        <MountCard />
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
