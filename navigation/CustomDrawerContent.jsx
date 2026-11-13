import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWifi } from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale } from '../utils/LocaleContext';
import { useAuth } from '../utils/AuthContext';
import { useNetwork } from '../utils/NetworkContext';
import { COLORS, FONTS, RADII } from '../assets/styles/styles';
import { SKETCHES } from '../components/ui/sketches';
import Segmented from '../components/ui/Segmented';
import { SvgXml } from 'react-native-svg';
import { IMG_BASES, imgUri } from '../utils/api';
import { accountAlerts } from '../utils/accountAlerts';

function initialsOf(user) {
  return `${user?.name?.[0] ?? ''}${user?.surname?.[0] ?? ''}`.toUpperCase();
}

export default function CustomDrawerContent(props) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { user } = useAuth();
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  const avatarUri = user?.image ? imgUri(IMG_BASES.userProfile, user.image, user.updated_at) : null;

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={styles.scroll}>
      <View style={[styles.logoSection, { paddingTop: insets.top + 24 }]}>
        <View pointerEvents="none" style={styles.sketch}>
          <SvgXml xml={SKETCHES.mountains} width="100%" height="100%" />
        </View>
        {user ? (
          <TouchableOpacity onPress={() => props.navigation.navigate('user_profile')} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}><Text style={styles.avatarFallbackText}>{initialsOf(user)}</Text></View>
            )}
          </TouchableOpacity>
        ) : (
          <Image
            source={require('../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
        {!!user && <Text style={styles.greeting}>{t('nav.hi_user', { name: user.name })}</Text>}
        {/* Offline indicator sits right under the avatar/greeting and is shown
            to logged-in and logged-out users alike — it says something about
            the device, not about the account. */}
        {isOffline && (
          <View style={styles.offlineChip}>
            <FontAwesomeIcon icon={faWifi} size={11} color="#7a5c00" />
            <Text style={styles.offlineChipText}>{t('nav.offline_indicator')}</Text>
          </View>
        )}
        <Text style={styles.appName}>{t('nav.welcome_message')}</Text>
        <Text style={styles.appTagline}>{t('nav.powered_by')}</Text>
      </View>

      <View style={styles.items}>
        <DrawerItemList {...props} />
      </View>

      <View style={styles.section}>
        {user ? (
          <TouchableOpacity onPress={() => props.navigation.navigate('user_profile')} activeOpacity={0.7}>
            <Text style={styles.userName}>{user.name} {user.surname}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.profileRow}>
              <Text style={styles.profileLink}>{t('auth.profile')} ›</Text>
              {accountAlerts(user).length > 0 && (
                <View style={styles.alertBadge}><Text style={styles.alertBadgeText}>{accountAlerts(user).length}</Text></View>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => props.navigation.navigate('login')}
            activeOpacity={0.8}
          >
            <Text style={styles.loginBtnText}>{t('auth.nav_login')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>{t('language')}</Text>
        <Segmented
          options={[{ key: 'en', label: 'English' }, { key: 'ka', label: 'ქართული' }]}
          value={locale}
          onChange={setLocale}
        />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: 0, paddingHorizontal: 0, paddingStart: 0, paddingEnd: 0 },
  items: { paddingHorizontal: 12 },
  logoSection: {
    alignItems: 'center',
    paddingBottom: 22,
    paddingHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.ink,
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
    overflow: 'hidden',
  },
  sketch: { position: 'absolute', right: -30, bottom: -6, width: 190, height: 114, opacity: 0.35 },
  logo: { width: 72, height: 72, borderRadius: 18, marginBottom: 10 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginBottom: 10,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: { fontSize: 26, fontFamily: FONTS.displayBold, color: '#fff' },
  offlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff3cd',
    borderRadius: RADII.pill,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  offlineChipText: { fontSize: 11, color: '#7a5c00', fontFamily: FONTS.bodyBold },
  greeting: {
    fontSize: 22,
    fontFamily: FONTS.displayBold,
    color: COLORS.hold,
    textAlign: 'center',
    marginBottom: 2,
  },
  appName: {
    fontSize: 13,
    fontFamily: FONTS.bodySemi,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  appTagline: { fontSize: 12, color: COLORS.hold, fontFamily: FONTS.bodyBold, marginTop: 2 },
  section: {
    marginTop: 8,
    marginHorizontal: 12,
    paddingHorizontal: 4,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  label: {
    fontSize: 11,
    color: COLORS.muted,
    fontFamily: FONTS.bodyHeavy,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 10,
  },
  userName: { fontSize: 18, fontFamily: FONTS.displayBold, color: COLORS.ink, marginBottom: 2 },
  userEmail: { fontSize: 12, color: COLORS.stone, fontFamily: FONTS.body, marginBottom: 4 },
  profileLink: { fontSize: 13, color: COLORS.primary, fontFamily: FONTS.bodyHeavy },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 5, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  alertBadgeText: { color: '#fff', fontFamily: FONTS.bodyHeavy, fontSize: 10 },
  loginBtn: {
    backgroundColor: COLORS.hold,
    borderRadius: RADII.pill,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.14)',
  },
  loginBtnText: { color: COLORS.ink, fontFamily: FONTS.bodyHeavy, fontSize: 14 },
});
