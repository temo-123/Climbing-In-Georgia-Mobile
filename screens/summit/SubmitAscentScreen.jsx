import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Location from 'expo-location';
import { useAuth } from '../../utils/AuthContext';
import api from '../../utils/api';

const API = 'https://climbing.ge/api/summit';

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

  useEffect(() => {
    api.get(`${API}/routes/${summit_id}`)
      .then(res => setRoutes(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [summit_id]);

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
    setLoading(true);
    try {
      await api.post(`${API}/ascent/${summit_id}`, {
        name: name.trim(),
        surname: surname.trim(),
        email: email.trim() || undefined,
        ascent_date: ascentDate,
        comment: comment.trim() || undefined,
        is_gps_validated: !!coords,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
        other_route: otherRoute.trim() || undefined,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.message ?? t('auth.generic_error');
      Alert.alert(t('summit.submit_error'), msg);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successIcon}>🎉</Text>
        <Text style={styles.successTitle}>{t('summit.ascent_recorded')}</Text>
        <Text style={styles.successSub}>{title}</Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}
        >
          <Text style={styles.doneBtnText}>{t('summit.done')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
  submitBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
