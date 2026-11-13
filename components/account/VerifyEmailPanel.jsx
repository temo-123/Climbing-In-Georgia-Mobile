import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelopeOpenText, faCircleCheck, faPen, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import ResendVerifyButton from './ResendVerifyButton';
import { useAuth } from '../../utils/AuthContext';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// "Verify your e-mail" (the web's VerifyRequiredPage.vue): shown in place of
// the user panel while auth_user.email_verified_at is null. `onChangeEmail`
// opens Options, `onLeave` runs after log out.
export default function VerifyEmailPanel({ onChangeEmail, onLeave, onVerified }) {
  const { t } = useTranslation();
  const { user, refreshUser, logout } = useAuth();
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);

  async function checkAgain() {
    setChecking(true);
    setNotYet(false);
    try {
      const fresh = await refreshUser();
      if (fresh?.email_verified_at) onVerified?.();
      else setNotYet(true);
    } catch {
      setNotYet(true);
    } finally {
      setChecking(false);
    }
  }

  async function handleLogout() {
    await logout();
    onLeave?.();
  }

  const steps = [t('account.verify_step_open'), t('account.verify_step_click'), t('account.verify_step_spam')];

  return (
    <View style={styles.wrap}>
      <View style={styles.icon}>
        <FontAwesomeIcon icon={faEnvelopeOpenText} size={30} color={COLORS.primaryDark} />
      </View>
      <Text style={styles.title}>{t('account.verify_title')}</Text>
      <Text style={styles.lead}>{t('account.verify_lead')}</Text>
      <Text style={styles.email} selectable>{user?.email}</Text>

      <View style={styles.steps}>
        {steps.map((s, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{i + 1}</Text></View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
      </View>

      <View style={styles.buttons}>
        <ResendVerifyButton onAlready={checkAgain} />
        <Button variant="hold" icon={faCircleCheck} title={t('account.verify_continue')} onPress={checkAgain} loading={checking} />
        {notYet && <Text style={styles.notYet}>{t('account.verify_not_yet')}</Text>}
      </View>

      <View style={styles.secondary}>
        {!!onChangeEmail && (
          <Button small block={false} variant="ghost" icon={faPen} title={t('site.global.email_verify.change_email')} onPress={onChangeEmail} />
        )}
        <Button small block={false} variant="ghost" icon={faRightFromBracket} title={t('auth.logout')} onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  icon: {
    width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.primarySoft, marginBottom: 14,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 28, lineHeight: 31, color: COLORS.ink, textAlign: 'center', marginBottom: 6 },
  lead: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.stone, textAlign: 'center' },
  email: { fontFamily: FONTS.bodyHeavy, fontSize: 15, color: COLORS.ink, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  steps: {
    alignSelf: 'stretch', gap: 10, padding: 14, marginBottom: 16,
    backgroundColor: COLORS.surface, borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.line,
  },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: '#fff' },
  stepText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink2 },
  buttons: { alignSelf: 'stretch', gap: 10 },
  notYet: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.danger, textAlign: 'center' },
  secondary: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
});
