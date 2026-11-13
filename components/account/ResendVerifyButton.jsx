import React, { useEffect, useState } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import { resendVerificationEmail, resendCooldownLeft, onResendCooldown } from '../../utils/accountGate';
import { COLORS, FONTS } from '../../assets/styles/styles';

// "Send new verification e-mail" (GET /email/resend) with the shared 60 s
// cooldown. `onAlready` runs when the server says the address is verified
// already (callers re-read auth_user then).
export default function ResendVerifyButton({ variant = 'primary', small, onAlready, style }) {
  const { t } = useTranslation();
  const [left, setLeft] = useState(resendCooldownLeft());
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState(null); // { text, tone }

  useEffect(() => {
    const tick = () => setLeft(resendCooldownLeft());
    const off = onResendCooldown(tick);
    const id = setInterval(tick, 1000);
    return () => { off(); clearInterval(id); };
  }, []);

  async function send() {
    setSending(true);
    setNote(null);
    const result = await resendVerificationEmail();
    setSending(false);
    setLeft(resendCooldownLeft());
    if (result === 'sent') setNote({ text: t('site.global.email_verify.sent'), tone: 'ok' });
    else if (result === 'already') {
      setNote({ text: t('site.global.email_verify.already'), tone: 'ok' });
      onAlready?.();
    } else setNote({ text: t('site.global.email_verify.send_error'), tone: 'error' });
  }

  const title = sending
    ? t('site.global.email_verify.sending')
    : left > 0
      ? t('site.global.email_verify.sent_wait', { s: left })
      : t('site.global.email_verify.resend_btn');

  return (
    <View style={style}>
      <Button
        variant={variant}
        small={small}
        icon={faEnvelope}
        title={title}
        onPress={send}
        loading={sending}
        disabled={left > 0}
      />
      {!!note && <Text style={[styles.note, note.tone === 'error' && styles.error]}>{note.text}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  note: { fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 17, color: COLORS.success, marginTop: 8, textAlign: 'center' },
  error: { color: COLORS.danger },
});
