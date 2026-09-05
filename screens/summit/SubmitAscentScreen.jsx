import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert, Image,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuth } from '../../utils/AuthContext';
import { useNetwork } from '../../utils/NetworkContext';
import api, { corsUrl, API_BASE_URL } from '../../utils/api';
import { queueAscent, describeError } from '../../utils/ascentQueue';
import { withRecaptchaRetry, isRecaptchaFailure } from '../../utils/recaptcha';
import { loadSummitData, loadSummitRoutesData } from '../../utils/offlineStorage';
import { persistPickedPhoto, resolvePhotoUri, deletePersistedPhoto } from '../../utils/imageCompress';
import { COLORS } from '../../assets/styles/styles';

const API = `${API_BASE_URL}/summit`;
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
  // Shared connectivity state rather than a one-shot read at mount, so the
  // offline banner disappears the moment signal actually comes back.
  const { isOffline } = useNetwork();
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
  const [queuedReason, setQueuedReason] = useState('network');
  const [queuedDetail, setQueuedDetail] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [compressingPhoto, setCompressingPhoto] = useState(false);
  const [photoDropped, setPhotoDropped] = useState(false);
  const [photoDropError, setPhotoDropError] = useState('');
  const [photoDebugInfo, setPhotoDebugInfo] = useState('');

  function applySummitCoords(summitData) {
    const { latitude, longitude } = summitData || {};
    if (latitude != null && longitude != null) {
      setSummitCoords({ latitude: Number(latitude), longitude: Number(longitude) });
    }
  }

  // AuthContext restores the cached user from AsyncStorage asynchronously, so
  // on a cold start this screen can mount before `user` exists and the initial
  // useState values above stay empty. Back-fill them once the account details
  // arrive — only into still-empty fields, so a guest's own typing is never
  // overwritten. This is what guarantees an ascent queued offline carries
  // valid climber identity to the server when it finally syncs.
  useEffect(() => {
    if (!user) return;
    setName(prev => prev || user.name || '');
    setSurname(prev => prev || user.surname || '');
    setEmail(prev => prev || user.email || '');
  }, [user?.id, user?.name, user?.surname, user?.email]);

  useEffect(() => {
    api.get(corsUrl(`${API}/routes/${summit_id}`))
      .then(res => setRoutes(Array.isArray(res.data) ? res.data : []))
      .catch(async () => {
        // Offline (or the request failed) — fall back to what was cached by
        // the Offline Mode download, so route selection still works instead
        // of silently degrading to the free-text "other route" field.
        const cached = await loadSummitRoutesData(summit_id);
        if (Array.isArray(cached)) setRoutes(cached);
      });
    api.get(corsUrl(`${API}/show/${url_title}`))
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
        setCompressingPhoto(true);
        try {
          // Full-resolution phone photos can be several MB — compress down to
          // the backend's comfortable upload size before ever attaching it,
          // and persist the result outside the OS-managed cache (see
          // persistPickedPhoto's own comment) so the file is still there
          // whether it uploads immediately or sits in the offline queue.
          const persistedUri = await persistPickedPhoto(result.assets[0].uri);
          setImageUri(persistedUri);
        } finally {
          setCompressingPhoto(false);
        }
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
    } catch {
      setGpsError(true);
      Alert.alert(t('summit.gps_error'));
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
    setPhotoDropped(false);
    setPhotoDropError('');
    setPhotoDebugInfo('');

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

    // reason is stored on the queued item and drives the "Ascent Saved…"
    // screen's wording — a device that's genuinely online but whose
    // submission couldn't be *verified* (reCAPTCHA) must not be told
    // "we'll upload when you go online", since that's simply false and is
    // exactly what made a working queue look like a bug: an online
    // submission ending up on a screen that talks about being offline.
    async function queueAndFinish(reason, err) {
      // Store the real underlying error (same describeError() logic the
      // pending-ascents list uses for a failed sync) right at queue time —
      // otherwise a freshly-queued item shows no detail at all until its
      // *next* sync attempt happens to fail too, which is exactly the gap
      // that made "why did this get saved locally?" impossible to answer
      // from the app alone.
      const detail = describeError(err);
      try {
        await queueAscent({
          summit_id, url_title, summit_title: title,
          image_uri: imageUri || undefined, queue_reason: reason,
          lastError: detail, lastErrorAt: new Date().toISOString(),
          ...ascentPayload,
        });
        setQueuedReason(reason);
        setQueuedDetail(detail);
        setQueued(true);
      } catch {
        Alert.alert(t('auth.generic_error'));
      }
    }

    // `isOffline` here comes from the live NetworkContext listener, not a
    // one-off read taken when this screen happened to mount — so unlike the
    // stale mount-time snapshot this screen used to gate on (see the removed
    // isOffline state above), it reflects the connection state at the actual
    // moment "Submit" was pressed. Trust it to skip straight to the queue:
    // the alternative is a genuinely offline climber waiting out up to 15
    // seconds of a doomed reCAPTCHA WebView round trip (no signal at all, so
    // the page can never load) before landing on the same "saved offline"
    // screen anyway — which read as "ascent registration doesn't work
    // offline" even though it eventually queued correctly.
    if (isOffline) {
      await queueAndFinish('network', new Error(t('summit.no_connection_detail')));
      setLoading(false);
      return;
    }

    // Not reporting offline — attempt the real submission. isConnected can
    // still be a false positive (link up, route to the internet actually
    // broken) — a genuine failure below is what catches that case and queues
    // it just the same, under the same 'network' reason.
    // Resolved once up front (not read fresh inside the retry callback below)
    // so a photo whose backing file has genuinely gone missing degrades to
    // "submit without it" consistently across every recaptcha retry attempt,
    // matching the same check the background queue's uploadOne() runs before
    // its own multipart build — see persistPickedPhoto's comment for why this
    // file can go missing even on this immediate (non-queued) path.
    const photoUri = await resolvePhotoUri(imageUri);

    // TEMP DIAGNOSTIC — unconditional, shown even on a plain success, since
    // every failure mode tried so far (transport error, backend conversion
    // bug) has been ruled out one at a time while the photo still never
    // makes it into the ascent record. This answers the one question none
    // of those ruled out: did the app even believe it had a photo to send
    // in the first place. Remove once resolved.
    const rawInfo = imageUri ? await FileSystem.getInfoAsync(imageUri, { size: true }).catch(e => ({ error: e.message })) : null;
    setPhotoDebugInfo(
      `imageUri set: ${!!imageUri} | resolvePhotoUri: ${photoUri ? 'ok' : 'NULL (file missing)'} | `
      + `raw file exists: ${rawInfo ? (rawInfo.exists ?? `err: ${rawInfo.error}`) : 'n/a'} | `
      + `raw size: ${rawInfo?.size ? Math.round(rawInfo.size / 1024) + 'KB' : 'n/a'}`
    );

    try {
      await withRecaptchaRetry('make_ascent', async (recaptcha_token) => {
        const payloadWithCaptcha = { ...ascentPayload, recaptcha_token };
        if (!photoUri) {
          return api.post(corsUrl(`${API}/ascent/${summit_id}`), payloadWithCaptcha);
        }

        const fd = new FormData();
        Object.entries(payloadWithCaptcha).forEach(([k, v]) => {
          if (v == null) return;
          fd.append(k, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
        });
        const ext = (photoUri.split('.').pop() || 'jpg').toLowerCase();
        // Field name must be "photo" — the backend reads $request->file('photo').
        fd.append('photo', { uri: photoUri, name: `ascent.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
        // Do not set Content-Type manually — RN/axios must generate the multipart boundary itself.
        // Longer timeout than the shared default (20s) — a full-resolution,
        // uncropped photo can legitimately take longer to upload on a slow
        // connection; the default was cutting uploads off as a false "network error".
        try {
          return await api.post(corsUrl(`${API}/ascent/${summit_id}`), fd, { timeout: 60000 });
        } catch (photoErr) {
          if (photoErr?.isAxiosError && !photoErr.response) {
            // The *photo attachment itself* is what's failing at the
            // transport level (too large for a size limit somewhere in the
            // path, a rejected/malformed multipart part, etc) — every retry
            // of the same request fails identically, so this is not a
            // reconnect-timing issue uploadWithRetry-style backoff can fix.
            // Rather than leave an otherwise-valid ascent permanently stuck
            // over its attachment, fall back to submitting without the
            // photo so the climber's ascent itself is never lost.
            // TEMP DIAGNOSTIC — this fallback was silently swallowing the
            // real cause of the photo upload failure (the ascent then
            // "succeeds" with no photo and nothing in the backend log,
            // since the request never actually reached the server). Surface
            // it directly on the success screen — a Metro/logcat console
            // isn't something the person testing this on-device can always
            // get to — instead of vanishing. Remove once the transport
            // failure itself is understood and fixed.
            setPhotoDropped(true);
            // axios's XHR adapter always reports plain "Network Error" for any
            // connection-level failure — the *real* native message (from
            // RN's XMLHttpRequest.js: `this._response = error` set straight
            // from the native networking module, e.g. actual OkHttp/iOS
            // NSURLSession error text) never reaches the "error" Event object
            // it dispatches (a bare `new Event('error')` with no `.message`),
            // so axios's `event.message` check always misses it and falls
            // back to the generic string. The raw XMLHttpRequest instance is
            // still attached as `err.request` though, and *its*
            // responseText/_response holds that real native string — pull it
            // out directly instead of accepting the generic wrapper.
            const rawXhr = photoErr.request;
            const nativeDetail = rawXhr?.responseText || rawXhr?._response || rawXhr?.response || '(none)';
            FileSystem.getInfoAsync(photoUri, { size: true }).then((info) => {
              const kb = info.exists && info.size ? `${Math.round(info.size / 1024)}KB` : 'unknown size';
              setPhotoDropError(`${photoErr.name || 'Error'}: ${photoErr.message || 'unknown'} (code: ${photoErr.code || 'none'}, file: ${kb}) | native: ${nativeDetail}`);
            }).catch(() => {
              setPhotoDropError(`${photoErr.name || 'Error'}: ${photoErr.message || 'unknown'} (code: ${photoErr.code || 'none'}) | native: ${nativeDetail}`);
            });
            return api.post(corsUrl(`${API}/ascent/${summit_id}`), payloadWithCaptcha);
          }
          throw photoErr;
        }
      });
      if (photoUri) deletePersistedPhoto(photoUri);
      setSuccess(true);
    } catch (err) {
      if (!err.isAxiosError) {
        // Not an HTTP error at all — reCAPTCHA token generation itself failed
        // (WebView not ready, page failed to load, timed out). From the
        // user's perspective this is just as "couldn't reach the server" as a
        // network error, so queue it the same way instead of a dead-end
        // alert that requires noticing the failure and retrying by hand.
        await queueAndFinish('recaptcha_unavailable', err);
      } else if (!err.response) {
        // Genuine network-level failure (request never reached the server) —
        // queue silently for automatic retry instead of surfacing the raw
        // axios error ("Network Error") as if something were broken.
        await queueAndFinish('network', err);
      } else if (isRecaptchaFailure(err)) {
        // Reached the server, but reCAPTCHA verification itself failed (both
        // retry attempts scored too low, or a token/secret mismatch on the
        // backend) — the device is online, this is not a connectivity issue.
        // Still queue it for automatic retry rather than a dead end, but
        // under a distinct reason so the UI doesn't lie about being offline.
        await queueAndFinish('recaptcha_score', err);
      } else {
        const fieldErrors = err.response.data?.errors;
        const msg = fieldErrors
          ? Object.values(fieldErrors).flat().join('\n')
          : err.response.data?.message ?? t('auth.generic_error');
        Alert.alert(t('summit.submit_error'), msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (queued) {
    // recaptcha_score means the request reached the server just fine — the
    // device is online, only verification failed — so the copy must not
    // claim this was saved because of a connectivity problem.
    const isVerificationIssue = queuedReason === 'recaptcha_score';
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>{isVerificationIssue ? '🔄' : '📥'}</Text>
        <Text style={styles.successTitle}>
          {t(isVerificationIssue ? 'summit.queued_title_verification' : 'summit.queued_title')}
        </Text>
        <Text style={styles.successSub}>
          {t(isVerificationIssue ? 'summit.queued_message_verification' : 'summit.queued_message')}
        </Text>
        {!!queuedDetail && (
          <Text style={styles.queuedDetailText}>{t('summit.queued_reason_detail', { detail: queuedDetail })}</Text>
        )}
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
        {photoDropped && (
          <>
            <Text style={styles.queuedDetailText}>{t('summit.photo_upload_failed_note')}</Text>
            {/* TEMP DIAGNOSTIC — remove once the transport failure is understood and fixed. */}
            {!!photoDropError && <Text selectable style={styles.queuedDetailText}>{photoDropError}</Text>}
          </>
        )}
        {/* TEMP DIAGNOSTIC — shown unconditionally, even on a clean success,
            to answer whether the app believed it had a photo to send at all.
            Remove once the missing-photo mystery is resolved. */}
        {!!photoDebugInfo && <Text selectable style={styles.queuedDetailText}>{photoDebugInfo}</Text>}
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
            ? <ActivityIndicator color={COLORS.primary} />
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
        {compressingPhoto ? (
          <View style={styles.photoCompressingBox}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.photoCompressingText}>{t('summit.compressing_photo')}</Text>
          </View>
        ) : imageUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="contain" />
            <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => { deletePersistedPhoto(imageUri); setImageUri(null); }} activeOpacity={0.8}>
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
  successTitle: { fontSize: 22, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 8 },
  successSub: { fontSize: 15, color: '#555', textAlign: 'center', marginBottom: 36 },
  queuedDetailText: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: -24, marginBottom: 24, fontFamily: 'monospace' },
  doneBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 40 },
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
  summitBannerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.primary, flex: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 10, marginTop: 4 },
  label: { fontSize: 13, color: '#666', marginBottom: 8, fontWeight: '600' },
  loggedInInfoBox: { backgroundColor: '#e8f6fa', borderRadius: 10, padding: 12, marginBottom: 12 },
  loggedInInfoText: { fontSize: 13, color: '#1a6f85' },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
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
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  routeOptionActive: { backgroundColor: COLORS.primary },
  routeOptionText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  routeOptionTextActive: { color: '#fff' },
  gpsBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 20,
  },
  gpsBtnActive: { backgroundColor: '#e8f6fa', borderColor: '#1a8aa8' },
  gpsBtnWarn: { backgroundColor: '#fdf3e3', borderColor: '#f39c12' },
  gpsBtnText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  gpsBtnTextActive: { color: '#1a8aa8' },
  gpsBtnTextWarn: { color: '#b9770e' },
  gpsStatus: { fontSize: 12, fontWeight: '600', marginTop: -14, marginBottom: 6, textAlign: 'center' },
  gpsStatusOk: { color: '#1e8449' },
  gpsStatusWarn: { color: '#b9770e' },
  gpsRetryBtn: { alignSelf: 'center', paddingVertical: 4, paddingHorizontal: 10, marginBottom: 20 },
  gpsRetryText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  photoCompressingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 16,
    marginBottom: 20,
  },
  photoCompressingText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  photoBtnRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  photoBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
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
  dateDisplayText: { fontSize: 15, color: COLORS.primary, fontWeight: '700' },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
