import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';

const API = 'https://climbing.ge/api';

export default function UserOptionsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [error, setError] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name ?? '');
      setSurname(user.surname ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  async function handleUpdateProfile() {
    if (!name.trim() || !surname.trim() || !email.trim()) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`${API}/get_options/user_info_update/${user.id}`, {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim(),
      });
      Alert.alert(t('user.options_saved'));
    } catch (err) {
      const errs = err?.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join('\n') : t('auth.generic_error'));
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwdError(t('auth.fill_all_fields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError(t('auth.passwords_no_match'));
      return;
    }
    if (newPassword.length < 6) {
      setPwdError(t('auth.password_min'));
      return;
    }
    setPwdError('');
    setPwdLoading(true);
    try {
      await api.post(`${API}/user/update_password`, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert(t('user.password_changed'));
    } catch (err) {
      const errs = err?.response?.data?.errors;
      setPwdError(errs ? Object.values(errs).flat().join('\n') : err?.response?.data?.message ?? t('auth.generic_error'));
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionTitle}>{t('user.profile_info')}</Text>
        <TextInput style={styles.input} placeholder={t('auth.name')} placeholderTextColor="#aaa" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder={t('auth.surname')} placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={loading} activeOpacity={0.8}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('user.save_changes')}</Text>}
        </TouchableOpacity>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>{t('user.change_password')}</Text>
        <TextInput style={styles.input} placeholder={t('user.current_password')} placeholderTextColor="#aaa" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor="#aaa" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder={t('auth.confirm_password')} placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        {!!pwdError && <Text style={styles.error}>{pwdError}</Text>}
        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={pwdLoading} activeOpacity={0.8}>
          {pwdLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('user.change_password')}</Text>}
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#fff', flexGrow: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#279fbb', marginBottom: 14, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#279fbb', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15, color: '#222',
  },
  button: {
    backgroundColor: '#279fbb', borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginBottom: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  error: { color: '#e74c3c', marginBottom: 10, fontSize: 13 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 24 },
});
