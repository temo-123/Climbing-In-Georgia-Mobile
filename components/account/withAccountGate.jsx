import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAccount } from '../../utils/AuthContext';
import AgeRestrictionPanel from './AgeRestrictionPanel';
import VerifyEmailPanel from './VerifyEmailPanel';
import { COLORS } from '../../assets/styles/styles';

// Wraps a user-panel screen like the web user page's route guard: an
// under-age account sees only the age panel; an unverified one sees the
// "Verify your e-mail" panel — except on screens that must stay open while
// unverified (`allowUnverified`: Options, where the e-mail can be changed).
// Call at module level (a wrapper made during render remounts every time).
export default function withAccountGate(Screen, { allowUnverified = false } = {}) {
  function AccountGated(props) {
    const { isUnderage, isUnverified } = useAccount();
    const navigation = useNavigation();
    const goHome = () => navigation.navigate('HomeDrawer', { screen: 'home' });

    if (isUnderage) {
      return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <AgeRestrictionPanel
            onLeave={goHome}
            onContact={() => navigation.navigate('HomeDrawer', { screen: 'about_us' })}
          />
        </ScrollView>
      );
    }
    if (isUnverified && !allowUnverified) {
      return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <VerifyEmailPanel
            onChangeEmail={() => navigation.navigate('user_options')}
            onLeave={goHome}
          />
        </ScrollView>
      );
    }
    return <Screen {...props} />;
  }
  AccountGated.displayName = `withAccountGate(${Screen.displayName || Screen.name || 'Screen'})`;
  return AccountGated;
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.chalk },
  content: { padding: 20, paddingTop: 28, paddingBottom: 48 },
});
