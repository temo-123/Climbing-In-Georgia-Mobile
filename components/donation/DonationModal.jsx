import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Linking, useWindowDimensions,
} from 'react-native';
import RenderHtml from 'react-native-render-html';
import * as Clipboard from 'expo-clipboard';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../utils/LocaleContext';
import { useAuth } from '../../utils/AuthContext';
import { getDonationSiteData } from '../../utils/donationSiteData';
import api from '../../utils/api';

const API_BASE = 'https://climbing.ge/api';
const PREDEFINED_AMOUNTS = [5, 10, 20, 50, 100, 200];
const EMPTY_DONATOR = { name: '', surname: '', email: '', phone_number: '', country: '', age: '' };

// Used only if the live GET /api/get_donation/tbc_info call fails. Only kicks in
// once a real IBAN is configured (see .env.example) — no point showing a
// fallback with a blank account number.
const FALLBACK_BANK_INFO = process.env.EXPO_PUBLIC_DONATION_IBAN
  ? {
      allowed: true,
      bank_name: process.env.EXPO_PUBLIC_DONATION_BANK_NAME || 'TBC Bank',
      bank_code: process.env.EXPO_PUBLIC_DONATION_BANK_CODE || '',
      account_name: process.env.EXPO_PUBLIC_DONATION_ACCOUNT_NAME || '',
      iban: process.env.EXPO_PUBLIC_DONATION_IBAN,
    }
  : null;

