import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../assets/styles/styles';

// Adding a comment/route review isn't supported in the app yet — this
// points users to the website instead of a dead end.
export default function WriteOnWebsiteButton({ labelKey }) {
  const { t } = useTranslation();

  function handlePress() {
    Alert.alert(
      t('user.write_on_website_title'),
      t(labelKey),
      [
        { text: t('user.cancel'), style: 'cancel' },
        { text: t('user.open_website'), onPress: () => Linking.openURL('https://climbing.ge') },
      ]
    );
  }

  return (
    <TouchableOpacity style={styles.button} onPress={handlePress} activeOpacity={0.8}>
      <Text style={styles.buttonText}>✏️ {t('user.write_on_website_title')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  buttonText: { color: COLORS.primary, fontWeight: '700', fontSize: 14 },
});
