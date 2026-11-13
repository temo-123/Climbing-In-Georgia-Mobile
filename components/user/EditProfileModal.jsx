import React, { useState, useEffect, useRef } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import api, { API_BASE_URL } from '../../utils/api';
import { fieldErrors, apiErrorMessage } from '../../utils/apiError';
import { BIRTHDAY_MIN, BIRTHDAY_INITIAL_VIEW, birthdayMax } from '../../utils/birthday';
import { startResendCooldown } from '../../utils/accountGate';
import DateField from '../ui/DateField';
import { COLORS, FONTS } from '../../assets/styles/styles';
import FormModal from './FormModal';

const API = API_BASE_URL;

// Profile edit (POST get_options/user_info_update/{id}). `focusField`
// ('name' | 'location' | 'email' | 'birthday') opens the form on that field —
// used by the account alerts and the "add your date of birth" call-out.
export default function EditProfileModal({ visible, onClose, focusField }) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errs, setErrs] = useState({});
  const nameRef = useRef(null);
  const countryRef = useRef(null);
  const emailRef = useRef(null);
  const birthdayRef = useRef(null);

  useEffect(() => {
    if (visible && user) {
      setName(user.name ?? '');
      setSurname(user.surname ?? '');
      setEmail(user.email ?? '');
      setBirthday(user.birthday ? String(user.birthday).slice(0, 10) : '');
      setCountry(user.country ?? '');
      setCity(user.city ?? '');
      setPhoneNumber(user.phone_number ?? '');
      setBio(user.my_bio ?? '');
      setError('');
      setErrs({});
    }
    // Only when the form opens — not on every refresh of `user`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!visible || !focusField) return undefined;
    const target = { name: nameRef, location: countryRef, email: emailRef, birthday: birthdayRef }[focusField];
    const id = setTimeout(() => {
      if (focusField === 'birthday') target?.current?.open?.();
      else target?.current?.focus?.();
    }, 350);
    return () => clearTimeout(id);
  }, [visible, focusField]);

  async function handleSave() {
    if (!name.trim() || !surname.trim() || !email.trim()) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    setError('');
    setErrs({});
    setLoading(true);
    try {
      // Backend reads every field from a nested "data" object and writes
      // missing keys as null — so country / city / phone always go along.
      // An empty birthday keeps the stored one.
      const { data } = await api.post(`${API}/get_options/user_info_update/${user.id}`, {
        user_id: user.id,
        data: {
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim(),
          country: country.trim(),
          city: city.trim(),
          phone_number: phoneNumber.trim(),
          birthday: birthday || '',
          my_bio: bio.trim(),
          lang: user.lang,
          // Older backends cleared this when missing; harmless now.
          social_links: user.social_links ?? {},
        },
      });
      await refreshUser().catch(() => {});
      onClose();
      // A new address is unverified again — the panel switches to the verify
      // state by itself (auth_user.email_verified_at is null now).
      if (data?.email_changed) {
        if (data.verification_sent === false) {
          Alert.alert(t('account.email_changed_title'), t('account.email_changed_not_sent'));
        } else {
          startResendCooldown();
          Alert.alert(t('account.email_changed_title'), t('account.email_changed_sent', { email: email.trim() }));
        }
      }
    } catch (err) {
      const fe = fieldErrors(err);
      setErrs(fe);
      const { email: _e, birthday: _b, ...rest } = fe;
      const restText = Object.values(rest).join('\n');
      setError(restText || (fe.email || fe.birthday ? '' : (apiErrorMessage(err, t) || '')));
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormModal visible={visible} title={t('user.profile_info')} onClose={onClose}>
      <TextInput ref={nameRef} style={styles.input} placeholder={t('auth.name')} placeholderTextColor={COLORS.muted} value={name} onChangeText={setName} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.surname')} placeholderTextColor={COLORS.muted} value={surname} onChangeText={setSurname} autoCapitalize="words" />
      <TextInput
        ref={emailRef}
        style={[styles.input, !!errs.email && styles.inputError]}
        placeholder={t('auth.email')}
        placeholderTextColor={COLORS.muted}
        value={email}
        onChangeText={(v) => { setEmail(v); setErrs((e) => ({ ...e, email: undefined })); }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      {!!errs.email && <Text style={styles.fieldError}>{errs.email}</Text>}
      {email.trim().toLowerCase() !== String(user?.email ?? '').toLowerCase() && !!email.trim() && (
        <Text style={styles.hint}>{t('account.email_change_hint')}</Text>
      )}

      <Text style={styles.label}>{t('account.birthday')}</Text>
      <DateField
        ref={birthdayRef}
        value={birthday}
        onChange={(v) => { setBirthday(v); setErrs((e) => ({ ...e, birthday: undefined })); }}
        min={BIRTHDAY_MIN}
        max={birthdayMax()}
        initialView={BIRTHDAY_INITIAL_VIEW}
        placeholder={t('account.birthday_placeholder')}
        error={!!errs.birthday}
      />
      {errs.birthday
        ? <Text style={[styles.fieldError, styles.afterDate]}>{errs.birthday}</Text>
        : <Text style={[styles.hint, styles.afterDate]}>{t('account.birthday_hint')}</Text>}

      <TextInput ref={countryRef} style={styles.input} placeholder={t('auth.country')} placeholderTextColor={COLORS.muted} value={country} onChangeText={setCountry} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.city')} placeholderTextColor={COLORS.muted} value={city} onChangeText={setCity} autoCapitalize="words" />
      <TextInput style={styles.input} placeholder={t('auth.phone_number')} placeholderTextColor={COLORS.muted} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
      <TextInput
        style={[styles.input, styles.bioInput]}
        placeholder={t('user.profile_bio')}
        placeholderTextColor={COLORS.muted}
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
    borderWidth: 1, borderColor: COLORS.line, borderRadius: 12, backgroundColor: COLORS.surface,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12, fontSize: 15, fontFamily: FONTS.body, color: COLORS.ink,
  },
  inputError: { borderColor: COLORS.danger },
  label: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2, marginBottom: 6 },
  hint: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: -4, marginBottom: 12 },
  fieldError: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.danger, marginTop: -4, marginBottom: 12 },
  afterDate: { marginTop: 6 },
  bioInput: { minHeight: 90, textAlignVertical: 'top' },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodyBold },
  error: { color: COLORS.danger, marginBottom: 10, fontSize: 13, fontFamily: FONTS.body },
});
