import React, { useState, useEffect } from 'react';
import { TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../../utils/api';
import { COLORS } from '../../assets/styles/styles';
import FormModal from './FormModal';

const API = API_BASE_URL;

export default function ChangePasswordModal({ visible, onClose }) {
  const { t } = useTranslation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [visible]);

  async function handleSave() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('auth.passwords_no_match'));
      return;
    }
    if (newPassword.length < 6) {
      setError(t('auth.password_min'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post(`${API}/user/update_password`, {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      Alert.alert(t('user.password_changed'));
      onClose();
    } catch (err) {
      const errs = err?.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join('\n') : err?.response?.data?.message ?? t('auth.generic_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} title={t('user.change_password')} onClose={onClose}>
      <TextInput style={styles.input} placeholder={t('user.current_password')} placeholderTextColor="#aaa" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder={t('auth.password')} placeholderTextColor="#aaa" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
      <TextInput style={styles.input} placeholder={t('auth.confirm_password')} placeholderTextColor="#aaa" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('user.change_password')}</Text>}
      </TouchableOpacity>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15, color: '#222',
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  error: { color: '#e74c3c', marginBottom: 10, fontSize: 13 },
});
