import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import AuthHead from '../../components/auth/AuthHead';
import { useAuth } from '../../utils/AuthContext';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';
import { COLORS, FONTS } from '../../assets/styles/styles';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.goBack();
    } catch (err) {
      if (!err.isAxiosError) {
        // Not an HTTP error — reCAPTCHA token generation itself failed
        // (WebView not ready, timed out, etc.), not a server rejection.
        setError(t('auth.generic_error'));
        return;
      }
      const msg = err?.response?.data?.message;
      if (msg === 'auth.failed') {
        setError(t('auth.login_error'));
      } else if (err?.response?.data?.errors) {
        const errs = Object.values(err.response.data.errors).flat();
        setError(errs.join('\n'));
      } else {
        setError(t('auth.generic_error'));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHead title={t('auth.login')} />

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor={COLORS.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <View style={styles.passwordRow}>
          <TextInput
            style={styles.passwordInput}
            placeholder={t('auth.password')}
            placeholderTextColor={COLORS.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword(v => !v)}
            activeOpacity={0.7}
          >
            <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} size={17} color={COLORS.stone} />
          </TouchableOpacity>
        </View>

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t('auth.login')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('forgot_password')} activeOpacity={0.7}>
          <Text style={styles.link}>{t('auth.forgot_password')}</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.outlineButton}
          onPress={() => navigation.navigate('register')}
          activeOpacity={0.8}
        >
          <Text style={styles.outlineButtonText}>{t('auth.no_account')}</Text>
        </TouchableOpacity>

        <SocialLoginButtons
          onLoggedIn={() => navigation.goBack()}
          onNeedsPassword={(email) => navigation.navigate('social_create_password', { email })}
        />
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
    fontSize: 32,
    fontFamily: FONTS.displayBold,
    color: COLORS.primary,
    marginBottom: 32,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16, fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  eyeIcon: {
    fontSize: 18, fontFamily: FONTS.body,
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
  outlineButton: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  outlineButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontFamily: FONTS.bodySemi,
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 14, fontFamily: FONTS.body,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.line,
    marginVertical: 20,
  },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14, fontFamily: FONTS.body,
  },
});
