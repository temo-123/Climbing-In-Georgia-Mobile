import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { faCamera, faImage, faXmark } from '@fortawesome/free-solid-svg-icons';
import IconText from './IconText';
import { persistPickedPhoto, deletePersistedPhoto } from '../../utils/imageCompress';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Camera / gallery picker for an optional ascent photo. The picked file is
// compressed and persisted (utils/imageCompress) and sent later as base64
// in the JSON body — never multipart (see CLAUDE.md, "Photo uploads").
export default function PhotoPicker({ uri, onChange }) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  async function pick(useCamera) {
    try {
      const perm = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert(t(useCamera ? 'summit.camera_permission' : 'summit.gallery_permission'));
        return;
      }
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      setBusy(true);
      onChange(await persistPickedPhoto(result.assets[0].uri));
    } catch {
      Alert.alert(t('auth.generic_error'));
    } finally {
      setBusy(false);
    }
  }

  if (busy) {
    return (
      <View style={styles.busy}>
        <ActivityIndicator color={COLORS.primary} />
        <Text style={styles.busyText}>{t('site.common.processing_image')}</Text>
      </View>
    );
  }

  if (uri) {
    return (
      <View>
        <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
        <TouchableOpacity style={styles.remove} onPress={() => { deletePersistedPhoto(uri); onChange(null); }}>
          <IconText icon={faXmark} iconColor={COLORS.danger} style={styles.removeText}>{t('summit.remove_photo')}</IconText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <TouchableOpacity style={styles.btn} onPress={() => pick(true)} activeOpacity={0.8}>
        <IconText icon={faCamera} style={styles.btnText}>{t('summit.take_photo')}</IconText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.btn} onPress={() => pick(false)} activeOpacity={0.8}>
        <IconText icon={faImage} style={styles.btnText}>{t('summit.choose_from_gallery')}</IconText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADII.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primarySoft,
    paddingHorizontal: 8,
  },
  btnText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.primaryDark },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  busyText: { fontFamily: FONTS.body, color: COLORS.stone },
  preview: { width: '100%', aspectRatio: 16 / 9, borderRadius: RADII.md, backgroundColor: COLORS.chalk2 },
  remove: { alignSelf: 'flex-start', marginTop: 8 },
  removeText: { fontFamily: FONTS.bodyBold, color: COLORS.danger, fontSize: 13 },
});
