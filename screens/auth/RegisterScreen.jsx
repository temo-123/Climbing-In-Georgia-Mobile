import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import AuthHead from '../../components/auth/AuthHead';
import { useAuth } from '../../utils/AuthContext';
import SocialLoginButtons from '../../components/auth/SocialLoginButtons';
import { useLocale } from '../../utils/LocaleContext';
import { openPrivacyPolicy, openTermsOfUse } from '../../utils/legalLinks';
import DateField from '../../components/ui/DateField';
import { fieldErrors, apiErrorMessage } from '../../utils/apiError';
import { BIRTHDAY_MIN, BIRTHDAY_INITIAL_VIEW, birthdayMax, apiLang } from '../../utils/birthday';
import { COLORS, FONTS } from '../../assets/styles/styles';

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [birthday, setBirthday] = useState('');
  const [fieldErrs, setFieldErrs] = useState({});
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { locale } = useLocale();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const acceptedAll = acceptedTerms && acceptedPrivacy;

  async function handleRegister() {
    setFieldErrs({});
    if (!name.trim() || !surname.trim() || !email.trim() || !password || !passwordConfirm) {
      setError(t('auth.fill_all_fields'));
      return;
    }
    if (!birthday) {
      setFieldErrs({ birthday: t('account.birthday_required') });
      setError('');
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
    if (!acceptedAll) {
      setError(t('legal.must_accept'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register({
        name: name.trim(),
        surname: surname.trim(),
        birthday,
        email: email.trim(),
        country: country.trim(),
        city: city.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
        passwordConfirmation: passwordConfirm,
        lang: apiLang(locale),
      });
      navigation.goBack();
    } catch (err) {
      // Field errors go under their field (birthday) — the rest on top.
      const fe = fieldErrors(err);
      setFieldErrs(fe);
      const { birthday: _b, ...rest } = fe;
      const restText = Object.values(rest).join('\n');
      setError(restText || (fe.birthday ? '' : apiErrorMessage(err, t)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <AuthHead title={t('auth.register')} />

        <TextInput
          style={styles.input}
          placeholder={t('auth.name')}
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder={t('auth.surname')}
          placeholderTextColor={COLORS.muted}
          value={surname}
          onChangeText={setSurname}
          autoCapitalize="words"
        />

        <Text style={styles.label}>{t('account.birthday')}</Text>
        <DateField
          value={birthday}
          onChange={(v) => { setBirthday(v); setFieldErrs((e) => ({ ...e, birthday: undefined })); }}
          min={BIRTHDAY_MIN}
          max={birthdayMax()}
          initialView={BIRTHDAY_INITIAL_VIEW}
          placeholder={t('account.birthday_placeholder')}
          error={!!fieldErrs.birthday}
        />
        {fieldErrs.birthday
          ? <Text style={styles.fieldError}>{fieldErrs.birthday}</Text>
          : <Text style={styles.fieldHint}>{t('account.birthday_hint')}</Text>}

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

        <TextInput
          style={styles.input}
          placeholder={`${t('auth.country')} (${t('account.optional')})`}
          placeholderTextColor={COLORS.muted}
          value={country}
          onChangeText={setCountry}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder={`${t('auth.city')} (${t('account.optional')})`}
          placeholderTextColor={COLORS.muted}
          value={city}
          onChangeText={setCity}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder={`${t('auth.phone_number')} (${t('account.optional')})`}
          placeholderTextColor={COLORS.muted}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

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

        <AgreeCheckbox
          checked={acceptedTerms}
          onToggle={() => setAcceptedTerms(v => !v)}
          prefix={t('legal.agree_prefix')}
          linkText={t('legal.terms_of_use')}
          onOpenLink={() => openTermsOfUse(locale)}
        />
        <AgreeCheckbox
          checked={acceptedPrivacy}
          onToggle={() => setAcceptedPrivacy(v => !v)}
          prefix={t('legal.agree_prefix')}
          linkText={t('legal.privacy_policy')}
          onOpenLink={() => openPrivacyPolicy(locale)}
        />

        {!!error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, !acceptedAll && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading || !acceptedAll}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>{t('auth.register')}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('login')} activeOpacity={0.7}>
          <Text style={styles.link}>{t('auth.have_account')}</Text>
        </TouchableOpacity>

        {/* Social signup creates an account too, so it needs the same consent. */}
        <View pointerEvents={acceptedAll ? 'auto' : 'none'} style={!acceptedAll && styles.disabled}>
          <SocialLoginButtons
            birthday={birthday || undefined}
            onLoggedIn={() => navigation.goBack()}
            onNeedsPassword={(email, setupKey) => navigation.navigate('social_create_password', { email, setupKey })}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function AgreeCheckbox({ checked, onToggle, prefix, linkText, onOpenLink }) {
  return (
    <View style={styles.checkRow}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
      <Text style={styles.checkLabel} onPress={onToggle}>
        {prefix}
        <Text style={styles.checkLink} onPress={onOpenLink}>{linkText}</Text>
      </Text>
    </View>
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
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  disabled: {
    opacity: 0.5,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  checkLabel: {
    flex: 1,
    fontSize: 14, fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  checkLink: {
    color: COLORS.primary,
    fontFamily: FONTS.bodyBold,
    textDecorationLine: 'underline',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: FONTS.bodyBold,
  },
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: 14, fontFamily: FONTS.body,
    marginTop: 4,
  },
  label: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2, marginBottom: 6 },
  fieldError: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.danger, marginTop: 6, marginBottom: 14 },
  fieldHint: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: 6, marginBottom: 14 },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14, fontFamily: FONTS.body,
  },
});
