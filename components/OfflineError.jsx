import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SCENES } from './ui/scenes';
import { COLORS, FONTS } from '../assets/styles/styles';

export default function OfflineError() {
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <View style={styles.scene}>
        <SvgXml xml={SCENES.lost} width="100%" height="100%" />
      </View>
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
    padding: 28,
    gap: 14,
    backgroundColor: COLORS.chalk,
  },
  scene: { width: '80%', maxWidth: 260, aspectRatio: 360 / 420 },
  title: {
    fontSize: 28,
    fontFamily: FONTS.displayBold,
    color: COLORS.ink,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    fontFamily: FONTS.body,
    color: COLORS.stone,
    textAlign: 'center',
    lineHeight: 22,
  },
  highlight: { color: COLORS.primary, fontFamily: FONTS.bodyBold },
});
