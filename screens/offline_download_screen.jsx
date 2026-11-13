import React, { useState, useEffect, useRef } from 'react';
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
import OfflineDataStatus from '../components/user/OfflineDataStatus';
import LoginPrompt from '../components/auth/LoginPrompt';
import Button from '../components/ui/Button';
import { useAuth, useAccount } from '../utils/AuthContext';
import { reportOfflineDownload } from '../utils/offlineAccountSync';
import { faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS } from '../assets/styles/styles';

// Offline mode needs an account: guests get login / register instead of the
// download button. After a successful download the time is saved on the
// account (users.use_offline_data_on_mobile, utils/offlineAccountSync.js).
// `route.params.autoStart` (a timestamp) starts the download right away — sent
// after login when the account has a download but this phone doesn't.
export default function OfflineDownloadScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, refreshUser } = useAuth();
  const { canAct } = useAccount();
  const [lastDownload, setLastDownload] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [currentLabel, setCurrentLabel] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    getLastDownloadTime().then(t => setLastDownload(t));
  }, []);

  const autoStart = route?.params?.autoStart;
  const startedFor = useRef(null);
  useEffect(() => {
    if (!autoStart || !user || startedFor.current === autoStart || isDownloading) return;
    startedFor.current = autoStart;
    handleDownload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function handleDownload() {
    if (!user) return;
    setIsDownloading(true);
    setCurrentLabel(t('offline_screen.starting'));
    setResult(null);

    const res = await downloadAllData(locale, p => setCurrentLabel(p.currentLabel));

    setIsDownloading(false);
    setResult(res);
    if (res.completed > 0 && canAct) {
      // Under-age accounts can't write to the account — they keep the local copy only.
      reportOfflineDownload().then((ok) => ok && refreshUser().catch(() => {}));
    }
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
        <FontAwesomeIcon icon={faCloudArrowDown} size={58} color={COLORS.primary} />
      </View>

      <Text style={styles.title}>{t('offline_screen.title')}</Text>
      <Text style={styles.subtitle}>{t('offline_screen.subtitle')}</Text>

      <View style={styles.infoBox}>
        <FontAwesomeIcon
          icon={lastDownload ? faDatabase : faWifi}
          size={16}
          color={lastDownload ? COLORS.primary : '#999'}
        />
        <Text style={[styles.infoText, !lastDownload && styles.infoTextMuted]}>
          {lastDownload
            ? t('offline_screen.last_downloaded', { date: formatDate(lastDownload) })
            : t('offline_screen.no_data')}
        </Text>
      </View>

      {!user ? (
        <View style={styles.loginBox}>
          <LoginPrompt message={t('account.offline_login_required')} onLogin={() => navigation.navigate('login')} />
          <Button
            variant="outline"
            icon={faUserPlus}
            title={t('auth.register')}
            onPress={() => navigation.navigate('register')}
            style={styles.registerBtn}
          />
        </View>
      ) : (
        <>
          <OfflineDataStatus
            style={styles.prefBox}
            hideDownload
            onCleared={() => { setLastDownload(null); setResult(null); }}
          />

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
        </>
      )}

      {isDownloading && (
        <View style={styles.progressBox}>
          <ActivityIndicator color={COLORS.primary} style={styles.progressSpinner} />
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

      {/* Raw download errors — dev builds only, never shown in release. */}
      {__DEV__ && result && !isDownloading && result.debugErrors?.length > 0 && (
        <View style={styles.debugBox}>
          <Text style={styles.debugTitle}>{result.debugErrors.length} error(s):</Text>
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
      <PageFooter bleed={24} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, alignItems: 'center' },
  iconBox: {
    marginTop: 16,
    marginBottom: 16,
    padding: 28,
    backgroundColor: COLORS.primarySoft,
    borderRadius: 100,
  },
  title: {
    fontSize: 30,
    fontFamily: FONTS.displayBold,
    color: COLORS.ink,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15, fontFamily: FONTS.body,
    color: COLORS.stone,
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
  infoText: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.primary, flex: 1 },
  infoTextMuted: { color: COLORS.muted },
  loginBox: { alignSelf: 'stretch', marginBottom: 20 },
  registerBtn: { marginTop: 10 },
  prefBox: {
    alignSelf: 'stretch', backgroundColor: COLORS.surface, borderRadius: 12, borderWidth: 1,
    borderColor: COLORS.line, padding: 14, marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 17, fontFamily: FONTS.bodyBold, letterSpacing: 0.3 },
  progressBox: { width: '100%', marginBottom: 20, alignItems: 'center', gap: 10 },
  progressSpinner: { marginBottom: 4 },
  progressLabel: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone, textAlign: 'center' },
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
  resultText: { fontSize: 14, fontFamily: FONTS.body, color: '#2d7a4f', flex: 1, lineHeight: 20 },
  resultTextError: { color: COLORS.danger },
  debugBox: {
    width: '100%',
    backgroundColor: '#fdf3e3',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  debugTitle: { fontSize: 12, fontFamily: FONTS.bodyBold, color: '#7a5c00', marginBottom: 6 },
  debugText: { fontSize: 11, fontFamily: FONTS.body, color: '#7a5c00', marginBottom: 8, lineHeight: 16 },
  tipBox: {
    width: '100%',
    backgroundColor: COLORS.chalk,
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
    gap: 6,
  },
  tipTitle: { fontSize: 15, fontFamily: FONTS.bodyBold, color: COLORS.ink, marginBottom: 6 },
  tipText: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone, lineHeight: 20 },
});
