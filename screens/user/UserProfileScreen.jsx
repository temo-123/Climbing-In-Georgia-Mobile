import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { COLORS } from '../../assets/styles/styles';

function MenuItem({ icon, label, onPress, danger }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuIcon, danger && styles.dangerText]}>{icon}</Text>
      <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
      {!danger && <Text style={styles.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function UserProfileScreen({ navigation }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const initials = `${user.name?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{user.name} {user.surname}</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.card}>
        <SectionHeader title={t('user.section_account')} />
        <MenuItem
          icon="⚙️"
          label={t('user.options')}
          onPress={() => navigation.navigate('user_options')}
        />

        <SectionHeader title={t('user.section_activity')} />
        <MenuItem
          icon="💬"
          label={t('user.my_comments')}
          onPress={() => navigation.navigate('user_comments')}
        />
        <MenuItem
          icon="⭐"
          label={t('user.my_route_reviews')}
          onPress={() => navigation.navigate('user_route_reviews')}
        />
        <MenuItem
          icon="🏔️"
          label={t('user.my_ascents')}
          onPress={() => navigation.navigate('user_ascents')}
        />

        <SectionHeader title={t('user.section_shop')} />
        <MenuItem
          icon="💝"
          label={t('user.my_donations')}
          onPress={() => navigation.navigate('user_donations')}
        />

        <SectionHeader title={t('user.section_favorites')} />
        <MenuItem
          icon="🏔️"
          label={t('user.favorite_areas')}
          onPress={() => navigation.navigate('user_favorites', { tab: 'areas' })}
        />
        <MenuItem
          icon="📅"
          label={t('user.interested_events')}
          onPress={() => navigation.navigate('user_favorites', { tab: 'events' })}
        />

        <View style={styles.divider} />
        <MenuItem
          icon="🚪"
          label={t('auth.logout')}
          onPress={logout}
          danger
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f6f8' },
  container: { paddingBottom: 32 },
  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    paddingVertical: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
    width: 28,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 22,
    color: '#ccc',
    fontWeight: '300',
  },
  dangerText: {
    color: '#e74c3c',
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
});
