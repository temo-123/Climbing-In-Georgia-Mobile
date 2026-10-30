import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AuthHead from '../../components/auth/AuthHead';
import { useAuth } from '../../utils/AuthContext';
import api, { API_BASE_URL } from '../../utils/api';
import { COLORS, FONTS } from '../../assets/styles/styles';

const API_BASE = API_BASE_URL;

// Reached right after a Google/Facebook sign-up (SocialController::callback
// created the User row already, with a random unusable password) — this
// screen just gives that new account a real password and logs it in.
export default function SocialCreatePasswordScreen({ navigation, route }) {
  const { t } = useTranslation();
  const { loginWithToken } = useAuth();
  const email = route.params?.email;
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!password || !passwordConfirm) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('auth.passwords_no_match'));
      return;
    }
    if (password.length < 8) {
      setError(t('auth.password_min_8'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`${API_BASE}/login/social/create_password/${encodeURIComponent(email)}`, {
        data: { password, password_confirmation: passwordConfirm },
      });
      await loginWithToken(res.data.token);
      navigation.popToTop();
    } catch (err) {
      setError(err?.response?.data?.message || t('auth.generic_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHead title={t('auth.create_password_title')} />
        <Text style={styles.subtitle}>{t('auth.create_password_sub', { email })}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor={COLORS.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.confirm_password')}
          placeholderTextColor={COLORS.muted}
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t('auth.create_password_title')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 28,
    justifyContent: 'center',
    backgroundColor: COLORS.chalk,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.displayBold,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, fontFamily: FONTS.body,
    color: COLORS.stone,
    marginBottom: 28,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12, backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16, fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14, fontFamily: FONTS.body,
  },
});
