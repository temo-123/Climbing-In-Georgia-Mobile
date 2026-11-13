import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faStar, faRightToBracket, faUserPlus, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import api, { API_BASE_URL } from '../../utils/api';
import { useAuth, useAccount } from '../../utils/AuthContext';
import { useStatsVersion } from '../../utils/statsVersion';
import RadarStatsChart from './RadarStatsChart';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import IconText from '../ui/IconText';
import { SkeletonBlock } from '../ui/Skeleton';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The logged-in climber's own points + 6-axis activity radar, from the same
// public endpoint as any profile (GET get_climber_profile/{own id}). Points
// always come from the server — weights are admin-editable. Guests get the
// login / register prompt; under-age accounts get nothing (no functions).
export default function MyStatsCard({ onLogin, onRegister, onOpenProfile, style }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { canAct } = useAccount();
  const statsVersion = useStatsVersion();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!user?.id || !canAct) { setProfile(null); return; }
    let alive = true;
    api.get(`${API_BASE_URL}/get_climber_profile/${user.id}`)
      .then(({ data }) => { if (alive) setProfile(data); })
      .catch(() => { if (alive) setProfile((p) => p ?? false); });
    return () => { alive = false; };
  }, [user?.id, canAct, statsVersion]);

  if (!user) {
    return (
      <View style={[styles.card, styles.guest, style]}>
        <Text style={styles.guestText}>{t('site.global.follow.guest_prompt_text')}</Text>
        <View style={styles.guestBtns}>
          <Button small block={false} variant="hold" icon={faRightToBracket} title={t('auth.login')} onPress={onLogin} />
          <Button small block={false} variant="outline" icon={faUserPlus} title={t('site.global.follow.register_btn')} onPress={onRegister} />
        </View>
      </View>
    );
  }
  if (!canAct) return null;

  const labels = [
    t('site.global.follow.route_reviews_label'), t('site.global.follow.mtp_reviews_label'),
    t('site.global.follow.ascents_label'), t('site.global.follow.route_ascents_label'),
    t('site.global.follow.mtp_ascents_label'), t('site.global.follow.comments_label'),
  ];
  const values = profile ? [
    profile.route_reviews_count, profile.mtp_reviews_count, profile.ascents_count,
    profile.route_ascents_count, profile.mtp_ascents_count, profile.comments_count,
  ].map((v) => Number(v) || 0) : null;

  return (
    <View style={[styles.card, style]}>
      <TouchableOpacity style={styles.head} onPress={onOpenProfile} disabled={!onOpenProfile} activeOpacity={0.8}>
        <Avatar user={user} size={40} />
        <View style={styles.flex}>
          <Text style={styles.eyebrow}>{t('account.my_stats')}</Text>
          <Text style={styles.name} numberOfLines={1}>{user.name} {user.surname}</Text>
        </View>
        <View style={styles.points}>
          <IconText icon={faStar} iconColor={COLORS.ink} style={styles.pointsText}>
            {profile ? `${profile.points_total ?? 0} ${t('site.global.follow.points_label')}` : '…'}
          </IconText>
        </View>
        {!!onOpenProfile && <FontAwesomeIcon icon={faChevronRight} size={12} color={COLORS.muted} />}
      </TouchableOpacity>

      {profile === null ? (
        <SkeletonBlock height={160} radius={RADII.md} />
      ) : profile === false ? null : (
        <>
          <RadarStatsChart labels={labels} values={values} size={120} legend={false} />
          {Number(profile.points_total) === 0 && <Text style={styles.empty}>{t('site.global.follow.no_activity')}</Text>}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: RADII.lg, borderWidth: 1, borderColor: COLORS.line,
    padding: 14, marginHorizontal: 6, marginBottom: 10, ...SHADOWS.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  flex: { flex: 1 },
  eyebrow: { fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.muted },
  name: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.ink },
  points: { backgroundColor: COLORS.hold, borderRadius: RADII.pill, paddingHorizontal: 10, paddingVertical: 5 },
  pointsText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.ink },
  empty: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.stone, textAlign: 'center', marginTop: 4 },
  guest: { alignItems: 'center', gap: 10 },
  guestText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink2, textAlign: 'center' },
  guestBtns: { flexDirection: 'row', gap: 10 },
});
