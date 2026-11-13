import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCakeCandles, faEnvelopeCircleCheck } from '@fortawesome/free-solid-svg-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../utils/AuthContext';
import api, { API_BASE_URL, IMG_BASES, imgUri } from '../../utils/api';
import { compressImageIfNeeded, readPhotoAsBase64 } from '../../utils/imageCompress';
import { COLORS, FONTS } from '../../assets/styles/styles';
import EditProfileModal from '../../components/user/EditProfileModal';
import ChangePasswordModal from '../../components/user/ChangePasswordModal';
import UserLinksManager from '../../components/user/UserLinksManager';
import LegalLinks from '../../components/LegalLinks';
import DeleteAccountModal from '../../components/user/DeleteAccountModal';
import OfflineDataStatus from '../../components/user/OfflineDataStatus';
import ResendVerifyButton from '../../components/account/ResendVerifyButton';
import Button from '../../components/ui/Button';
import { useLocale } from '../../utils/LocaleContext';
import { dayMonthYear } from '../../utils/eventDates';

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

function formatBirthday(value, locale) {
  const [y, m, d] = String(value || '').slice(0, 10).split('-').map(Number);
  return y ? dayMonthYear(new Date(y, m - 1, d), locale) : '';
}

// route.params.focus ('name' | 'location' | 'email' | 'birthday' | 'image')
// opens the matching edit field — sent by the account alerts.
export default function UserOptionsScreen() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user, refreshUser } = useAuth();
  const route = useRoute();
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editFocus, setEditFocus] = useState(null);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [deleteAccountVisible, setDeleteAccountVisible] = useState(false);
  const navigation = useNavigation();

  function openEdit(focus = null) {
    setEditFocus(focus);
    setEditProfileVisible(true);
  }

  const focusParam = route.params?.focus;
  const focusAt = route.params?.at;
  useEffect(() => {
    if (!focusParam) return;
    if (focusParam === 'image') confirmPickAvatar();
    else openEdit(focusParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam, focusAt]);

  function handleAccountDeleted() {
    setDeleteAccountVisible(false);
    navigation.navigate('HomeDrawer', { screen: 'home' });
    Alert.alert(t('user.account_deleted'));
  }

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
      // Sent as base64 in a plain JSON body rather than multipart/form-data —
      // see the matching comment in SubmitAscentScreen.jsx: some networks/
      // on-device software reject or mangle multipart bodies specifically.
      // Backend reads image_base64/image_ext (falls back to $request->file('image')
      // if a client ever sends true multipart).
      const image_base64 = await readPhotoAsBase64(compressedUri);
      await api.post(`${API}/user/user_image_update/${user.id}`, { image_base64, image_ext: ext }, { timeout: 60000 });
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

  const avatarUri = user.image ? imgUri(IMG_BASES.userProfile, user.image, user.updated_at) : null;

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

        {!user.email_verified_at && (
          <View style={[styles.card, styles.alertCard]}>
            <View style={styles.alertHead}>
              <FontAwesomeIcon icon={faEnvelopeCircleCheck} size={18} color={COLORS.danger} />
              <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t('account.confirm_email_title')}</Text>
            </View>
            <Text style={styles.alertText}>{t('account.confirm_email_text', { email: user.email })}</Text>
            <ResendVerifyButton onAlready={() => refreshUser().catch(() => {})} />
          </View>
        )}

        {!user.birthday && (
          <View style={[styles.card, styles.calloutCard]}>
            <View style={styles.alertHead}>
              <FontAwesomeIcon icon={faCakeCandles} size={18} color={COLORS.ink} />
              <Text style={[styles.sectionTitle, styles.calloutTitle]}>{t('account.add_birthday_title')}</Text>
            </View>
            <Text style={styles.alertText}>{t('account.add_birthday_text')}</Text>
            <Button variant="hold" title={t('account.add_birthday_btn')} onPress={() => openEdit('birthday')} />
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>{t('user.profile_info')}</Text>
            <TouchableOpacity onPress={() => openEdit()}>
              <Text style={styles.editLink}>{t('user.edit')}</Text>
            </TouchableOpacity>
          </View>
          <Row label={t('auth.name')} value={`${user.name ?? ''} ${user.surname ?? ''}`.trim()} />
          <Row label={t('auth.email')} value={user.email} />
          <Row label={t('account.birthday')} value={formatBirthday(user.birthday, locale)} />
          <Row label={t('auth.country')} value={user.country} />
          <Row label={t('auth.city')} value={user.city} />
          <Row label={t('auth.phone_number')} value={user.phone_number} />
          {!!user.my_bio && <Row label={t('user.profile_bio')} value={user.my_bio} />}
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>{t('account.preferences_title')}</Text>
          <OfflineDataStatus
            onWantDownload={() => navigation.navigate('HomeDrawer', { screen: 'offline_mode', params: { autoStart: Date.now() } })}
          />
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

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>{t('legal.section_title')}</Text>
          <LegalLinks />
        </View>

        <View style={styles.card}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>{t('user.delete_account')}</Text>
          <Text style={styles.hint}>{t('user.delete_account_hint')}</Text>
          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={() => setDeleteAccountVisible(true)} activeOpacity={0.8}>
            <Text style={styles.buttonText}>{t('user.delete_account')}</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      <EditProfileModal visible={editProfileVisible} focusField={editFocus} onClose={() => { setEditProfileVisible(false); setEditFocus(null); }} />
      <ChangePasswordModal visible={changePasswordVisible} onClose={() => setChangePasswordVisible(false)} />
      <DeleteAccountModal
        visible={deleteAccountVisible}
        onClose={() => setDeleteAccountVisible(false)}
        onDeleted={handleAccountDeleted}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: COLORS.chalk, flexGrow: 1 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarImg: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: COLORS.primary },
  avatarFallback: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 34, fontFamily: FONTS.displayBold, color: '#fff' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarEditIcon: { color: '#fff', fontSize: 13, fontFamily: FONTS.body },
  changeAvatarText: { color: COLORS.primary, fontSize: 13, fontFamily: FONTS.bodySemi, marginTop: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 16,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bodyBold, color: COLORS.primary },
  editLink: { color: COLORS.primary, fontFamily: FONTS.bodySemi, fontSize: 13 },
  hint: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.muted, marginBottom: 10 },
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.chalk },
  rowLabel: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  rowValue: { fontSize: 14, fontFamily: FONTS.body, color: COLORS.ink },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 13,
    alignItems: 'center', marginTop: 4,
  },
  buttonText: { color: '#fff', fontSize: 15, fontFamily: FONTS.bodyBold },
  dangerTitle: { color: COLORS.danger, marginBottom: 4 },
  alertCard: { borderWidth: 1, borderColor: '#f1c4c6', backgroundColor: '#fdf1f1' },
  calloutCard: { borderWidth: 1, borderColor: COLORS.hold, backgroundColor: '#fff8e6' },
  calloutTitle: { color: COLORS.ink, marginBottom: 4 },
  alertHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  alertText: { fontSize: 13, lineHeight: 19, fontFamily: FONTS.body, color: COLORS.ink2, marginBottom: 12 },
  dangerButton: { backgroundColor: COLORS.danger },
});
