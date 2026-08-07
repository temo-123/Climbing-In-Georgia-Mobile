import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { COLORS } from '../../assets/styles/styles';

export default function ForgotPasswordScreen({ navigation }) {
  const { t } = useTranslation();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      if (err?.response?.data?.errors) {
        const errs = Object.values(err.response.data.errors).flat();
        setError(errs.join('\n'));
      } else {
        setError(err?.response?.data?.message || t('auth.generic_error'));
      }
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.successTitle}>{t('auth.reset_email_sent')}</Text>
        <Text style={styles.successSub}>{email}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('login')} activeOpacity={0.8}>
          <Text style={styles.buttonText}>{t('auth.back_to_login')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('auth.forgot_password_title')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgot_password_sub')}</Text>

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

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t('auth.send_reset_link')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('login')} activeOpacity={0.7}>
          <Text style={styles.link}>{t('auth.back_to_login')}</Text>
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
  centeredContainer: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
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
  successIcon: {
    fontSize: 60,
    color: COLORS.primary,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  successSub: {
    fontSize: 14,
    color: COLORS.primary,
    marginBottom: 32,
  },
});
