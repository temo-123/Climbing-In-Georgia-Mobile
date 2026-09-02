import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../utils/AuthContext';
import api, { API_BASE_URL, IMG_BASES, imgUri } from '../../utils/api';
import { compressImageIfNeeded } from '../../utils/imageCompress';
import { COLORS } from '../../assets/styles/styles';
import EditProfileModal from '../../components/user/EditProfileModal';
import ChangePasswordModal from '../../components/user/ChangePasswordModal';
import UserLinksManager from '../../components/user/UserLinksManager';

const API = API_BASE_URL;

function initialsOf(user) {
  return `${user?.name?.[0] ?? ''}${user?.surname?.[0] ?? ''}`.toUpperCase();
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>{value || '—'}</Text>
    </View>
  );
}

export default function UserOptionsScreen() {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);

  async function pickAvatar(useCamera) {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('user.camera_permission'));
          return;
        }
        result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(t('user.gallery_permission'));
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [1, 1],
        });
      }
      if (result.canceled || !result.assets?.[0]?.uri) return;

      setAvatarUploading(true);
      const compressedUri = await compressImageIfNeeded(result.assets[0].uri);
      const ext = (compressedUri.split('.').pop() || 'jpg').toLowerCase();
      const fd = new FormData();
      // Field name must be "image" — the backend reads $request->file('image').
      fd.append('image', { uri: compressedUri, name: `avatar.${ext}`, type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
      await api.post(`${API}/user/user_image_update/${user.id}`, fd, { timeout: 60000 });
      await refreshUser();
    } catch {
      Alert.alert(t('auth.generic_error'));
    } finally {
      setAvatarUploading(false);
    }
  }

  function confirmPickAvatar() {
    Alert.alert(t('user.change_avatar'), undefined, [
      { text: t('summit.take_photo'), onPress: () => pickAvatar(true) },
      { text: t('summit.choose_from_gallery'), onPress: () => pickAvatar(false) },
      { text: t('user.cancel'), style: 'cancel' },
    ]);
  }

  if (!user) return null;

  const avatarUri = user.image ? imgUri(IMG_BASES.userProfile, user.image) : null;

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>

        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={confirmPickAvatar} disabled={avatarUploading} activeOpacity={0.8}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarFallback}><Text style={styles.avatarText}>{initialsOf(user)}</Text></View>
            )}
            <View style={styles.avatarEditBadge}>
              {avatarUploading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.avatarEditIcon}>✎</Text>}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmPickAvatar} disabled={avatarUploading}>
            <Text style={styles.changeAvatarText}>{t('user.change_avatar')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>{t('user.profile_info')}</Text>
            <TouchableOpacity onPress={() => setEditProfileVisible(true)}>
              <Text style={styles.editLink}>{t('user.edit')}</Text>
            </TouchableOpacity>
          </View>
          <Row label={t('auth.name')} value={`${user.name ?? ''} ${user.surname ?? ''}`.trim()} />
          <Row label={t('auth.email')} value={user.email} />
          <Row label={t('auth.country')} value={user.country} />
          <Row label={t('auth.city')} value={user.city} />
          <Row label={t('auth.phone_number')} value={user.phone_number} />
          {!!user.my_bio && <Row label={t('user.profile_bio')} value={user.my_bio} />}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('user.extra_links')}</Text>
          <Text style={styles.hint}>{t('user.extra_links_hint')}</Text>
          <UserLinksManager />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('user.change_password')}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setChangePasswordVisible(true)} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{t('user.change_password')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <EditProfileModal visible={editProfileVisible} onClose={() => setEditProfileVisible(false)} />
      <ChangePasswordModal visible={changePasswordVisible} onClose={() => setChangePasswordVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: '#f4f6f8', flexGrow: 1 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarImg: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: COLORS.primary },
  avatarFallback: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 30, fontWeight: 'bold', color: '#fff' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarEditIcon: { color: '#fff', fontSize: 13 },
  changeAvatarText: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginTop: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  editLink: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  hint: { fontSize: 12, color: '#999', marginBottom: 10 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  rowLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  rowValue: { fontSize: 14, color: '#222' },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
