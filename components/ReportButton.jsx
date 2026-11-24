import React, { useState } from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import ReportSheet from './moderation/ReportSheet';
import { COLORS, FONTS } from '../assets/styles/styles';

// Single "Report" link (App Store 1.2 / Google Play UGC policy). Opens the
// reason sheet, which posts to the backend's /content_report and falls back
// to e-mail while that endpoint doesn't exist — see moderation/ReportSheet.
export default function ReportButton({ type, id, label, style }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.7} hitSlop={8} style={[styles.row, style]}>
        <FontAwesomeIcon icon={faFlag} size={10} color={COLORS.muted} />
        <Text style={styles.text}>{t('report.button')}</Text>
      </TouchableOpacity>
      <ReportSheet visible={open} onClose={() => setOpen(false)} type={type} id={id} label={label} />
    </>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  text: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.muted, textDecorationLine: 'underline' },
});
