import React, { useState, useCallback, useEffect } from 'react';
import api, { corsUrl, API_BASE_URL } from '../utils/api';
import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Linking, useWindowDimensions,
} from 'react-native';
import HtmlContent from '../components/HtmlContent';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';
import { withRecaptchaRetry } from '../utils/recaptcha';
import { COLORS, FONTS, RADII, SHADOWS } from '../assets/styles/styles';
import Preloader from '../components/Preloader';
import PageHead from '../components/ui/PageHead';
import PageFooter from '../components/PageFooter';
import RouteAuthorsModal from '../components/RouteAuthorsModal';
import LegalLinks from '../components/LegalLinks';

// Static contact details — same as the "Seller Contacts" block on
// climbing.ge/about_us, which is hardcoded in the site's own template
// rather than served from the CMS API (verified: not present in any
// get_site_data response).
const SELLER_EMAIL = 'info@climbing.ge';
const SELLER_PHONE = '(+995) 598 45 70 48';
const SELLER_PHONE_TEL = '+995598457048';

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const [aboutUsData, setAboutUsData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [socialLinks, setSocialLinks] = useState([]);
  const [authorsVisible, setAuthorsVisible] = useState(false);

  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setHasError(false);
    api
      .get(corsUrl(`${API_BASE_URL}/get_site_data/get_site_locale_data/${locale}`))
      .then(({ data }) => {
        setAboutUsData(data);
        setLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setLoading(false);
      });
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    api.get(corsUrl(`${API_BASE_URL}/get_site_social_links/get_site_social_links`))
      .then(({ data }) => setSocialLinks(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  if (isLoading) return <Preloader />;

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('error.request_failed')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>{t('error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const description = aboutUsData.find(item => item.slug === 'guid_description')?.us_data;

  async function handleSendMessage() {
    // The backend requires num (phone) and country even though the web
    // form doesn't mark them with a "*" — confirmed by probing the
    // endpoint directly: omitting either returns a 422 "field is
    // required" error. Validate them here too, or every submission with
    // those left blank fails with a confusing, unrelated-looking error.
    if (!name.trim() || !surname.trim() || !email.trim() || !phone.trim() || !country.trim() || !message.trim()) {
      Alert.alert(t('auth.fill_all_fields'));
      return;
    }
    setSending(true);
    try {
      // Field names must match the backend's /api/message route exactly —
      // verified against climbing.ge's own "Message" form (name, surname,
      // email, num, country, msg, recaptcha_token).
      await withRecaptchaRetry('send_message', (recaptcha_token) => api.post(
        corsUrl(`${API_BASE_URL}/message`),
        {
          name: name.trim(),
          surname: surname.trim(),
          email: email.trim(),
          num: phone.trim(),
          country: country.trim(),
          msg: message.trim(),
          recaptcha_token,
        },
      ));
      Alert.alert(t('about.message_sent_title'), t('about.message_sent_body'));
      setName('');
      setSurname('');
      setEmail('');
      setPhone('');
      setCountry('');
      setMessage('');
    } catch (err) {
      const fieldErrors = err?.response?.data?.errors;
      const msg = fieldErrors
        ? Object.values(fieldErrors).flat().join('\n')
        : err?.response?.data?.message ?? t('about.message_send_error');
      Alert.alert(t('about.message_send_error'), msg);
    } finally {
      setSending(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <PageHead art="rope" title={t('article.about_us')} />
      {!!description && (
        <View style={styles.section}>
          <HtmlContent html={description} contentWidth={width - 64} />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.seller_contacts')}</Text>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`mailto:${SELLER_EMAIL}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.contactLabel}>{t('about.email_label')}</Text>
          <Text style={styles.contactValue}>{SELLER_EMAIL}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.contactRow}
          onPress={() => Linking.openURL(`tel:${SELLER_PHONE_TEL}`)}
          activeOpacity={0.7}
        >
          <Text style={styles.contactLabel}>{t('about.phone_label')}</Text>
          <Text style={styles.contactValue}>{SELLER_PHONE}</Text>
        </TouchableOpacity>
      </View>

      {socialLinks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('about.other_resources')}</Text>
          {socialLinks.map(link => (
            <TouchableOpacity
              key={link.id}
              style={styles.linkRow}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText} numberOfLines={2}>{link.title}</Text>
              <Text style={styles.linkArrow}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('legal.section_title')}</Text>
        <LegalLinks />
      </View>

      <TouchableOpacity style={styles.authorsBtn} onPress={() => setAuthorsVisible(true)} activeOpacity={0.85}>
        <Text style={styles.authorsBtnText}>{t('about.check_route_authors')}</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('about.message_title')}</Text>
        <Text style={styles.messageSubtitle}>{t('about.message_subtitle')}</Text>
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.name')} *`}
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.surname')} *`}
          placeholderTextColor={COLORS.muted}
          value={surname}
          onChangeText={setSurname}
          autoCapitalize="words"
        />
        <TextInput
          style={styles.input}
          placeholder={`${t('auth.email')} *`}
          placeholderTextColor={COLORS.muted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder={`${t('about.phone_number')} *`}
          placeholderTextColor={COLORS.muted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder={`${t('about.your_country')} *`}
          placeholderTextColor={COLORS.muted}
          value={country}
          onChangeText={setCountry}
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={`${t('about.your_message')} *`}
          placeholderTextColor={COLORS.muted}
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending} activeOpacity={0.85}>
          {sending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.sendBtnText}>{t('about.send_message')}</Text>}
        </TouchableOpacity>
      </View>

      <RouteAuthorsModal visible={authorsVisible} onClose={() => setAuthorsVisible(false)} />

      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15, fontFamily: FONTS.body,
    color: COLORS.stone,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONTS.bodyBold,
  },
  section: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    ...SHADOWS.sm,
  },
  sectionTitle: { fontSize: 23, fontFamily: FONTS.displayBold, color: COLORS.ink, marginBottom: 10 },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  contactLabel: { fontSize: 13, color: COLORS.muted, fontFamily: FONTS.bodySemi },
  contactValue: { fontSize: 13, color: COLORS.primary, fontFamily: FONTS.bodyBold },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    gap: 8,
  },
  linkText: { flex: 1, fontSize: 13, color: COLORS.ink, fontFamily: FONTS.bodySemi },
  linkArrow: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.primary },
  authorsBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 16,
  },
  authorsBtnText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodyHeavy },
  messageSubtitle: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone, marginBottom: 14, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12, backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15, fontFamily: FONTS.body,
    color: COLORS.ink,
  },
  textArea: { height: 110, paddingTop: 12 },
  sendBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontFamily: FONTS.bodyHeavy },
});
