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
import { downloadAllData, getLastDownloadTime } from '../utils/offlineStorage';
import PageFooter from '../components/PageFooter';

export default function OfflineDownloadScreen() {
  const [lastDownload, setLastDownload] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    getLastDownloadTime().then(t => setLastDownload(t));
  }, []);

  async function handleDownload() {
    setIsDownloading(true);
    setCurrentLabel('Starting...');
    setResult(null);

    const res = await downloadAllData(p => setCurrentLabel(p.currentLabel));

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

      <Text style={styles.title}>Offline Mode</Text>
      <Text style={styles.subtitle}>
        Download all climbing data so you can browse the app without an internet connection.
      </Text>

      <View style={styles.infoBox}>
        <FontAwesomeIcon
          icon={lastDownload ? faDatabase : faWifi}
          size={16}
          color={lastDownload ? '#279fbb' : '#999'}
        />
        <Text style={[styles.infoText, !lastDownload && styles.infoTextMuted]}>
          {lastDownload
            ? `Last downloaded: ${formatDate(lastDownload)}`
            : 'No data downloaded yet'}
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
          : <Text style={styles.buttonText}>Download All Data</Text>
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
              ? 'Download failed. Please check your internet connection.'
              : `Saved ${result.listCompleted} lists, ${result.articleCompleted} articles, ${result.sectorsCompleted} sectors, ${result.imagesCompleted} images.`
                + (result.failed > 0 ? ` (${result.failed} failed — try again)` : '')}
          </Text>
        </View>
      )}

      <View style={styles.tipBox}>
        <Text style={styles.tipTitle}>How it works</Text>
        <Text style={styles.tipText}>• Tap the button while online to save data to your device</Text>
        <Text style={styles.tipText}>• When offline, all lists, articles, and images will use the cached data automatically</Text>
        <Text style={styles.tipText}>• Re-download anytime to get the latest content</Text>
      </View>
      <PageFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    alignItems: 'center',
  },
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
  infoText: {
    fontSize: 14,
    color: '#279fbb',
    flex: 1,
  },
  infoTextMuted: {
    color: '#999',
  },
  button: {
    backgroundColor: '#279fbb',
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  progressBox: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  progressSpinner: {
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  resultSuccess: {
    backgroundColor: '#e6f6ec',
  },
  resultError: {
    backgroundColor: '#fde8e8',
  },
  resultText: {
    fontSize: 14,
    color: '#2d7a4f',
    flex: 1,
    lineHeight: 20,
  },
  resultTextError: {
    color: '#c0392b',
  },
  tipBox: {
    width: '100%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    gap: 6,
  },
  tipTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});
