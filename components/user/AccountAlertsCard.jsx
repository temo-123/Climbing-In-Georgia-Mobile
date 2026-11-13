import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faEnvelope, faUser, faLocationDot, faCakeCandles, faCamera, faChevronRight, faCircleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../utils/AuthContext';
import { accountAlerts } from '../../utils/accountAlerts';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

const ICONS = { email: faEnvelope, name: faUser, location: faLocationDot, birthday: faCakeCandles, image: faCamera };

// "N to fix in your profile" (the web user panel's account alerts): each row
// opens Options on the matching field (`onOpen(key)`). Renders nothing when
// the profile is complete.
export default function AccountAlertsCard({ onOpen, style }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const alerts = accountAlerts(user);
  if (!alerts.length) return null;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.head}>
        <FontAwesomeIcon icon={faCircleExclamation} size={15} color={COLORS.danger} />
        <Text style={styles.title}>{t('site.user.nav.account_alerts', { n: alerts.length })}</Text>
      </View>
      {alerts.map((key) => (
        <TouchableOpacity key={key} style={styles.row} onPress={() => onOpen?.(key)} activeOpacity={0.7}>
          <View style={styles.icon}><FontAwesomeIcon icon={ICONS[key]} size={13} color={COLORS.danger} /></View>
          <Text style={styles.label}>{t(`site.user.nav.account_alert.${key}`)}</Text>
          <FontAwesomeIcon icon={faChevronRight} size={11} color={COLORS.muted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fdf1f1', borderRadius: RADII.lg, borderWidth: 1, borderColor: '#f1c4c6',
    paddingVertical: 10, paddingHorizontal: 14, marginBottom: 14,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  title: { fontFamily: FONTS.bodyHeavy, fontSize: 14, color: COLORS.danger },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  icon: { width: 28, height: 28, borderRadius: 9, backgroundColor: '#fbe1e2', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
});
