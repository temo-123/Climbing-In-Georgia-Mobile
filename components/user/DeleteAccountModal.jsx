import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../utils/AuthContext';
import FormModal from './FormModal';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Same URL as Play Console → Data safety → Data deletion.
const WEB_DELETE_URL = 'https://user.climbing.ge/delete-account';
const DANGER = '#e74c3c';

export default function DeleteAccountModal({ visible, onClose, onDeleted }) {
  const { t } = useTranslation();
  const { deleteAccount, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setPassword('');
      setConfirmText('');
      setError('');
    }
  }, [visible]);

  const confirmed = confirmText.trim() === 'DELETE';

  async function handleDelete() {
    if (!confirmed) return;
    setError('');
    setLoading(true);
    try {
      await deleteAccount(password);
      onDeleted();
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      if (status === 401) {
        // Token already invalid — treat as logged out.
        await logout();
        onDeleted();
      } else if (status === 422) {
        setError(data?.errors?.password?.[0] ?? data?.errors?.confirm?.[0] ?? data?.message ?? t('auth.generic_error'));
      } else if (status === 409 || status === 403) {
        setError(data?.message ?? t('auth.generic_error'));
      } else {
        setError(t('user.delete_account_retry'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} title={t('user.delete_account')} onClose={onClose}>
      <Text style={styles.warning}>{t('user.delete_account_warning')}</Text>

      <TextInput
        style={styles.input}
        placeholder={t('auth.password')}
        placeholderTextColor={COLORS.muted}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Text style={styles.hint}>{t('user.delete_account_password_hint')}</Text>

      <Text style={styles.label}>{t('user.delete_account_type_confirm')}</Text>
      <TextInput
        style={styles.input}
        placeholder="DELETE"
        placeholderTextColor={COLORS.muted}
        value={confirmText}
        onChangeText={setConfirmText}
        autoCapitalize="characters"
        autoCorrect={false}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={[styles.button, (!confirmed || loading) && styles.buttonDisabled]}
        onPress={handleDelete}
        disabled={!confirmed || loading}
        activeOpacity={0.8}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('user.delete_account_confirm_btn')}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => WebBrowser.openBrowserAsync(WEB_DELETE_URL)} activeOpacity={0.7}>
        <Text style={styles.webLink}>{t('user.delete_account_web')}</Text>
      </TouchableOpacity>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  warning: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.stone, lineHeight: 20, marginBottom: 14 },
  label: { fontSize: 13, color: COLORS.stone, fontFamily: FONTS.bodySemi, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: DANGER, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 6, fontSize: 15, fontFamily: FONTS.body, color: COLORS.ink,
  },
  hint: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.muted, marginBottom: 14 },
  button: {
    backgroundColor: DANGER, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 8,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodyBold },
  error: { color: DANGER, marginTop: 6, marginBottom: 4, fontSize: 13, fontFamily: FONTS.body },
  webLink: { color: COLORS.muted, textAlign: 'center', fontSize: 13, fontFamily: FONTS.body, marginTop: 14, textDecorationLine: 'underline' },
});
