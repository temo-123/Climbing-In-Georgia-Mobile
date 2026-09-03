import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserSlash } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../assets/styles/styles';

// Shown in place of every user-panel screen while the device is offline.
// The panel is entirely server-backed (profile, activity, settings), so there
// is nothing meaningful to render from cache — but the session itself stays
// signed in on purpose, which is what the hint line tells the user.
export default function OfflinePanelNotice() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <FontAwesomeIcon icon={faUserSlash} size={56} color="#ccc" />
      <Text style={styles.title}>{t('user.offline_panel_title')}</Text>
      <Text style={styles.message}>{t('user.offline_panel_message')}</Text>
      <View style={styles.hintBox}>
        <Text style={styles.hint}>{t('user.offline_panel_hint')}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
    backgroundColor: '#f4f6f8',
  },
  title: {
    fontSize: 20,
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
  hintBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: 14,
    marginTop: 6,
  },
  hint: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
