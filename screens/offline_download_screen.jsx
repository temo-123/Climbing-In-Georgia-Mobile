import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faCloudArrowDown, faCircleCheck,
  faWifi, faDatabase, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../utils/LocaleContext';
import { downloadAllData, getLastDownloadTime } from '../utils/offlineStorage';
import PageFooter from '../components/PageFooter';

export default function OfflineDownloadScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [lastDownload, setLastDownload] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    getLastDownloadTime().then(t => setLastDownload(t));
  }, []);

  async function handleDownload() {
    setIsDownloading(true);
    setCurrentLabel(t('offline_screen.starting'));
    setResult(null);

    const res = await downloadAllData(locale, p => setCurrentLabel(p.currentLabel));

    setIsDownloading(false);
    setResult(res);
    if (res.completed > 0) {
      getLastDownloadTime().then(t => setLastDownload(t));
    }
  }

  function formatDate(iso) {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.iconBox}>
        <FontAwesomeIcon icon={faCloudArrowDown} size={58} color="#279fbb" />
      </View>

      <Text style={styles.title}>{t('offline_screen.title')}</Text>
      <Text style={styles.subtitle}>{t('offline_screen.subtitle')}</Text>

      <View style={styles.infoBox}>
        <FontAwesomeIcon
          icon={lastDownload ? faDatabase : faWifi}
          size={16}
          color={lastDownload ? '#279fbb' : '#999'}
        />
        <Text style={[styles.infoText, !lastDownload && styles.infoTextMuted]}>
          {lastDownload
            ? t('offline_screen.last_downloaded', { date: formatDate(lastDownload) })
            : t('offline_screen.no_data')}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, isDownloading && styles.buttonDisabled]}
        onPress={handleDownload}
        disabled={isDownloading}
        activeOpacity={0.8}
      >
        {isDownloading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>{t('offline_screen.download_btn')}</Text>
        }
      </TouchableOpacity>

      {isDownloading && (
        <View style={styles.progressBox}>
          <ActivityIndicator color="#279fbb" style={styles.progressSpinner} />
          <Text style={styles.progressLabel}>{currentLabel}</Text>
        </View>
      )}

      {result && !isDownloading && (
        <View style={[
          styles.resultBox,
          result.completed === 0 ? styles.resultError : styles.resultSuccess,
        ]}>
          <FontAwesomeIcon
            icon={result.completed === 0 ? faTriangleExclamation : faCircleCheck}
            size={20}
            color={result.completed === 0 ? '#c0392b' : '#2d7a4f'}
          />
          <Text style={[
            styles.resultText,
            result.completed === 0 && styles.resultTextError,
          ]}>
            {result.completed === 0
              ? t('offline_screen.download_failed')
              : t('offline_screen.download_success', {
                  lists: result.listCompleted,
                  articles: result.articleCompleted,
                  sectors: result.sectorsCompleted,
                  summits: result.summitsCompleted,
                  images: result.imagesCompleted,
                })
                + (result.failed > 0
                  ? t('offline_screen.download_failed_partial', { failed: result.failed })
                  : '')}
          </Text>
        </View>
      )}

      {/* [TEMP DEBUG] remove once the summit download failure is diagnosed */}
      {result && !isDownloading && result.debugErrors?.length > 0 && (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>[TEMP DEBUG] {result.debugErrors.length} error(s):</Text>
          {result.debugErrors.map((e, i) => (
            <Text key={i} style={styles.debugText}>
              {e.phase} / {e.label}{'\n'}
              url: {e.url}{'\n'}
              status: {String(e.status)}  message: {e.message}{'\n'}
              data: {JSON.stringify(e.data)}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>{t('offline_screen.how_title')}</Text>
        <Text style={styles.tipText}>{t('offline_screen.how_1')}</Text>
        <Text style={styles.tipText}>{t('offline_screen.how_2')}</Text>
        <Text style={styles.tipText}>{t('offline_screen.how_3')}</Text>
      </View>
      <PageFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  iconBox: {
    marginTop: 16,
    marginBottom: 16,
    padding: 28,
    backgroundColor: '#e8f6fa',
    borderRadius: 100,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0f9fc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
    width: '100%',
  },
  infoText: { fontSize: 14, color: '#279fbb', flex: 1 },
  infoTextMuted: { color: '#999' },
  button: {
    backgroundColor: '#279fbb',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 0.3 },
  progressBox: { width: '100%', marginBottom: 20, alignItems: 'center', gap: 10 },
  progressSpinner: { marginBottom: 4 },
  progressLabel: { fontSize: 13, color: '#555', textAlign: 'center' },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  resultSuccess: { backgroundColor: '#e6f6ec' },
  resultError: { backgroundColor: '#fde8e8' },
  resultText: { fontSize: 14, color: '#2d7a4f', flex: 1, lineHeight: 20 },
  resultTextError: { color: '#c0392b' },
  debugBox: {
    width: '100%',
    backgroundColor: '#fdf3e3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  debugTitle: { fontSize: 12, fontWeight: 'bold', color: '#7a5c00', marginBottom: 6 },
  debugText: { fontSize: 11, color: '#7a5c00', marginBottom: 8, lineHeight: 16 },
  tipBox: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    gap: 6,
  },
  tipTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 6 },
  tipText: { fontSize: 13, color: '#555', lineHeight: 20 },
});
