import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from './i18n';

const LOCALE_KEY = '@app_locale';

const LocaleContext = createContext({ locale: 'en', setLocale: () => {} });

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(LOCALE_KEY).then(saved => {
      if (saved === 'ka' || saved === 'en') {
        setLocaleState(saved);
        i18n.changeLanguage(saved);
      }
      setReady(true);
    });
  }, []);

  async function setLocale(lang) {
    setLocaleState(lang);
    i18n.changeLanguage(lang);
    AsyncStorage.setItem(LOCALE_KEY, lang);
  }

  if (!ready) return null;

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
