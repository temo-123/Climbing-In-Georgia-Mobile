import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { COLORS } from '../../assets/styles/styles';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRegister() {
    if (!name.trim() || !surname.trim() || !email.trim() || !password || !passwordConfirm) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    if (password !== passwordConfirm) {
      setError(t('auth.passwords_no_match'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.password_min'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(name.trim(), surname.trim(), email.trim(), password, passwordConfirm);
      navigation.goBack();
    } catch (err) {
      if (!err.isAxiosError) {
        // Not an HTTP error — reCAPTCHA token generation itself failed
        // (WebView not ready, timed out, etc.), not a server rejection.
        setError(`${t('auth.generic_error')}\n\n[TEMP DEBUG] recaptcha failed: ${err?.message}`);
        return;
      }
      if (err?.response?.data?.errors) {
        const errs = Object.values(err.response.data.errors).flat();
        setError(errs.join('\n'));
      } else {
        setError(
          `${err?.response?.data?.message || t('auth.generic_error')}\n\n[TEMP DEBUG] status: ${err?.response?.status}\n${JSON.stringify(err?.response?.data)}`,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('auth.register')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.name')}
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.surname')}
          placeholderTextColor="#aaa"
          value={surname}
          onChangeText={setSurname}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.email')}
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.password')}
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.confirm_password')}
          placeholderTextColor="#aaa"
          value={passwordConfirm}
          onChangeText={setPasswordConfirm}
          secureTextEntry
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t('auth.register')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('login')} activeOpacity={0.7}>
          <Text style={styles.link}>{t('auth.have_account')}</Text>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    color: '#222',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 14,
    marginTop: 4,
  },
  error: {
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
});
