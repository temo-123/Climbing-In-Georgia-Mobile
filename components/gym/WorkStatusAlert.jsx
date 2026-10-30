import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBan, faTriangleExclamation, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// The website's IndoorWorkStatusAlert: red / orange / blue alert with icon,
// title and explanation for the three alert work statuses (no_info gets
// no alert, only the "No information about working time" line).
export const STATUS_META = {
  temporarily_closed: { color: COLORS.danger, icon: faBan },
  sport_session_closed: { color: '#e07a3e', icon: faTriangleExclamation },
  coming_soon: { color: '#2b86b8', icon: faHourglassHalf },
};

export default function WorkStatusAlert({ status }) {
  const { t } = useTranslation();
  const meta = STATUS_META[status];
  if (!meta) return null;
  return (
    <View style={[styles.alert, { backgroundColor: meta.color }]}>
      <FontAwesomeIcon icon={meta.icon} size={18} color="#fff" />
      <View style={styles.flex}>
        <Text style={styles.title}>{t(`site.guide.article.work_status.${status}`)}</Text>
        <Text style={styles.text}>{t(`site.guide.article.work_status_text.${status}`)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  alert: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: RADII.lg, marginBottom: 14 },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, color: '#fff' },
  text: { fontFamily: FONTS.bodyMedium, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.92)', marginTop: 2 },
});
