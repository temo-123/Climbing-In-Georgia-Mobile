import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import DonationWarningModal from './DonationWarningModal';

// Don't offer donations at all until real payment/bank details are actually
// configured (see .env.example) — showing "Support Us" with a blank IBAN
// underneath is worse than not showing it.
const PAYMENT_CONFIGURED = !!(
  process.env.EXPO_PUBLIC_DONATION_BANK_NAME &&
  process.env.EXPO_PUBLIC_DONATION_BANK_CODE &&
  process.env.EXPO_PUBLIC_DONATION_ACCOUNT_NAME &&
  process.env.EXPO_PUBLIC_DONATION_IBAN
);

// Hidden for now: Google Play (and the App Store) only allow in-app payments
// outside their billing for tax-exempt charity donations, which these aren't.
// Donations stay available on the website. Flip back to true to re-enable —
// the whole flow (warning modal, card/bank modal) is kept intact.
const DONATIONS_ENABLED = false;

export default function DonationButton() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [warningVisible, setWarningVisible] = useState(false);

  if (!DONATIONS_ENABLED || !PAYMENT_CONFIGURED) return null;

  return (
    <>
      <TouchableOpacity
        style={[styles.floatingBtn, { bottom: insets.bottom + 16 }]}
        onPress={() => setWarningVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.floatingBtnText}>❤️ {t('donation.support_button')}</Text>
      </TouchableOpacity>
      <DonationWarningModal visible={warningVisible} onClose={() => setWarningVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: 'absolute',
    right: 16,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 28,
    backgroundColor: '#28a745',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 999,
  },
  floatingBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
