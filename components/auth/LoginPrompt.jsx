import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faRightToBracket, faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Button from '../ui/Button';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Inline "log in to do this" card — the app's version of the website's
// login-gated actions (guests get the login / sign-up prompt instead of the
// form). `onLogin` should close any sheet and open the login screen.
export default function LoginPrompt({ message, onLogin }) {
  const { t } = useTranslation();
  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <FontAwesomeIcon icon={faLock} size={16} color={COLORS.primaryDark} />
      </View>
      <Text style={styles.text}>{message}</Text>
      <Button variant="hold" small block={false} icon={faRightToBracket} title={t('auth.nav_login')} onPress={onLogin} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: 10,
    padding: 18,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d5cfc3',
    backgroundColor: COLORS.surface,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontFamily: FONTS.bodySemi, fontSize: 14, lineHeight: 20, color: COLORS.stone, textAlign: 'center' },
});
