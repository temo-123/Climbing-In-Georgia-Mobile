import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { IMG_BASES, imgUri } from '../../utils/api';
import { COLORS } from '../../assets/styles/styles';

function initialsOf(item) {
  return `${item?.name?.[0] ?? ''}${item?.surname?.[0] ?? ''}`.toUpperCase();
}

export default function ClimberCard({ item, onPress }) {
  const avatarUri = item.image ? imgUri(IMG_BASES.userProfile, item.image) : null;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {avatarUri ? (
        <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatarFallback}><Text style={styles.avatarText}>{initialsOf(item)}</Text></View>
      )}
      <Text style={styles.name} numberOfLines={1}>{item.name} {item.surname}</Text>
      <View style={styles.statsRow}>
        <Text style={styles.statText}>👥 {item.followers_count ?? 0}</Text>
        <Text style={styles.statText}>⭐ {item.points_total ?? 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, margin: 6,
    alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  avatarImg: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  avatarFallback: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarText: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 13, fontWeight: '700', color: '#222', textAlign: 'center', marginBottom: 6 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statText: { fontSize: 11, color: '#777' },
});
