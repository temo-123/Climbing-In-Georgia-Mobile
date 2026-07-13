import React, { useState, useCallback, useEffect } from 'react';
import api, { corsUrl } from '../utils/api';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';
import { gStyle } from '../assets/styles/styles';
import Preloader from '../components/Preloader';
import PageFooter from '../components/PageFooter';

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const [aboutUsData, setAboutUsData] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    setHasError(false);
    api
      .get(corsUrl(`https://climbing.ge/api/get_site_data/get_site_locale_data/${locale}`))
      .then(({ data }) => {
        setAboutUsData(data);
        setLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setLoading(false);
      });
  }, [locale]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) return <Preloader />;

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{t('error.request_failed')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData} activeOpacity={0.8}>
          <Text style={styles.retryBtnText}>{t('error.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const description = aboutUsData.find(item => item.slug === 'guid_description')?.us_data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={gStyle.h1}>{t('article.about_us')}</Text>
      {!!description && (
        <RenderHtml contentWidth={width - 32} source={{ html: description }} />
      )}
      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 28,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});
