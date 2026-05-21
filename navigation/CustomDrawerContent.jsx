import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';

export default function CustomDrawerContent(props) {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();

  return (
    <DrawerContentScrollView {...props}>
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
