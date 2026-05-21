import React, { useState } from 'react';
import api, { corsUrl } from '../utils/api';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';
import { gStyle } from '../assets/styles/styles';
import Preloader from '../components/Preloader';
import PageFooter from '../components/PageFooter';

export default function App() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [aboutUsData, setAboutUsData] = useState([]);
  const [isLoading, setLoading] = useState(true);

  React.useEffect(() => {
    setLoading(true);
    api
      .get(corsUrl(`https://climbing.ge/api/get_site_data/get_site_locale_data/${locale}`))
      .then(({ data }) => {
        setAboutUsData(data);
        setLoading(false);
      })
      .catch(() => {
        Alert.alert('ERROR!', 'Request failed');
        setLoading(false);
      });
  }, [locale]);

  if (isLoading) return <Preloader />;

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <Text style={gStyle.h1}>{t('article.about_us')}</Text>
      <Text>{aboutUsData.find(item => item.slug === 'guid_description')?.us_data}</Text>
      <PageFooter />
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