export default function DonationModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState('card');
  const [description, setDescription] = useState('');
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [donator, setDonator] = useState(EMPTY_DONATOR);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [bankLoading, setBankLoading] = useState(false);
  const [bankInfo, setBankInfo] = useState(null);
  const [bankError, setBankError] = useState('');
  const [ibanCopied, setIbanCopied] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setActiveTab('card');
    setSelectedAmount(null);
    setCustomAmount('');
    setDonator(EMPTY_DONATOR);
    setComment('');
    setLoading(false);
    setErrorMessage('');
    setBankInfo(null);
    setBankError('');
    setIbanCopied(false);
    getDonationSiteData(locale).then(data => setDescription(data.description));
  }, [visible, locale]);

  const displayAmount = selectedAmount ?? (customAmount ? parseFloat(customAmount) || 0 : 0);
  const isValidAmount = displayAmount > 0;

  function selectAmount(amount) {
    setSelectedAmount(amount);
    setCustomAmount('');
    setErrorMessage('');
  }

  function onCustomAmountChange(text) {
    setCustomAmount(text);
    setSelectedAmount(null);
    setErrorMessage('');
  }

  function switchToBank() {
    setActiveTab('bank');
    if (!bankInfo && !bankLoading) fetchBankInfo();
  }

  function fetchBankInfo() {
    setBankLoading(true);
    setBankError('');
    api.get(`${API_BASE}/get_donation/tbc_info`)
      .then(res => setBankInfo(res.data))
      .catch(() => {
        if (FALLBACK_BANK_INFO) {
          setBankInfo(FALLBACK_BANK_INFO);
        } else {
          setBankError(t('donation.bank_transfer_error'));
        }
      })
      .finally(() => setBankLoading(false));
  }

  async function copyIban() {
    if (!bankInfo?.iban) return;
    await Clipboard.setStringAsync(bankInfo.iban);
    setIbanCopied(true);
    setTimeout(() => setIbanCopied(false), 1500);
  }

  async function processDonation() {
    if (!isValidAmount) {
      setErrorMessage(t('donation.invalid_amount'));
      return;
    }
    setLoading(true);
    setErrorMessage('');

    const payload = { amount: displayAmount };
    if (comment.trim()) payload.comment = comment.trim();
    if (!user) {
      Object.entries(donator).forEach(([k, v]) => {
        if (v.trim()) payload[k] = v.trim();
      });
    }

    try {
      const res = await api.post(`${API_BASE}/set_donation/process`, payload);
      if (res.data?.checkout_url) {
        await Linking.openURL(res.data.checkout_url);
      }
      onClose();
    } catch (err) {
      setErrorMessage(err?.response?.data?.message ?? t('donation.submit_error'));
    } finally {
      setLoading(false);
    }
  }

  const contentWidth = Math.max(width - 96, 200);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.title}>❤️ {t('donation.modal_title')}</Text>
            {!!description && (
              <RenderHtml contentWidth={contentWidth} source={{ html: description }} />
            )}

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'card' && styles.tabBtnActive]}
                onPress={() => setActiveTab('card')}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, activeTab === 'card' && styles.tabBtnTextActive]}>
                  💳 {t('donation.card_tab')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'bank' && styles.tabBtnActive]}
                onPress={switchToBank}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabBtnText, activeTab === 'bank' && styles.tabBtnTextActive]}>
                  🏦 {t('donation.bank_tab')}
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'card' ? (
              <>
                <Text style={styles.sectionTitle}>{t('donation.donator_info')}</Text>
                {user ? (
                  <View style={styles.userInfoBox}>
                    <Text style={styles.userInfoText}>
                      {t('donation.donating_as')} {user.name} {user.surname} ({user.email})
                    </Text>
                  </View>
                ) : (
                  <>
                    <TextInput style={styles.input} placeholder={t('donation.name')} placeholderTextColor="#aaa" value={donator.name} onChangeText={v => setDonator(d => ({ ...d, name: v }))} autoCapitalize="words" />
                    <TextInput style={styles.input} placeholder={t('donation.surname')} placeholderTextColor="#aaa" value={donator.surname} onChangeText={v => setDonator(d => ({ ...d, surname: v }))} autoCapitalize="words" />
                    <TextInput style={styles.input} placeholder={t('donation.email')} placeholderTextColor="#aaa" value={donator.email} onChangeText={v => setDonator(d => ({ ...d, email: v }))} keyboardType="email-address" autoCapitalize="none" />
                    <TextInput style={styles.input} placeholder={t('donation.phone')} placeholderTextColor="#aaa" value={donator.phone_number} onChangeText={v => setDonator(d => ({ ...d, phone_number: v }))} keyboardType="phone-pad" />
                    <TextInput style={styles.input} placeholder={t('donation.country')} placeholderTextColor="#aaa" value={donator.country} onChangeText={v => setDonator(d => ({ ...d, country: v }))} />
                    <TextInput style={styles.input} placeholder={t('donation.age')} placeholderTextColor="#aaa" value={donator.age} onChangeText={v => setDonator(d => ({ ...d, age: v }))} keyboardType="numeric" />
                  </>
                )}

                <Text style={styles.sectionTitle}>{t('donation.select_amount')}</Text>
                <View style={styles.amountRow}>
                  {PREDEFINED_AMOUNTS.map(amount => (
                    <TouchableOpacity
                      key={amount}
                      style={[styles.amountBtn, selectedAmount === amount && styles.amountBtnActive]}
                      onPress={() => selectAmount(amount)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.amountBtnText, selectedAmount === amount && styles.amountBtnTextActive]}>
                        {amount} {t('donation.gel')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  style={styles.input}
                  placeholder={t('donation.custom_amount')}
                  placeholderTextColor="#aaa"
                  value={customAmount}
                  onChangeText={onCustomAmountChange}
                  keyboardType="numeric"
                />
                <Text style={styles.selectedAmountText}>
                  {t('donation.selected_amount')}: {displayAmount || 0} {t('donation.gel')}
                </Text>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder={t('donation.comment_placeholder')}
                  placeholderTextColor="#aaa"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

                <TouchableOpacity
                  style={[styles.donateBtn, (!isValidAmount || loading) && styles.donateBtnDisabled]}
                  onPress={processDonation}
                  disabled={!isValidAmount || loading}
                  activeOpacity={0.85}
                >
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.donateBtnText}>❤️ {t('donation.donate_button')} {displayAmount || 0} {t('donation.gel')}</Text>
                  }
                </TouchableOpacity>
              </>
            ) : (
              <View>
                {bankLoading ? (
                  <ActivityIndicator color="#279fbb" style={styles.loader} />
                ) : bankInfo && !bankInfo.allowed ? (
                  <View style={styles.bankMessageBox}>
                    <Text style={styles.bankMessageText}>{t('donation.bank_only_georgia')}</Text>
                    <Text style={styles.bankMessageSub}>{t('donation.use_card_instead')}</Text>
                  </View>
                ) : bankInfo && bankInfo.allowed ? (
                  <View>
                    <Text style={styles.bankInstructions}>{t('donation.bank_instructions')}</Text>
                    <View style={styles.bankCard}>
                      <BankRow label={t('donation.bank_name')} value={bankInfo.bank_name} />
                      <BankRow label={t('donation.swift_bic')} value={bankInfo.bank_code} />
                      <BankRow label={t('donation.account_name')} value={bankInfo.account_name} />
                      <View style={styles.bankRow}>
                        <Text style={styles.bankRowLabel}>{t('donation.iban')}</Text>
                        <Text style={[styles.bankRowValue, styles.ibanValue]}>{bankInfo.iban}</Text>
                        <TouchableOpacity onPress={copyIban} style={styles.copyBtn} activeOpacity={0.7}>
                          <Text style={styles.copyBtnText}>{ibanCopied ? `✓ ${t('donation.copied')}` : t('donation.copy')}</Text>
                        </TouchableOpacity>
                      </View>
                      <BankRow label={t('donation.currency')} value="GEL" />
                    </View>
                  </View>
                ) : bankError ? (
                  <Text style={styles.errorText}>{bankError}</Text>
                ) : null}
              </View>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeBtnText}>{t('donation.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function BankRow({ label, value }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankRowLabel}>{label}</Text>
      <Text style={styles.bankRowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
  },
  title: { fontSize: 19, fontWeight: '800', color: '#279fbb', textAlign: 'center', marginBottom: 8 },
  loader: { marginVertical: 32 },
  tabRow: { flexDirection: 'row', gap: 10, marginVertical: 16 },
  tabBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#279fbb' },
  tabBtnText: { fontSize: 14, color: '#279fbb', fontWeight: '700' },
  tabBtnTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#279fbb', marginBottom: 10, marginTop: 6 },
  userInfoBox: { backgroundColor: '#e8f6fa', borderRadius: 10, padding: 12, marginBottom: 12 },
  userInfoText: { fontSize: 13, color: '#1a6f85' },
  input: {
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 10,
    fontSize: 14,
    color: '#222',
  },
  textArea: { height: 80, paddingTop: 11 },
  amountRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  amountBtn: {
    borderWidth: 1.5,
    borderColor: '#28a745',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  amountBtnActive: { backgroundColor: '#28a745' },
  amountBtnText: { fontSize: 13, color: '#28a745', fontWeight: '700' },
  amountBtnTextActive: { color: '#fff' },
  selectedAmountText: { fontSize: 14, fontWeight: '700', color: '#28a745', textAlign: 'center', marginBottom: 14 },
  errorText: { color: '#e74c3c', fontSize: 13, textAlign: 'center', marginBottom: 12 },
  donateBtn: {
    backgroundColor: '#28a745',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  donateBtnDisabled: { opacity: 0.5 },
  donateBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  bankMessageBox: { alignItems: 'center', paddingVertical: 24 },
  bankMessageText: { fontSize: 14, fontWeight: '700', color: '#555', textAlign: 'center', marginBottom: 6 },
  bankMessageSub: { fontSize: 13, color: '#888', textAlign: 'center' },
  bankInstructions: { fontSize: 13, color: '#555', marginBottom: 12 },
  bankCard: { backgroundColor: '#f4f6f8', borderRadius: 10, padding: 14 },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  bankRowLabel: { width: 110, fontSize: 12, fontWeight: '700', color: '#666' },
  bankRowValue: { flex: 1, fontSize: 13, color: '#222', fontWeight: '600' },
  ibanValue: { fontFamily: 'monospace', letterSpacing: 0.5 },
  copyBtn: { borderWidth: 1, borderColor: '#279fbb', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8 },
  copyBtnText: { fontSize: 11, color: '#279fbb', fontWeight: '700' },
  closeBtn: {
    borderWidth: 1.5,
    borderColor: '#999',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  closeBtnText: { color: '#666', fontSize: 14, fontWeight: '700' },
});
