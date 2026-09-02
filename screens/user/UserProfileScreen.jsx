import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { COLORS } from '../../assets/styles/styles';
import ClimberProfileContent from '../../components/user/ClimberProfileContent';
import ClimberProfileModal from '../../components/user/ClimberProfileModal';

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
  const [modalVisible, setModalVisible] = useState(false);

  if (!user) return null;

  async function handleLogout() {
    await logout();
    navigation.navigate('HomeDrawer', { screen: 'home' });
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <View style={styles.profileCard}>
        <ClimberProfileContent
          userId={user.id}
          hideActivity
          onAvatarPress={() => setModalVisible(true)}
          onOpenClimbersList={() => navigation.navigate('climbers_list')}
        />
      </View>

      <ClimberProfileModal
        visible={modalVisible}
        userId={user.id}
        onClose={() => setModalVisible(false)}
        onViewFullProfile={(id) => {
          setModalVisible(false);
          navigation.navigate('climber_profile', { userId: id });
        }}
      />

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
          onPress={handleLogout}
          danger
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#f4f6f8' },
  container: { paddingBottom: 32 },
  profileCard: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
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
