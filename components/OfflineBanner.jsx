import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

export default function OfflineBanner() {
  const { t } = useTranslation();
  return (
    <View style={styles.banner}>
      <FontAwesomeIcon icon={faWifi} size={14} color="#7a5c00" />
      <Text style={styles.text}>{t('banner.offline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff3cd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  text: {
    fontSize: 13,
    color: '#7a5c00',
    fontWeight: '500',
  },
});
