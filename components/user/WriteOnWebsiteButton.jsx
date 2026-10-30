import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../../assets/styles/styles';
import { faPen } from '@fortawesome/free-solid-svg-icons';
import IconText from '../ui/IconText';

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
      <IconText icon={faPen} iconColor={COLORS.primary} style={styles.buttonText}>{t('user.write_on_website_title')}</IconText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 999,
    paddingVertical: 12, alignItems: 'center', marginHorizontal: 16, marginTop: 16, marginBottom: 4,
  },
  buttonText: { color: COLORS.primary, fontFamily: FONTS.bodyBold, fontSize: 14 },
});
