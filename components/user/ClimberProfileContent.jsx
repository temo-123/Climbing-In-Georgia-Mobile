import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL, IMG_BASES, imgUri } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { COLORS } from '../../assets/styles/styles';
import RadarStatsChart from './RadarStatsChart';

const API = API_BASE_URL;

const SOCIAL_ICONS = { facebook: '📘', instagram: '📷', youtube: '▶️', website: '🌐' };

function initialsOf(user) {
  return `${user?.name?.[0] ?? ''}${user?.surname?.[0] ?? ''}`.toUpperCase();
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function ActivityRow({ primary, secondary, date }) {
  return (
    <View style={styles.activityRow}>
      <Text style={styles.activityPrimary} numberOfLines={1}>{primary}</Text>
      {!!secondary && <Text style={styles.activitySecondary} numberOfLines={2}>{secondary}</Text>}
      {!!date && <Text style={styles.activityDate}>{new Date(date).toLocaleDateString()}</Text>}
    </View>
  );
}

// Fetches and renders one climber's public profile (GET /get_climber_profile/{id}).
// Shared between the full ClimberProfileScreen and the ClimberProfileModal quick-view.
export default function ClimberProfileContent({ userId, compact, hideActivity, onViewFullProfile, onOpenClimbersList, onAvatarPress }) {
  const { t } = useTranslation();
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [following, setFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    api.get(`${API}/get_climber_profile/${userId}`)
      .then(res => setProfile(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!authUser || !userId) return;
    if (authUser.id === userId) {
      setIsSelf(true);
      return;
    }
    api.get(`${API}/set_user_follow/follow_status/${userId}`)
      .then(res => {
        setFollowing(!!res.data?.following);
        setIsSelf(!!res.data?.is_self);
      })
      .catch(() => {});
  }, [authUser, userId]);

  async function toggleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await api.delete(`${API}/set_user_follow/unfollow/${userId}`);
        setFollowing(false);
      } else {
        await api.post(`${API}/set_user_follow/follow/${userId}`);
        setFollowing(true);
      }
      setProfile(p => p ? { ...p, followers_count: p.followers_count + (following ? -1 : 1) } : p);
    } catch {
    } finally {
      setFollowLoading(false);
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }
  if (error || !profile) {
    return <View style={styles.center}><Text style={styles.emptyText}>{t('user.profile_not_found')}</Text></View>;
  }

  const { user, points_total, followers_count, following_count } = profile;
  const avatarUri = user.image ? imgUri(IMG_BASES.userProfile, user.image) : null;
  const socialEntries = Object.entries(user.social_links || {}).filter(([, v]) => !!v);

  const radarLabels = [t('user.route_reviews'), t('user.mtp_reviews'), t('user.ascents'), t('user.comments')];
  const radarValues = [profile.route_reviews_count, profile.mtp_reviews_count, profile.ascents_count, profile.comments_count];

  const hasActivity = (profile.recent_route_reviews?.length || profile.recent_mtp_reviews?.length
    || profile.recent_ascents?.length || profile.recent_comments?.length);

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={onAvatarPress}
          disabled={!onAvatarPress}
          activeOpacity={0.8}
        >
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}><Text style={styles.avatarText}>{initialsOf(user)}</Text></View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{user.name} {user.surname}</Text>
        {!!user.my_bio && <Text style={styles.bio}>{user.my_bio}</Text>}

        {socialEntries.length > 0 && (
          <View style={styles.socialRow}>
            {socialEntries.map(([key, url]) => (
              <TouchableOpacity key={key} style={styles.socialIcon} onPress={() => Linking.openURL(url)}>
                <Text style={styles.socialIconText}>{SOCIAL_ICONS[key] ?? '🔗'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {profile.user_sites?.length > 0 && (
          <View style={styles.sitesRow}>
            {profile.user_sites.map(site => (
              <TouchableOpacity key={site.id} onPress={() => Linking.openURL(site.url)}>
                <Text style={styles.siteLink}>🔗 {hostnameOf(site.url)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.chipsRow}>
          <View style={styles.chip}><Text style={styles.chipText}>👥 {followers_count} {t('user.followers')}</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>➕ {following_count} {t('user.following')}</Text></View>
          <View style={[styles.chip, styles.pointsChip]}><Text style={[styles.chipText, styles.pointsChipText]}>⭐ {points_total} {t('user.points')}</Text></View>
        </View>

        {!isSelf && authUser && (
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={toggleFollow}
            disabled={followLoading}
            activeOpacity={0.8}
          >
            <Text style={[styles.followBtnText, following && styles.followingBtnText]}>
              {following ? t('user.following_action') : t('user.follow')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.radarSection}>
        <RadarStatsChart labels={radarLabels} values={radarValues} size={compact ? 130 : 160} />
        <View style={styles.countsRow}>
          {radarValues.map((v, i) => (
            <View key={i} style={styles.countCol}>
              <Text style={styles.countNum}>{v}</Text>
              <Text style={styles.countLabel}>{radarLabels[i]}</Text>
            </View>
          ))}
        </View>
        {onOpenClimbersList && (
          <TouchableOpacity onPress={onOpenClimbersList} style={styles.allUsersLink}>
            <Text style={styles.allUsersLinkText}>{t('user.all_users')} ›</Text>
          </TouchableOpacity>
        )}
      </View>

      {!hideActivity && (
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>{t('user.recent_activity')}</Text>
          {!hasActivity && <Text style={styles.emptyText}>{t('user.no_activity')}</Text>}

          {profile.recent_ascents?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.recent_ascents')}</Text>
              {profile.recent_ascents.map(a => (
                <ActivityRow key={`a${a.id}`} primary={`🚩 ${a.summit_title ?? '—'}`} date={a.ascent_date} />
              ))}
            </>
          )}
          {profile.recent_route_reviews?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.my_route_reviews')}</Text>
              {profile.recent_route_reviews.map(r => (
                <ActivityRow key={`r${r.id}`} primary={`⭐ ${r.route_name ?? '—'}`} secondary={r.text} date={r.created_at} />
              ))}
            </>
          )}
          {profile.recent_mtp_reviews?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.mtp_reviews')}</Text>
              {profile.recent_mtp_reviews.map(r => (
                <ActivityRow key={`m${r.id}`} primary={`⭐ ${r.mtp_name ?? '—'}`} secondary={r.text} date={r.created_at} />
              ))}
            </>
          )}
          {profile.recent_comments?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.my_comments')}</Text>
              {profile.recent_comments.map(c => (
                <ActivityRow key={`c${c.id}`} primary={`💬 ${c.text}`} date={c.created_at} />
              ))}
            </>
          )}
        </View>
      )}

      {compact && onViewFullProfile && (
        <TouchableOpacity style={styles.viewFullBtn} onPress={onViewFullProfile} activeOpacity={0.85}>
          <Text style={styles.viewFullBtnText}>{t('user.view_full_profile')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: '#888', fontSize: 14 },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  avatarWrap: { marginBottom: 12 },
  avatarImg: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: COLORS.primary },
  avatarFallback: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 19, fontWeight: 'bold', color: '#222', marginBottom: 4, textAlign: 'center' },
  bio: { fontSize: 13, color: '#666', textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  socialRow: { flexDirection: 'row', marginBottom: 10, gap: 10 },
  socialIcon: { padding: 4 },
  sitesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 10 },
  siteLink: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  socialIconText: { fontSize: 18 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#f0f4f6', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600', color: '#555' },
  pointsChip: { backgroundColor: '#fdf1d6' },
  pointsChipText: { color: '#a67c00' },
  followBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 9, marginTop: 2 },
  followingBtn: { backgroundColor: '#eee' },
  followBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  followingBtnText: { color: '#555' },
  radarSection: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 16 },
  countsRow: { flexDirection: 'row', marginTop: 12 },
  countCol: { alignItems: 'center', paddingHorizontal: 12 },
  countNum: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  countLabel: { fontSize: 10, color: '#888', marginTop: 2, textAlign: 'center', maxWidth: 70 },
  allUsersLink: { marginTop: 12 },
  allUsersLinkText: { color: COLORS.primary, fontWeight: '600', fontSize: 13 },
  activitySection: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#222', marginBottom: 8 },
  subsectionTitle: { fontSize: 12, fontWeight: '700', color: '#999', textTransform: 'uppercase', marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
  activityRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f4f4f4' },
  activityPrimary: { fontSize: 13, fontWeight: '600', color: '#333' },
  activitySecondary: { fontSize: 12, color: '#777', marginTop: 2 },
  activityDate: { fontSize: 10, color: '#aaa', marginTop: 3 },
  viewFullBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 13, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 20 },
  viewFullBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
