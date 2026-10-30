import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS } from '../assets/styles/styles';

// Google Play's User Generated Content policy requires an in-app way to report
// objectionable content/users. The backend has no report endpoint, so this
// opens a pre-filled email to the moderators instead.
const REPORT_EMAIL = 'info@climbing.ge';

export default function ReportButton({ type, id, label, style }) {
  const { t } = useTranslation();

  async function report() {
    const subject = `[Report] ${type} #${id}`;
    const body = `${t('report.email_intro')}\n\n${type}: ${label ?? ''} (#${id})\n\n${t('report.email_reason')}\n`;
    const url = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(url);
    } catch {
      // No email app installed — at least tell the user where to write.
      Alert.alert(t('report.title'), t('report.no_email_app', { email: REPORT_EMAIL }));
    }
  }

  return (
    <TouchableOpacity onPress={report} activeOpacity={0.7} hitSlop={8} style={style}>
      <Text style={styles.text}>⚑ {t('report.button')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.muted, textDecorationLine: 'underline' },
});
