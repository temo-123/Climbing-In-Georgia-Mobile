import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import ClimberProfileContent from '../../components/user/ClimberProfileContent';

// Full-page climber profile, reached from the climbers list modal's
// "View full profile" action, or from a route.params.userId deep link.
export default function ClimberProfileScreen({ route }) {
  const userId = route?.params?.userId;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <ClimberProfileContent userId={userId} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f6f8' },
  container: { paddingVertical: 16, paddingBottom: 32 },
});
