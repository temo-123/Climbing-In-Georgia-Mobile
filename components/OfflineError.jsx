import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCloudXmark } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../assets/styles/styles';

export default function OfflineError() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <FontAwesomeIcon icon={faCloudXmark} size={64} color="#ccc" />
      <Text style={styles.title}>{t('error.offline_title')}</Text>
      <Text style={styles.message}>
        {t('error.offline_message')}
        <Text style={styles.highlight}>{t('error.offline_link')}</Text>
        {t('error.offline_suffix')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
