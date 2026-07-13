import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as Network from 'expo-network';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';
import { queueAscent } from '../../utils/ascentQueue';
import { withRecaptchaRetry, isRecaptchaFailure } from '../../utils/recaptcha';
import { loadSummitData, loadSummitRoutesData } from '../../utils/offlineStorage';

const API = 'https://climbing.ge/api/summit';
// Matches the backend's own Haversine check (SummitPublicController::submit_ascent) exactly,
// so the client-side "verified" hint never disagrees with what actually gets saved.
const GPS_VERIFY_THRESHOLD_METERS = 20;

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function SubmitAscentScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { summit_id, url_title, title } = route.params;

  const ascentDate = new Date().toISOString().split('T')[0];

  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [comment, setComment] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [otherRoute, setOtherRoute] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [coords, setCoords] = useState(null);
  const [summitCoords, setSummitCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queued, setQueued] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  function applySummitCoords(summitData) {
    const { latitude, longitude } = summitData || {};
    if (latitude != null && longitude != null) {
      setSummitCoords({ latitude: Number(latitude), longitude: Number(longitude) });
    }
  }

  useEffect(() => {
    Network.getNetworkStateAsync().then(state => {
      // isInternetReachable does its own active probe and is unreliable (false
      // negatives on some carriers/DNS setups) — isConnected (link is up) is the
      // trustworthy signal. Actual reachability is proven by the request itself.
      setIsOffline(!state.isConnected);
    });
    api.get(`${API}/routes/${summit_id}`)
      .then(res => setRoutes(Array.isArray(res.data) ? res.data : []))
      .catch(async () => {
        // Offline (or the request failed) — fall back to what was cached by
        // the Offline Mode download, so route selection still works instead
        // of silently degrading to the free-text "other route" field.
        const cached = await loadSummitRoutesData(summit_id);
        if (Array.isArray(cached)) setRoutes(cached);
      });
    api.get(`${API}/show/${url_title}`)
      .then(res => applySummitCoords(res.data))
      .catch(async () => {
        // Same fallback for the summit's own coordinates — without these, GPS
        // verification can never show "verified" while offline even if the
        // climber is genuinely standing at the summit.
        const cached = await loadSummitData(url_title);
        if (cached) applySummitCoords(cached);
      });
    captureGPS();
  }, [summit_id]);

  const gpsVerified = !!(coords && summitCoords && haversineMeters(coords, summitCoords) <= GPS_VERIFY_THRESHOLD_METERS);

  async function pickImage(useCamera) {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('summit.camera_permission'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('summit.gallery_permission'));
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
      }
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert(t('auth.generic_error'));
    }
  }

  async function captureGPS() {
    setGpsLoading(true);
    setGpsError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsError(true);
        Alert.alert(t('summit.gps_denied'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch (err) {
      setGpsError(true);
      Alert.alert(
        t('summit.gps_error'),
        `[TEMP DEBUG] ${err?.code || ''} ${err?.message || String(err)}`,
      );
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit() {
    // Logged-in users don't see/edit these fields — the backend uses the
    // authenticated user's own record regardless of what's sent for them.
    if (!user && (!name.trim() || !surname.trim())) {
      Alert.alert(t('auth.fill_all_fields'));
      return;
    }

    setLoading(true);

    // Field names must match SummitPublicController::submit_ascent exactly:
    // user_latitude/user_longitude (not latitude/longitude), article_id (not route_id).
    // is_gps_validated and ascent_date are not read by the backend at all — it recomputes
    // GPS validity itself (Haversine vs the summit's stored coords) and always uses now().
    const ascentPayload = {
      name: name.trim(),
      surname: surname.trim(),
      email: email.trim() || undefined,
      comment: comment.trim() || undefined,
      user_latitude: coords?.latitude ?? undefined,
      user_longitude: coords?.longitude ?? undefined,
      article_id: selectedRoute?.id ?? undefined,
      other_route: otherRoute.trim() || undefined,
    };

    const netState = await Network.getNetworkStateAsync();
    // Same as above — only gate on isConnected. Genuine unreachability still gets
    // caught below (the !err.response branch) when the real request fails.
    if (!netState.isConnected) {
      // Previously had no try/catch here — if queueAscent threw for any
      // reason, setLoading(false) below would never run and the Submit
      // button would spin forever with no error and no queued screen.
      try {
        await queueAscent({ summit_id, url_title, image_uri: imageUri || undefined, ...ascentPayload });
        setQueued(true);
      } catch (err) {
        Alert.alert(
          '[TEMP DEBUG] queueAscent failed',
          `netState: ${JSON.stringify(netState)}\n${err?.message || String(err)}`,
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await withRecaptchaRetry('make_ascent', async (recaptcha_token) => {
        const payloadWithCaptcha = { ...ascentPayload, recaptcha_token };
        if (imageUri) {
          const fd = new FormData();
          Object.entries(payloadWithCaptcha).forEach(([k, v]) => {
            if (v == null) return;
            fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
          });
          const ext = (imageUri.split('.').pop() || 'jpg').toLowerCase();
          // Field name must be "photo" — the backend reads $request->file('photo').
          fd.append('photo', { uri: imageUri, name: `ascent.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
          // Do not set Content-Type manually — RN/axios must generate the multipart boundary itself.
          // Longer timeout than the shared default (20s) — a full-resolution,
          // uncropped photo can legitimately take longer to upload on a slow
          // connection; the default was cutting uploads off as a false "network error".
          return api.post(`${API}/ascent/${summit_id}`, fd, { timeout: 60000 });
        }
        return api.post(`${API}/ascent/${summit_id}`, payloadWithCaptcha);
      });
      Alert.alert(
        '[TEMP DEBUG] submit response',
        `status: ${res.status}\n${JSON.stringify(res.data)}`,
        [{ text: 'OK', onPress: () => setSuccess(true) }],
      );
    } catch (err) {
      if (!err.isAxiosError) {
        // Not an HTTP error at all — reCAPTCHA token generation itself failed
        // (WebView not ready, timed out, etc.), not a network or server issue.
        Alert.alert(
          t('summit.submit_error'),
          `${t('auth.generic_error')}\n\n[TEMP DEBUG] recaptcha failed: ${err?.message}`,
        );
      } else if (!err.response) {
        // Genuine network-level failure (request never reached the server) — queue for later
        Alert.alert(
          '[TEMP DEBUG] queuing offline',
          `message: ${err?.message}\ncode: ${err?.code}`,
          [{
            text: 'OK',
            onPress: async () => {
              await queueAscent({ summit_id, url_title, image_uri: imageUri || undefined, ...ascentPayload });
              setQueued(true);
            },
          }],
        );
        return;
      } else if (isRecaptchaFailure(err)) {
        // Both retry attempts still scored too low. Rather than a dead end, queue
        // it like an offline submission — background sync (on app foreground /
        // reconnect) will keep retrying with fresh tokens until one passes.
        Alert.alert(
          '[TEMP DEBUG] queuing — recaptcha score',
          `${err.response.data?.message}\n\nQueued for automatic retry.`,
          [{
            text: 'OK',
            onPress: async () => {
              await queueAscent({ summit_id, url_title, image_uri: imageUri || undefined, ...ascentPayload });
              setQueued(true);
            },
          }],
        );
        return;
      } else {
        const fieldErrors = err.response.data?.errors;
        const msg = fieldErrors
          ? Object.values(fieldErrors).flat().join('\n')
          : err.response.data?.message ?? t('auth.generic_error');
        Alert.alert(
          t('summit.submit_error'),
          `${msg}\n\n[TEMP DEBUG] status: ${err.response.status}\n${JSON.stringify(err.response.data)}`,
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (queued) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>📥</Text>
        <Text style={styles.successTitle}>{t('summit.queued_title')}</Text>
        <Text style={styles.successSub}>{t('summit.queued_message')}</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>{t('summit.done')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>{t('summit.ascent_recorded')}</Text>
        <Text style={styles.successSub}>{title}</Text>
        <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <Text style={styles.doneBtnText}>{t('summit.done')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>📵 {t('summit.offline_banner')}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.summitBanner}>
          <Text style={styles.summitBannerIcon}>🏔️</Text>
          <Text style={styles.summitBannerTitle}>{title}</Text>
        </View>

        <Text style={styles.sectionTitle}>{t('summit.climber_info')}</Text>
        {user ? (
          // Backend already ignores name/surname/email from the request body
          // for authenticated submissions and uses the auth user's own record
          // instead — so these fields are redundant to show/edit when logged in.
          <View style={styles.loggedInInfoBox}>
            <Text style={styles.loggedInInfoText}>
              {t('summit.submitting_as')} {user.name} {user.surname} ({user.email})
            </Text>
          </View>
        ) : (
          <>
            <TextInput style={styles.input} placeholder={t('auth.name')} placeholderTextColor="#aaa" value={name} onChangeText={setName} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder={t('auth.surname')} placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} autoCapitalize="words" />
            <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </>
        )}

        <Text style={styles.sectionTitle}>{t('summit.ascent_details')}</Text>
        <View style={styles.dateDisplay}>
          <Text style={styles.dateDisplayText}>📅 {ascentDate}</Text>
        </View>

        {routes.length > 0 ? (
          <>
            <Text style={styles.label}>{t('summit.route')}</Text>
            <View style={styles.routeList}>
              {routes.map(r => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.routeOption, selectedRoute?.id === r.id && styles.routeOptionActive]}
                  onPress={() => setSelectedRoute(selectedRoute?.id === r.id ? null : r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.routeOptionText, selectedRoute?.id === r.id && styles.routeOptionTextActive]}>
                    {r.name ?? r.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : (
          <TextInput
            style={styles.input}
            placeholder={t('summit.other_route')}
            placeholderTextColor="#aaa"
            value={otherRoute}
            onChangeText={setOtherRoute}
          />
        )}

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder={t('summit.comment')}
          placeholderTextColor="#aaa"
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={styles.sectionTitle}>{t('summit.gps')}</Text>
        <TouchableOpacity
          style={[
            styles.gpsBtn,
            !!coords && styles.gpsBtnActive,
            !!coords && !gpsVerified && styles.gpsBtnWarn,
          ]}
          onPress={captureGPS}
          disabled={gpsLoading}
          activeOpacity={0.8}
        >
          {gpsLoading
            ? <ActivityIndicator color="#279fbb" />
            : <Text style={[
                styles.gpsBtnText,
                !!coords && styles.gpsBtnTextActive,
                !!coords && !gpsVerified && styles.gpsBtnTextWarn,
              ]}>
                {coords
                  ? `📍 ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                  : `📍 ${t('summit.capture_gps')}`}
              </Text>
          }
        </TouchableOpacity>
        {!!coords && (
          <Text style={[styles.gpsStatus, gpsVerified ? styles.gpsStatusOk : styles.gpsStatusWarn]}>
            {gpsVerified ? `✓ ${t('summit.gps_verified')}` : `⚠ ${t('summit.gps_not_verified')}`}
          </Text>
        )}
        {!gpsLoading && (gpsError || (!!coords && !gpsVerified)) && (
          <TouchableOpacity style={styles.gpsRetryBtn} onPress={captureGPS} activeOpacity={0.7}>
            <Text style={styles.gpsRetryText}>🔄 {t('summit.retry_gps')}</Text>
          </TouchableOpacity>
        )}

        {/* Photo */}
        <Text style={styles.sectionTitle}>{t('summit.photo')}</Text>
        {imageUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => setImageUri(null)} activeOpacity={0.8}>
              <Text style={styles.photoRemoveBtnText}>✕ {t('summit.remove_photo')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoBtnRow}>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(true)} activeOpacity={0.8}>
              <Text style={styles.photoBtnText}>📷 {t('summit.take_photo')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.photoBtn} onPress={() => pickImage(false)} activeOpacity={0.8}>
              <Text style={styles.photoBtnText}>🖼️ {t('summit.choose_from_gallery')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitBtnText}>{t('summit.submit_ascent')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Extra bottom room so the Submit button never ends up under the floating
  // "Support Us" button (rendered globally in App.js, bottom-right).
  container: { padding: 20, paddingBottom: 120, backgroundColor: '#fff', flexGrow: 1 },
  offlineBanner: {
    backgroundColor: '#f39c12',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  offlineBannerText: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  successIcon: { fontSize: 72, marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', color: '#279fbb', textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 36 },
  doneBtn: { backgroundColor: '#279fbb', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  summitBanner: {
    backgroundColor: '#e8f6fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  summitBannerIcon: { fontSize: 28 },
  summitBannerTitle: { fontSize: 17, fontWeight: '700', color: '#279fbb', flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#279fbb', marginBottom: 10, marginTop: 4 },
  label: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '600' },
  loggedInInfoBox: { backgroundColor: '#e8f6fa', borderRadius: 10, padding: 12, marginBottom: 12 },
  loggedInInfoText: { fontSize: 13, color: '#1a6f85' },
  input: {
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
    color: '#222',
  },
  textArea: { height: 100, paddingTop: 12 },
  routeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  routeOption: {
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  routeOptionActive: { backgroundColor: '#279fbb' },
  routeOptionText: { fontSize: 13, color: '#279fbb', fontWeight: '600' },
  routeOptionTextActive: { color: '#fff' },
  gpsBtn: {
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20,
  },
  gpsBtnActive: { backgroundColor: '#e8f6fa', borderColor: '#1a8aa8' },
  gpsBtnWarn: { backgroundColor: '#fdf3e3', borderColor: '#f39c12' },
  gpsBtnText: { fontSize: 14, color: '#279fbb', fontWeight: '600' },
  gpsBtnTextActive: { color: '#1a8aa8' },
  gpsBtnTextWarn: { color: '#b9770e' },
  gpsStatus: { fontSize: 12, fontWeight: '600', marginTop: -14, marginBottom: 6, textAlign: 'center' },
  gpsStatusOk: { color: '#1e8449' },
  gpsStatusWarn: { color: '#b9770e' },
  gpsRetryBtn: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 10, marginBottom: 20 },
  gpsRetryText: { fontSize: 13, color: '#279fbb', fontWeight: '700' },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoBtnText: { fontSize: 13, color: '#279fbb', fontWeight: '600' },
  photoPreviewWrap: { marginBottom: 20 },
  // resizeMode="contain" can letterbox (image aspect ratio rarely matches the
  // box exactly) — a neutral background makes that look intentional.
  photoPreview: { width: '100%', height: 240, borderRadius: 10, marginBottom: 8, backgroundColor: '#f4f6f8' },
  photoRemoveBtn: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  photoRemoveBtnText: { color: '#e74c3c', fontSize: 13, fontWeight: '600' },
  dateDisplay: {
    backgroundColor: '#e8f6fa',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dateDisplayText: { fontSize: 15, color: '#279fbb', fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
