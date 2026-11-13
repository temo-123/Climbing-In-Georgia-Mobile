import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUserXmark, faTriangleExclamation, faRightFromBracket, faTrashCan, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import DeleteAccountModal from '../user/DeleteAccountModal';
import { useAuth, useAccount } from '../../utils/AuthContext';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// The only thing an under-age account sees of the account side (the web's
// AgeRestrictedPage.vue): icon, title, explanation, "wrong date of birth?"
// hint, Log out / Delete account / Contact us. `min_age` comes from the API.
// `onLeave` runs after log out / delete (navigate home); `onContact` opens
// the contact form.
export default function AgeRestrictionPanel({ onLeave, onContact }) {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const { minAge } = useAccount();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleLogout() {
    setBusy(true);
    try { await logout(); } finally { setBusy(false); }
    onLeave?.();
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <FontAwesomeIcon icon={faUserXmark} size={30} color={COLORS.warning} />
      </View>
      <Text style={styles.title}>{t('account.age_title', { age: minAge })}</Text>

      <View style={styles.alert}>
        <FontAwesomeIcon icon={faTriangleExclamation} size={15} color={COLORS.warning} style={styles.alertIcon} />
        <Text style={styles.alertText}>{t('account.age_text', { age: minAge })}</Text>
      </View>

      <Text style={styles.hint}>{t('account.age_wrong_birthday')}</Text>

      <View style={styles.buttons}>
        <Button variant="primary" icon={faRightFromBracket} title={t('site.global.age_restriction.logout')} onPress={handleLogout} loading={busy} />
        <Button variant="danger" icon={faTrashCan} title={t('site.global.age_restriction.delete_account')} onPress={() => setDeleteVisible(true)} />
        {!!onContact && <Button variant="outline" icon={faEnvelope} title={t('account.contact_us')} onPress={onContact} />}
      </View>

      <DeleteAccountModal
        visible={deleteVisible}
        onClose={() => setDeleteVisible(false)}
        onDeleted={() => { setDeleteVisible(false); onLeave?.(); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingHorizontal: 4 },
  icon: {
    width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fdeee4', marginBottom: 14,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 28, lineHeight: 31, color: COLORS.ink, textAlign: 'center', marginBottom: 14 },
  alert: {
    flexDirection: 'row', gap: 10, alignSelf: 'stretch',
    backgroundColor: '#fdf3ea', borderWidth: 1, borderColor: '#f3cfb4', borderRadius: RADII.md,
    padding: 14, marginBottom: 12,
  },
  alertIcon: { marginTop: 2 },
  alertText: { flex: 1, fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.ink2 },
  hint: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 19, color: COLORS.stone, textAlign: 'center', marginBottom: 18 },
  buttons: { alignSelf: 'stretch', gap: 10 },
});
