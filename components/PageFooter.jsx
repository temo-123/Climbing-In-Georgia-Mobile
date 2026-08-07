import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../assets/styles/styles';

export default function PageFooter() {
  const { t } = useTranslation();
  return (
    <View style={styles.footer}>
      <View style={styles.line} />
      <Text style={styles.text}>{t('footer')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 120,
    marginTop: 8,
  },
  line: {
    width: 40,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.primary,
    marginBottom: 10,
    opacity: 0.4,
  },
  text: {
    fontSize: 12,
    color: '#aaa',
    letterSpacing: 0.3,
  },
});
