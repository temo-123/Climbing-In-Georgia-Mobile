import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';

export default function CustomDrawerContent(props) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.logoSection}>
        <Image
          source={require('../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Climbing In Georgia</Text>
        <Text style={styles.appTagline}>climbing.ge</Text>
      </View>
      <DrawerItemList {...props} />
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
  appName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  appTagline: {
    fontSize: 12,
    color: '#279fbb',
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
    borderColor: '#279fbb',
  },
  btnActive: {
    backgroundColor: '#279fbb',
  },
  btnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#279fbb',
  },
  btnTextActive: {
    color: '#fff',
  },
});
