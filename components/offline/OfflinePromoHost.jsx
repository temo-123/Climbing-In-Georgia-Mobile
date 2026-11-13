import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgXml } from 'react-native-svg';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faMapLocationDot, faImage, faFlag, faRotate, faCloudArrowDown, faUserPlus, faXmark, faWifi,
} from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';
import { SCENES } from '../ui/scenes';
import { useAuth } from '../../utils/AuthContext';
import { useNetwork } from '../../utils/NetworkContext';
import { getLastDownloadTime } from '../../utils/offlineStorage';
import { accountOfflineDownload } from '../../utils/offlineAccountSync';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Two nudges for offline mode, decided once per app start (rendered inside
// the NavigationContainer, with its ref):
// 1. Promo modal — only for people who don't use offline data yet (nothing
//    downloaded on this phone and no download time on the account). Never on
//    the very first app open, at most every PROMO_GAP_DAYS, and only on a
//    random PROMO_CHANCE of the starts after that. "Don't show again" stops it.
// 2. Update reminder — a small card when this phone's download is older than
//    STALE_DAYS, at most every UPDATE_GAP_DAYS.
// Never while offline or on the login / register screens.
//
// Storage keys must NOT start with '@offline_' — clearOfflineData() removes
// those.
const K = {
  opens: '@promo_app_opens',
  promoLast: '@promo_offline_last_shown',
  promoNever: '@promo_offline_never',
  updateLast: '@promo_offline_update_last_shown',
};
const PROMO_CHANCE = 0.35;
const PROMO_GAP_DAYS = 3;
const STALE_DAYS = 30;
const UPDATE_GAP_DAYS = 7;
const DELAY_MS = 9000;
const DAY = 86400000;
const QUIET_ROUTES = ['login', 'register', 'forgot_password', 'social_create_password', 'offline_mode', 'submit_ascent', 'qr_scanner'];

async function getNum(key) {
  try { return Number(await AsyncStorage.getItem(key)) || 0; } catch { return 0; }
}
async function setNum(key, v) {
  try { await AsyncStorage.setItem(key, String(v)); } catch {}
}

export default function OfflinePromoHost({ navigationRef }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const { isOffline } = useNetwork();
  const [show, setShow] = useState(null); // 'promo' | { type: 'update', days }
  const decided = useRef(false);
  const userRef = useRef(user);
  userRef.current = user;
  const offlineRef = useRef(isOffline);
  offlineRef.current = isOffline;

  function navigate(...args) {
    if (navigationRef?.isReady?.()) navigationRef.navigate(...args);
  }
  function currentRoute() {
    return navigationRef?.getCurrentRoute?.()?.name ?? null;
  }

  useEffect(() => {
    if (isLoading || decided.current) return undefined;
    decided.current = true;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const opens = (await getNum(K.opens)) + 1;
      await setNum(K.opens, opens);
      if (cancelled || offlineRef.current || QUIET_ROUTES.includes(currentRoute())) return;

      const now = Date.now();
      let localIso = null;
      try { localIso = await getLastDownloadTime(); } catch {}

      if (localIso) {
        const age = now - new Date(localIso).getTime();
        if (age >= STALE_DAYS * DAY && now - (await getNum(K.updateLast)) >= UPDATE_GAP_DAYS * DAY) {
          await setNum(K.updateLast, now);
          if (!cancelled) setShow({ type: 'update', days: Math.floor(age / DAY) });
        }
        return;
      }

      // Already uses offline data (on another phone, or before reinstalling).
      if (accountOfflineDownload(userRef.current)) return;
      if (opens < 2 || (await getNum(K.promoNever))) return;
      if (now - (await getNum(K.promoLast)) < PROMO_GAP_DAYS * DAY) return;
      if (Math.random() >= PROMO_CHANCE) return;
      await setNum(K.promoLast, now);
      if (!cancelled) setShow('promo');
    }, DELAY_MS);
    return () => { cancelled = true; clearTimeout(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const close = () => setShow(null);
  const download = () => { close(); navigate('HomeDrawer', { screen: 'offline_mode', params: { autoStart: Date.now() } }); };

  if (!show) return null;

  if (show === 'promo') {
    const features = [
      { icon: faMapLocationDot, text: t('offline_promo.feature_routes') },
      { icon: faImage, text: t('offline_promo.feature_topos') },
      { icon: faFlag, text: t('offline_promo.feature_summits') },
      { icon: faRotate, text: t('offline_promo.feature_sync') },
    ];
    return (
      <Modal visible transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.card}>
            <TouchableOpacity style={styles.close} onPress={close} hitSlop={10} accessibilityLabel={t('account.dismiss')}>
              <FontAwesomeIcon icon={faXmark} size={16} color="rgba(255,255,255,0.85)" />
            </TouchableOpacity>
            <View style={styles.hero}>
              <View style={styles.scene}><SvgXml xml={SCENES.summit} width="100%" height="100%" /></View>
              <View style={styles.badge}>
                <FontAwesomeIcon icon={faWifi} size={11} color={COLORS.ink} />
                <Text style={styles.badgeText}>{t('offline_promo.badge')}</Text>
              </View>
              <Text style={styles.title}>{t('offline_promo.title')}</Text>
              <Text style={styles.lead}>{t('offline_promo.lead')}</Text>
            </View>
            <View style={styles.body}>
              {features.map((f) => (
                <View key={f.text} style={styles.feature}>
                  <View style={styles.featureIcon}><FontAwesomeIcon icon={f.icon} size={13} color={COLORS.primaryDark} /></View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
              <View style={styles.buttons}>
                {user ? (
                  <Button variant="hold" icon={faCloudArrowDown} title={t('offline_promo.cta_download')} onPress={download} />
                ) : (
                  <>
                    <Button variant="hold" icon={faUserPlus} title={t('offline_promo.cta_register')} onPress={() => { close(); navigate('register'); }} />
                    <Text style={styles.free}>{t('offline_promo.free_note')}</Text>
                    <TouchableOpacity onPress={() => { close(); navigate('login'); }} hitSlop={6}>
                      <Text style={styles.link}>{t('offline_promo.have_account')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
              <View style={styles.footer}>
                <TouchableOpacity onPress={close} hitSlop={6}><Text style={styles.muted}>{t('account.later')}</Text></TouchableOpacity>
                <Text style={styles.dot}>·</Text>
                <TouchableOpacity onPress={() => { setNum(K.promoNever, 1); close(); }} hitSlop={6}>
                  <Text style={styles.muted}>{t('offline_promo.never')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Small "update your offline data" card.
  return (
    <View style={[styles.update, { bottom: insets.bottom + 16 }]}>
      <View style={styles.updateIcon}><FontAwesomeIcon icon={faRotate} size={14} color={COLORS.ink} /></View>
      <View style={styles.flex}>
        <Text style={styles.updateTitle}>{t('offline_promo.update_title')}</Text>
        <Text style={styles.updateText}>{t('offline_promo.update_text', { days: show.days })}</Text>
        <View style={styles.updateBtns}>
          <Button small block={false} variant="hold" title={t('offline_promo.update_btn')} onPress={download} />
          <Button small block={false} variant="ghost" title={t('account.later')} onPress={close} />
        </View>
      </View>
      <TouchableOpacity onPress={close} hitSlop={10} accessibilityLabel={t('account.dismiss')}>
        <FontAwesomeIcon icon={faXmark} size={14} color="rgba(255,255,255,0.7)" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(21,33,43,0.6)', justifyContent: 'center', padding: 20 },
  card: { borderRadius: RADII.xl, overflow: 'hidden', backgroundColor: COLORS.chalk, maxWidth: 440, width: '100%', alignSelf: 'center' },
  close: { position: 'absolute', top: 12, right: 12, zIndex: 2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.25)' },
  hero: { backgroundColor: COLORS.ink, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, borderBottomWidth: 3, borderBottomColor: COLORS.hold, overflow: 'hidden' },
  scene: { position: 'absolute', right: -20, bottom: -10, width: 200, height: 130, opacity: 0.35 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: COLORS.hold, borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  badgeText: { fontFamily: FONTS.bodyHeavy, fontSize: 11, color: COLORS.ink, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontFamily: FONTS.displayBold, fontSize: 30, lineHeight: 32, color: '#fff', marginBottom: 6, paddingRight: 30 },
  lead: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: 'rgba(255,255,255,0.85)' },
  body: { padding: 20, gap: 10 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink2 },
  buttons: { marginTop: 8, gap: 8, alignItems: 'stretch' },
  free: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.stone, textAlign: 'center' },
  link: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: COLORS.primary, textAlign: 'center', paddingVertical: 4 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
  muted: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.muted },
  dot: { color: COLORS.muted },
  update: {
    position: 'absolute', left: 16, right: 86, flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 12, borderRadius: RADII.md, backgroundColor: COLORS.ink,
    elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
  },
  updateIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.hold, alignItems: 'center', justifyContent: 'center' },
  updateTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: '#fff' },
  updateText: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 16, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  updateBtns: { flexDirection: 'row', gap: 8, marginTop: 8 },
});
