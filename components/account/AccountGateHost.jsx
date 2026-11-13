import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEnvelope, faUserXmark, faXmark, faBan, faPen } from '@fortawesome/free-solid-svg-icons';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import ResendVerifyButton from './ResendVerifyButton';
import AgeRestrictionPanel from './AgeRestrictionPanel';
import { useAuth, accountStateOf } from '../../utils/AuthContext';
import { onGateEvent } from '../../utils/accountGate';
import { getLastDownloadTime } from '../../utils/offlineStorage';
import { flushPendingOfflineSync, accountOfflineDownload } from '../../utils/offlineAccountSync';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// App-wide answers to the account states the backend enforces (rendered once,
// inside the NavigationContainer, with its ref):
// - 403 is_banned → "Account suspended" (the session is already cleared)
// - 403 age_restricted → age sheet; also right after logging in as under-age
// - 403 email_not_verified → "Verify your e-mail first" sheet with resend
// - session expired (401 confirmed) → toast with a Log in action (stays a guest)
// - a small dismissible reminder bar while under-age / unverified
// - after login: offer the offline download when the account asks for it
export default function AccountGateHost({ navigationRef }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { user, refreshUser } = useAuth();
  const account = accountStateOf(user);
  const [sheet, setSheet] = useState(null); // { type, data }
  const [barHidden, setBarHidden] = useState(false);
  const [route, setRoute] = useState(null);
  const userRef = useRef(user);
  userRef.current = user;

  function navigate(...args) {
    if (navigationRef?.isReady?.()) navigationRef.navigate(...args);
  }

  useEffect(() => {
    if (!navigationRef) return undefined;
    const update = () => setRoute(navigationRef.getCurrentRoute?.()?.name ?? null);
    update();
    return navigationRef.addListener?.('state', update);
  }, [navigationRef]);

  // Each new session starts with the bar visible again.
  useEffect(() => { setBarHidden(false); }, [user?.id]);

  useEffect(() => onGateEvent((type, data) => {
    if (type === 'banned') {
      setSheet({ type: 'banned', data });
    } else if (type === 'age_restricted') {
      setSheet({ type: 'age', data });
    } else if (type === 'email_not_verified') {
      setSheet((s) => (s?.type === 'age' || s?.type === 'banned' ? s : { type: 'verify', data }));
    } else if (type === 'session_expired') {
      // The app keeps working as a guest — never push the login screen on
      // the user (this used to fire at app start with a revoked token).
      toast.show({
        message: t('account.session_expired'),
        type: 'error',
        duration: 7000,
        action: { label: t('auth.login'), handler: () => navigate('login') },
      });
    } else if (type === 'session_restored') {
      // App start with a saved under-age session: same alert as after login.
      if (accountStateOf(data).isUnderage) setSheet({ type: 'age_login' });
      else syncOffline();
    } else if (type === 'logged_in') {
      const state = accountStateOf(data);
      if (state.isUnderage) {
        setSheet({ type: 'age_login' });
      } else {
        syncOffline();
        // The account has an offline download, this phone doesn't → offer it.
        if (accountOfflineDownload(data)) offerOfflineDownload();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);

  // A download time that couldn't be saved on the account earlier.
  async function syncOffline() {
    if (await flushPendingOfflineSync().catch(() => false)) refreshUser().catch(() => {});
  }

  async function offerOfflineDownload() {
    const last = await getLastDownloadTime().catch(() => null);
    if (last) return;
    Alert.alert(t('account.offline_download_q_title'), t('account.offline_download_q_text'), [
      { text: t('account.later'), style: 'cancel' },
      { text: t('account.download_now'), onPress: () => navigate('HomeDrawer', { screen: 'offline_mode', params: { autoStart: Date.now() } }) },
    ]);
  }

  const close = () => setSheet(null);
  const minAge = Number(sheet?.data?.min_age) || account.minAge;

  // Reminder bar — not on the screens that already are the full explanation.
  const panelRoutes = ['login', 'register', 'social_create_password', 'my_logbook', 'my_mtp_ascents'];
  const onPanel = panelRoutes.includes(route) || /^user_/.test(route || '');
  const showBar = !barHidden && !sheet && !onPanel
    && (account.isUnderage || account.isUnverified);

  return (
    <>
      {showBar && (
        <View style={[styles.bar, { bottom: insets.bottom + 16 }]}>
          <FontAwesomeIcon icon={account.isUnderage ? faUserXmark : faEnvelope} size={14} color={COLORS.hold} />
          <TouchableOpacity
            style={styles.barBody}
            activeOpacity={0.8}
            onPress={() => setSheet(account.isUnderage ? { type: 'age' } : { type: 'verify' })}
          >
            <Text style={styles.barTitle} numberOfLines={2}>
              {account.isUnderage
                ? t('site.global.age_restriction.bar_title', { age: account.minAge })
                : t('site.global.email_verify.bar_title')}
            </Text>
            <Text style={styles.barText} numberOfLines={2}>
              {account.isUnderage ? t('site.global.age_restriction.bar_text') : t('site.global.email_verify.bar_text')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity hitSlop={10} onPress={() => setBarHidden(true)} accessibilityLabel={t('account.dismiss')}>
            <FontAwesomeIcon icon={faXmark} size={15} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>
        </View>
      )}

      <Sheet
        visible={sheet?.type === 'age' || sheet?.type === 'age_login'}
        onClose={close}
        eyebrow={t('site.global.age_restriction.modal_title')}
        title={sheet?.type === 'age_login' ? undefined : t('site.global.age_restriction.modal_title')}
      >
        {sheet?.type === 'age_login' ? (
          <AgeRestrictionPanel
            onLeave={() => { close(); navigate('HomeDrawer', { screen: 'home' }); }}
            onContact={() => { close(); navigate('HomeDrawer', { screen: 'about_us' }); }}
          />
        ) : (
          <View style={styles.sheetBody}>
            <Text style={styles.sheetText}>{t('site.global.age_restriction.inline', { age: minAge })}</Text>
            <Text style={styles.sheetHint}>{t('site.global.age_restriction.bar_text')}</Text>
            <Text style={styles.sheetHint}>{t('account.age_wrong_birthday')}</Text>
            <Button title={t('account.ok')} onPress={close} />
          </View>
        )}
      </Sheet>

      <Sheet visible={sheet?.type === 'verify'} onClose={close} eyebrow={t('site.global.email_verify.bar_title')} title={t('site.global.email_verify.modal_title')}>
        <View style={styles.sheetBody}>
          <Text style={styles.sheetText}>{t('site.global.email_verify.modal_text')}</Text>
          <Text style={styles.sheetEmail} selectable>{sheet?.data?.email || user?.email}</Text>
          <Text style={styles.sheetHint}>{t('site.global.email_verify.modal_hint')}</Text>
          <ResendVerifyButton onAlready={() => { refreshUser().catch(() => {}); close(); }} />
          <Button
            variant="ghost"
            icon={faPen}
            title={t('site.global.email_verify.change_email')}
            onPress={() => { close(); navigate('user_options'); }}
          />
        </View>
      </Sheet>

      <Sheet visible={sheet?.type === 'banned'} onClose={close} eyebrow={t('account.suspended_eyebrow')} title={t('account.suspended_title')}>
        <View style={styles.sheetBody}>
          <View style={styles.bannedIcon}><FontAwesomeIcon icon={faBan} size={26} color={COLORS.danger} /></View>
          <Text style={styles.sheetText}>{t('account.suspended_text')}</Text>
          <Button title={t('account.ok')} onPress={() => { close(); navigate('HomeDrawer', { screen: 'home' }); }} />
          <Button variant="ghost" icon={faEnvelope} title={t('account.contact_us')} onPress={() => { close(); navigate('HomeDrawer', { screen: 'about_us' }); }} />
        </View>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 16,
    right: 86, // leaves room for the floating donation button
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  barBody: { flex: 1 },
  barTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: '#fff' },
  barText: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 15, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  sheetBody: { gap: 12, paddingBottom: 8 },
  sheetText: { fontFamily: FONTS.body, fontSize: 15, lineHeight: 22, color: COLORS.ink2 },
  sheetEmail: { fontFamily: FONTS.bodyHeavy, fontSize: 15, color: COLORS.ink },
  sheetHint: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  bannedIcon: {
    width: 56, height: 56, borderRadius: 18, alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fbe9ea',
  },
});
