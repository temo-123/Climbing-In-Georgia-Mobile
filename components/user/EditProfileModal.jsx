import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import api, { API_BASE_URL } from '../../utils/api';
import { COLORS } from '../../assets/styles/styles';
import FormModal from './FormModal';

const API = API_BASE_URL;

export default function EditProfileModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible && user) {
      setName(user.name ?? '');
      setSurname(user.surname ?? '');
      setEmail(user.email ?? '');
      setCountry(user.country ?? '');
      setCity(user.city ?? '');
      setPhoneNumber(user.phone_number ?? '');
      setBio(user.my_bio ?? '');
      setError('');
    }
  }, [visible, user]);

  async function handleSave() {
    if (!name.trim() || !surname.trim() || !email.trim()) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Backend reads every field from a nested "data" object
      // ($request->data['name'] etc.) — posting the fields flat silently
      // saves them all as null instead of erroring.
      await api.post(`${API}/get_options/user_info_update/${user.id}`, {
        data: {
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim(),
          country: country.trim(),
          city: city.trim(),
          phone_number: phoneNumber.trim(),
          my_bio: bio.trim(),
          // Not editable from this form anymore (see UserLinksManager for the
          // unlimited-links replacement) — but the backend clears this field
          // to null whenever it's missing from the request, so the existing
          // value must still be sent through unedited to avoid wiping it.
          social_links: user.social_links ?? {},
        },
      });
      await refreshUser();
      onClose();
    } catch (err) {
      const errs = err?.response?.data?.errors;
      setError(errs ? Object.values(errs).flat().join('\n') : t('auth.generic_error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} title={t('user.profile_info')} onClose={onClose}>
      <TextInput style={styles.input} placeholder={t('auth.name')} placeholderTextColor="#aaa" value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.surname')} placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder={t('auth.country')} placeholderTextColor="#aaa" value={country} onChangeText={setCountry} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.city')} placeholderTextColor="#aaa" value={city} onChangeText={setCity} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.phone_number')} placeholderTextColor="#aaa" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder={t('user.profile_bio')}
        placeholderTextColor="#aaa"
        value={bio}
        onChangeText={setBio}
        multiline
        numberOfLines={4}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}
      <TouchableOpacity style={styles.button} onPress={handleSave} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('user.save_changes')}</Text>}
      </TouchableOpacity>
    </FormModal>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15, color: '#222',
  },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  error: { color: '#e74c3c', marginBottom: 10, fontSize: 13 },
});
