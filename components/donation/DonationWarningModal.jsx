import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import HtmlContent from '../HtmlContent';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../../utils/LocaleContext';
import { getDonationSiteData } from '../../utils/donationSiteData';
import DonationModal from './DonationModal';
import { COLORS, FONTS } from '../../assets/styles/styles';

export default function DonationWarningModal({ visible, onClose }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState(null);
  const [donationVisible, setDonationVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAgreed(false);
    setLoading(true);
    getDonationSiteData(locale).then(data => {
      setContent(data);
      setLoading(false);
    });
  }, [visible, locale]);

  function handleContinue() {
    onClose();
    setDonationVisible(true);
  }

  const contentWidth = Math.max(width - 96, 200);

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{t('donation.modal_title')}</Text>

            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : (
              <ScrollView style={styles.scroll}>
                {!!content?.short_description && (
                  <HtmlContent contentWidth={contentWidth} html={content.short_description} />
                )}
                <Text style={styles.termsTitle}>{t('donation.terms_title')}</Text>
                {!!content?.terms_of_use && (
                  <HtmlContent contentWidth={contentWidth} html={content.terms_of_use} />
                )}
              </ScrollView>
            )}

            <TouchableOpacity style={styles.checkboxRow} onPress={() => setAgreed(v => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
                {agreed && <Text style={styles.checkboxTick}>✓</Text>}
              </View>
              <Text style={styles.checkboxLabel}>{t('donation.agree_checkbox')}</Text>
            </TouchableOpacity>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
                <Text style={styles.closeBtnText}>{t('donation.close')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.continueBtn, !agreed && styles.continueBtnDisabled]}
                onPress={handleContinue}
                disabled={!agreed}
                activeOpacity={0.8}
              >
                <Text style={styles.continueBtnText}>{t('donation.continue')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DonationModal visible={donationVisible} onClose={() => setDonationVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
  },
  title: { fontSize: 18, fontFamily: FONTS.bodyHeavy, color: COLORS.primary, textAlign: 'center', marginBottom: 12 },
  loader: { marginVertical: 32 },
  scroll: { marginBottom: 16 },
  termsTitle: { fontSize: 14, fontFamily: FONTS.bodyBold, color: COLORS.primary, marginTop: 12, marginBottom: 6 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: COLORS.success },
  checkboxTick: { color: '#fff', fontSize: 13, fontFamily: FONTS.bodyHeavy },
  checkboxLabel: { flex: 1, fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone },
  btnRow: { flexDirection: 'row', gap: 10 },
  closeBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.muted,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeBtnText: { color: COLORS.stone, fontSize: 14, fontFamily: FONTS.bodyBold },
  continueBtn: {
    flex: 1,
    backgroundColor: COLORS.success,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueBtnDisabled: { opacity: 0.4 },
  continueBtnText: { color: '#fff', fontSize: 14, fontFamily: FONTS.bodyBold },
});
