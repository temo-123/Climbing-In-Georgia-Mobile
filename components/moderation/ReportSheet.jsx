import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, Linking, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faFlag } from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { isGateHandled } from '../../utils/accountGate';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import Field from '../ui/Field';
import { useToast } from '../ui/Toast';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Report any user-generated content (App Store guideline 1.2 / Google Play
// UGC policy). Sends POST /content_report { type, id, reason, details }
// (see docs/APP_STORE.md, backend prompt). Article comments keep their own
// complaint endpoint (ArticleComments.jsx).
//
// Guests report by e-mail (a pre-filled message to the moderators) — the API
// form is for signed-in climbers. The same e-mail fallback is used while the
// backend has no /content_report (it answers 404 / 405 or the SPA HTML).
export const REPORT_EMAIL = 'info@climbing.ge';
export const REPORT_REASONS = ['hostile', 'off_topic', 'spam', 'sexual_content', 'anger', 'conflict', 'language'];

const looksLikeHtml = (data) => typeof data === 'string' && /<html|<!doctype/i.test(data);

export default function ReportSheet({ visible, onClose, type, id, label }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) { setReason(''); setDetails(''); setError(''); setSending(false); }
  }, [visible]);

  async function sendByEmail() {
    const subject = `[Report] ${type} #${id}`;
    const body = `${t('report.email_intro')}\n\n${type}: ${label ?? ''} (#${id})\n\n${t('report.email_reason')} ${reason ? t(`site.shop.product.feedback.reasons.${reason}`) : ''}\n${details}\n`;
    const url = `mailto:${REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('report.title'), t('report.no_email_app', { email: REPORT_EMAIL }));
    }
  }

  async function send() {
    if (!reason) { setError(t('site.guide.comments.report_pick')); return; }
    if (!user) { onClose(); sendByEmail(); return; }
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`${API_BASE_URL}/content_report`, {
        type,
        id,
        reason,
        details: details.trim() || null,
        email: user.email ?? null,
      });
      if (looksLikeHtml(data)) throw Object.assign(new Error('unsupported'), { unsupported: true });
      onClose();
      toast.show({ message: t('report.sent') });
    } catch (err) {
      if (isGateHandled(err)) { onClose(); return; }
      const status = err?.response?.status;
      if (err?.unsupported || status === 404 || status === 405 || looksLikeHtml(err?.response?.data)) {
        onClose();
        sendByEmail();
        return;
      }
      if (status === 429) setError(t('report.too_many'));
      else setError(t('site.guide.comments.send_error'));
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow={t('report.title')}
      title={label || t('report.title')}
      footer={<Button icon={faFlag} title={t('site.guide.comments.report_send')} onPress={send} loading={sending} />}
    >
      <Text style={styles.text}>{t('report.intro')}</Text>
      {REPORT_REASONS.map((key) => {
        const on = reason === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.reason, on && styles.reasonOn]}
            onPress={() => { setReason(key); setError(''); }}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
          >
            <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
            <Text style={styles.reasonText}>{t(`site.shop.product.feedback.reasons.${key}`)}</Text>
          </TouchableOpacity>
        );
      })}
      <Field
        label={t('report.details')}
        value={details}
        onChangeText={setDetails}
        multiline
        maxLength={500}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Text style={styles.note}>{t('report.response_time')}</Text>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  text: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: COLORS.stone, marginBottom: 12 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8,
    borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface,
  },
  reasonOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  reasonText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
  error: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.danger, marginBottom: 8 },
  note: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: COLORS.muted, marginTop: 4, marginBottom: 8 },
});
