import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';
import { useAuth } from '../utils/AuthContext';
import { COLORS } from '../assets/styles/styles';
import { IMG_BASES, imgUri } from '../utils/api';

function initialsOf(user) {
  return `${user?.name?.[0] ?? ''}${user?.surname?.[0] ?? ''}`.toUpperCase();
}

export default function CustomDrawerContent(props) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const { user } = useAuth();

  const avatarUri = user?.image ? imgUri(IMG_BASES.userProfile, user.image) : null;

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.logoSection}>
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
        <Text style={styles.appName}>{t('nav.welcome_message')}</Text>
        <Text style={styles.appTagline}>{t('nav.powered_by')}</Text>
      </View>

      <DrawerItemList {...props} />

      <View style={styles.section}>
        {user ? (
          <TouchableOpacity onPress={() => props.navigation.navigate('user_profile')} activeOpacity={0.7}>
            <Text style={styles.userName}>{user.name} {user.surname}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.profileLink}>{t('auth.profile')} ›</Text>
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
        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.btn, locale === 'en' && styles.btnActive]}
            onPress={() => setLocale('en')}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnText, locale === 'en' && styles.btnTextActive]}>EN</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, locale === 'ka' && styles.btnActive]}
            onPress={() => setLocale('ka')}
            activeOpacity={0.7}
          >
            <Text style={[styles.btnText, locale === 'ka' && styles.btnTextActive]}>KA</Text>
          </TouchableOpacity>
        </View>
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  logoSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 4,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 16,
    marginBottom: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  greeting: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 2,
  },
  appName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  appTagline: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
    marginTop: 2,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  label: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  btnActive: {
    backgroundColor: COLORS.primary,
  },
  btnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  btnTextActive: {
    color: '#fff',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  profileLink: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 12,
  },
  loginBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
  },
  loginBtnText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
