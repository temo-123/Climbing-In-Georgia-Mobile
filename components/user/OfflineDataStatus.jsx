import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faCloudArrowDown, faTrashCan, faDatabase } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useAuth, useAccount } from '../../utils/AuthContext';
import { useLocale } from '../../utils/LocaleContext';
import { clearOfflineData, getLastDownloadTime } from '../../utils/offlineStorage';
import { accountOfflineDownload, clearOfflineDownloadOnAccount } from '../../utils/offlineAccountSync';
import { dayMonthYear, pad2 } from '../../utils/eventDates';
import Button from '../ui/Button';
import { COLORS, FONTS } from '../../assets/styles/styles';

export function formatDownloadTime(d, locale) {
  return `${dayMonthYear(d, locale)}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// Offline guidebook on the account (users.use_offline_data_on_mobile = time of
// the last download, see utils/offlineAccountSync.js): shows that time, and
// offers Download (`onWantDownload`) or Remove (local data + the account
// value). Logged-in, non-under-age accounts only.
export default function OfflineDataStatus({ onWantDownload, onCleared, hideDownload, style }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, refreshUser } = useAuth();
  const { canAct } = useAccount();
  const [hasLocal, setHasLocal] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    getLastDownloadTime().then((v) => setHasLocal(!!v)).catch(() => {});
  }, [user?.use_offline_data_on_mobile]);

  if (!user || !canAct) return null;
  const onAccount = accountOfflineDownload(user);

  function confirmRemove() {
    Alert.alert(t('account.offline_clear_q_title'), t('account.offline_clear_q_text'), [
      { text: t('account.keep'), style: 'cancel' },
      {
        text: t('account.remove'),
        style: 'destructive',
        onPress: async () => {
          setRemoving(true);
          try {
            await clearOfflineData();
            await clearOfflineDownloadOnAccount();
            await refreshUser().catch(() => {});
            setHasLocal(false);
            onCleared?.();
          } finally {
            setRemoving(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={style}>
      <View style={styles.row}>
        <FontAwesomeIcon icon={faDatabase} size={16} color={onAccount ? COLORS.primary : COLORS.muted} />
        <View style={styles.flex}>
          <Text style={styles.title}>{t('account.offline_account_title')}</Text>
          <Text style={styles.hint}>
            {onAccount instanceof Date
              ? t('account.offline_account_last', { date: formatDownloadTime(onAccount, locale) })
              : onAccount ? t('account.offline_account_yes') : t('account.offline_account_never')}
          </Text>
        </View>
      </View>
      <View style={styles.buttons}>
        {!hideDownload && !!onWantDownload && (
          <Button small block={false} icon={faCloudArrowDown} title={t('account.download_now')} onPress={onWantDownload} />
        )}
        {(hasLocal || !!onAccount) && (
          <Button small block={false} variant="ghost" icon={faTrashCan} title={t('account.offline_remove_btn')} onPress={confirmRemove} loading={removing} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  title: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.ink },
  hint: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: COLORS.stone, marginTop: 2 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
});
