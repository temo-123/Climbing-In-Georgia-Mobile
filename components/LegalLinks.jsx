import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';
import { openPrivacyPolicy, openTermsOfUse } from '../utils/legalLinks';
import { COLORS } from '../assets/styles/styles';

// "Privacy Policy" / "Terms of Use" rows — rendered inside a parent card/section.
export default function LegalLinks() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <View>
      <TouchableOpacity style={styles.row} onPress={() => openPrivacyPolicy(locale)} activeOpacity={0.7}>
        <Text style={styles.text}>{t('legal.privacy_policy')}</Text>
        <Text style={styles.arrow}>↗</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => openTermsOfUse(locale)} activeOpacity={0.7}>
        <Text style={styles.text}>{t('legal.terms_of_use')}</Text>
        <Text style={styles.arrow}>↗</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    gap: 8,
  },
  text: { flex: 1, fontSize: 13, color: '#222', fontWeight: '600' },
  arrow: { fontSize: 14, color: COLORS.primary },
});
