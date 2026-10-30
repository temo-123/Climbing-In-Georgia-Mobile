import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { IMG_BASES, imgUri } from '../../utils/api';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Round avatar of a user object ({ name, surname, image }) — the profile
// photo, or initials on the accent colour. Social-login avatars are full URLs.
export default function Avatar({ user, size = 36 }) {
  const image = user?.image;
  const uri = image ? (/^https?:\/\//.test(image) ? image : imgUri(IMG_BASES.userProfile, image, user?.updated_at)) : null;
  const dims = { width: size, height: size, borderRadius: size / 2 };
  if (uri) return <Image source={{ uri }} style={[styles.img, dims]} />;
  const initials = `${user?.name?.[0] ?? ''}${user?.surname?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <View style={[styles.fallback, dims]}>
      <Text style={[styles.initials, { fontSize: size * 0.42 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  img: { backgroundColor: COLORS.chalk2 },
  fallback: { backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontFamily: FONTS.displayBold },
});
