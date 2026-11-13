import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faGear, faComment, faStar, faMountain, faHandHoldingHeart, faHeart, faCalendarCheck,
  faRightFromBracket, faChevronRight, faBook, faLink,
} from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';
import ClimberProfileContent from '../../components/user/ClimberProfileContent';
import ClimberProfileModal from '../../components/user/ClimberProfileModal';
import AccountAlertsCard from '../../components/user/AccountAlertsCard';
import { accountAlerts } from '../../utils/accountAlerts';

function MenuItem({ icon, label, onPress, danger, badge }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <FontAwesomeIcon icon={icon} size={15} color={danger ? COLORS.danger : COLORS.primaryDark} />
      </View>
      <Text style={[styles.menuLabel, danger && styles.dangerText]}>{label}</Text>
      {!!badge && <View style={styles.badge}><Text style={styles.badgeText}>{badge}</Text></View>}
      {!danger && <FontAwesomeIcon icon={faChevronRight} size={12} color={COLORS.muted} />}
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
      <AccountAlertsCard
        onOpen={(key) => navigation.navigate('user_options', key === 'email' ? {} : { focus: key, at: Date.now() })}
      />

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
          icon={faGear}
          label={t('user.options')}
          badge={accountAlerts(user).length}
          onPress={() => navigation.navigate('user_options')}
        />

        <SectionHeader title={t('user.section_activity')} />
        <MenuItem
          icon={faBook}
          label={t('climb.my_logbook')}
          onPress={() => navigation.navigate('my_logbook')}
        />
        <MenuItem
          icon={faLink}
          label={t('climb.my_mtp_ascents')}
          onPress={() => navigation.navigate('my_mtp_ascents')}
        />
        <MenuItem
          icon={faComment}
          label={t('user.my_comments')}
          onPress={() => navigation.navigate('user_comments')}
        />
        <MenuItem
          icon={faStar}
          label={t('user.my_route_reviews')}
          onPress={() => navigation.navigate('user_route_reviews')}
        />
        <MenuItem
          icon={faMountain}
          label={t('user.my_ascents')}
          onPress={() => navigation.navigate('user_ascents')}
        />

        <SectionHeader title={t('user.section_shop')} />
        <MenuItem
          icon={faHandHoldingHeart}
          label={t('user.my_donations')}
          onPress={() => navigation.navigate('user_donations')}
        />

        <SectionHeader title={t('user.section_favorites')} />
        <MenuItem
          icon={faHeart}
          label={t('user.favorite_areas')}
          onPress={() => navigation.navigate('user_favorites', { tab: 'areas' })}
        />
        <MenuItem
          icon={faCalendarCheck}
          label={t('user.interested_events')}
          onPress={() => navigation.navigate('user_favorites', { tab: 'events' })}
        />

        <View style={styles.divider} />
        <MenuItem
          icon={faRightFromBracket}
          label={t('auth.logout')}
          onPress={handleLogout}
          danger
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.chalk },
  container: { padding: 16, paddingBottom: 40 },
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 20,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingVertical: 6,
    ...SHADOWS.sm,
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: FONTS.bodyHeavy,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#fbe9ea' },
  menuLabel: { flex: 1, fontSize: 15, color: COLORS.ink, fontFamily: FONTS.bodySemi },
  dangerText: { color: COLORS.danger },
  badge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontFamily: FONTS.bodyHeavy, fontSize: 11 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 6, marginHorizontal: 18 },
});
