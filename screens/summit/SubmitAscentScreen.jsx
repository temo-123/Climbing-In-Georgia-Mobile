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

const API = 'https://climbing.ge/api/summit';

function generateCaptcha() {
  const a = Math.floor(Math.random() * 12) + 1;
  const b = Math.floor(Math.random() * 12) + 1;
  return { question: `${a} + ${b}`, answer: a + b };
}

export default function SubmitAscentScreen({ route, navigation }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { summit_id, title } = route.params;

  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState(user?.name ?? '');
  const [surname, setSurname] = useState(user?.surname ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [ascentDate, setAscentDate] = useState(today);
  const [comment, setComment] = useState('');
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [otherRoute, setOtherRoute] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [queued, setQueued] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    Network.getNetworkStateAsync().then(state => {
      setIsOffline(!state.isConnected || state.isInternetReachable === false);
    });
    api.get(`${API}/routes/${summit_id}`)
      .then(res => setRoutes(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [summit_id]);

  async function pickImage(useCamera) {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('summit.camera_permission'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('summit.gallery_permission'));
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
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
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('summit.gps_denied'));
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
    } catch {
      Alert.alert(t('summit.gps_error'));
    } finally {
      setGpsLoading(false);
    }
  }

  async function handleSubmit() {
    if (!name.trim() || !surname.trim() || !ascentDate) {
      Alert.alert(t('auth.fill_all_fields'));
      return;
    }
    if (parseInt(captchaInput, 10) !== captcha.answer) {
      Alert.alert(t('summit.captcha_error'));
      setCaptcha(generateCaptcha());
      setCaptchaInput('');
      return;
    }

    setLoading(true);

    const ascentPayload = {
      name: name.trim(),
      surname: surname.trim(),
      email: email.trim() || undefined,
      ascent_date: ascentDate,
      comment: comment.trim() || undefined,
      is_gps_validated: !!coords,
      latitude: coords?.latitude ?? undefined,
      longitude: coords?.longitude ?? undefined,
      route_id: selectedRoute?.id ?? undefined,
      other_route: otherRoute.trim() || undefined,
    };

    const netState = await Network.getNetworkStateAsync();
    const online = netState.isConnected && netState.isInternetReachable !== false;

    if (!online) {
      await queueAscent({ summit_id, image_uri: imageUri || undefined, ...ascentPayload });
      setLoading(false);
      setQueued(true);
      return;
    }

    try {
      if (imageUri) {
        const fd = new FormData();
        Object.entries(ascentPayload).forEach(([k, v]) => {
          if (v != null) fd.append(k, String(v));
        });
        const ext = (imageUri.split('.').pop() || 'jpg').toLowerCase();
        fd.append('image', { uri: imageUri, name: `ascent.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
        await api.post(`${API}/ascent/${summit_id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`${API}/ascent/${summit_id}`, ascentPayload);
      }
      setSuccess(true);
    } catch (err) {
      if (!err.response) {
        // Network error — queue for later
        await queueAscent({ summit_id, image_uri: imageUri || undefined, ...ascentPayload });
        setQueued(true);
      } else {
        const msg = err.response.data?.message ?? t('auth.generic_error');
        Alert.alert(t('summit.submit_error'), msg);
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
        <TextInput style={styles.input} placeholder={t('auth.name')} placeholderTextColor="#aaa" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder={t('auth.surname')} placeholderTextColor="#aaa" value={surname} onChangeText={setSurname} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder={t('auth.email')} placeholderTextColor="#aaa" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.sectionTitle}>{t('summit.ascent_details')}</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#aaa"
          value={ascentDate}
          onChangeText={setAscentDate}
          maxLength={10}
        />

        {routes.length > 0 && (
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
        )}

        <TextInput
          style={styles.input}
          placeholder={t('summit.other_route')}
          placeholderTextColor="#aaa"
          value={otherRoute}
          onChangeText={setOtherRoute}
        />

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
          style={[styles.gpsBtn, !!coords && styles.gpsBtnActive]}
          onPress={captureGPS}
          disabled={gpsLoading}
          activeOpacity={0.8}
        >
          {gpsLoading
            ? <ActivityIndicator color="#279fbb" />
            : <Text style={[styles.gpsBtnText, !!coords && styles.gpsBtnTextActive]}>
                {coords
                  ? `📍 ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`
                  : `📍 ${t('summit.capture_gps')}`}
              </Text>
          }
        </TouchableOpacity>

        {/* Photo */}
        <Text style={styles.sectionTitle}>{t('summit.photo')}</Text>
        {imageUri ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: imageUri }} style={styles.photoPreview} resizeMode="cover" />
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

        {/* CAPTCHA */}
        <Text style={styles.sectionTitle}>{t('summit.captcha_title')}</Text>
        <View style={styles.captchaRow}>
          <View style={styles.captchaBox}>
            <Text style={styles.captchaText}>{captcha.question} = ?</Text>
          </View>
          <TextInput
            style={[styles.input, styles.captchaInput]}
            placeholder={t('summit.captcha_placeholder')}
            placeholderTextColor="#aaa"
            value={captchaInput}
            onChangeText={setCaptchaInput}
            keyboardType="numeric"
            maxLength={3}
          />
        </View>

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
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#fff', flexGrow: 1 },
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
  gpsBtnText: { fontSize: 14, color: '#279fbb', fontWeight: '600' },
  gpsBtnTextActive: { color: '#1a8aa8' },
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
  photoPreview: { width: '100%', height: 200, borderRadius: 10, marginBottom: 8 },
  photoRemoveBtn: {
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  photoRemoveBtnText: { color: '#e74c3c', fontSize: 13, fontWeight: '600' },
  captchaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  captchaBox: {
    flex: 1,
    backgroundColor: '#e8f6fa',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  captchaText: { fontSize: 18, fontWeight: '800', color: '#279fbb', letterSpacing: 1 },
  captchaInput: { flex: 1, marginBottom: 0, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  submitBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
