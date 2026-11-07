import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL, IMG_BASES, imgUri } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFacebookF, faInstagram, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { faGlobe, faLink, faUsers, faUserPlus, faStar, faFlag, faComment, faCheck } from '@fortawesome/free-solid-svg-icons';
import IconText from '../ui/IconText';
import { COLORS, FONTS } from '../../assets/styles/styles';
import RadarStatsChart from './RadarStatsChart';
import ReportButton from '../ReportButton';

const API = API_BASE_URL;

const SOCIAL_ICONS = { facebook: faFacebookF, instagram: faInstagram, youtube: faYoutube, website: faGlobe };

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

function ActivityRow({ icon, primary, secondary, date }) {
  return (
    <View style={styles.activityRow}>
      <IconText icon={icon} style={styles.activityPrimary} numberOfLines={1}>{primary}</IconText>
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
  const avatarUri = user.image ? imgUri(IMG_BASES.userProfile, user.image, user.updated_at) : null;
  const socialEntries = Object.entries(user.social_links || {}).filter(([, v]) => !!v);

  // Same 6 point categories as the website (User::pointsCategories()): the
  // *_count fields are the exact visible-activity counts the points come from.
  const radarLabels = [
    t('user.route_reviews'), t('user.mtp_reviews'), t('user.summit_ascents'),
    t('user.route_ascents'), t('user.mtp_ascents'), t('user.comments'),
  ];
  const radarValues = [
    profile.route_reviews_count, profile.mtp_reviews_count, profile.ascents_count,
    profile.route_ascents_count, profile.mtp_ascents_count, profile.comments_count,
  ].map(v => Number(v) || 0);

  // Website rule: "No public activity yet" exactly when the climber has 0 points.
  const hasActivity = Number(points_total) > 0;
  const styleLabel = (kind, style) => t(`site.guide.${kind}.style.${style}`, { defaultValue: style });

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
                <FontAwesomeIcon icon={SOCIAL_ICONS[key] ?? faLink} size={16} color={COLORS.primaryDark} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {profile.user_sites?.length > 0 && (
          <View style={styles.sitesRow}>
            {profile.user_sites.map(site => (
              <TouchableOpacity key={site.id} onPress={() => Linking.openURL(site.url)}>
                <IconText icon={faLink} style={styles.siteLink}>{hostnameOf(site.url)}</IconText>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.chipsRow}>
          <View style={styles.chip}><IconText icon={faUsers} style={styles.chipText}>{followers_count} {t('user.followers')}</IconText></View>
          <View style={styles.chip}><IconText icon={faUserPlus} style={styles.chipText}>{following_count} {t('user.following')}</IconText></View>
          <View style={[styles.chip, styles.pointsChip]}><IconText icon={faStar} iconColor={COLORS.ink} style={[styles.chipText, styles.pointsChipText]}>{points_total} {t('user.points')}</IconText></View>
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

        {!isSelf && (
          <ReportButton type="user" id={user.id} label={`${user.name} ${user.surname}`} style={styles.reportBtn} />
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
              <Text style={styles.subsectionTitle}>{t('user.recent_summit_ascents')}</Text>
              {profile.recent_ascents.map(a => (
                <ActivityRow key={`a${a.id}`} icon={faFlag} primary={a.summit_title ?? '—'} date={a.ascent_date} />
              ))}
            </>
          )}
          {profile.recent_route_ascents?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.recent_route_ascents')}</Text>
              {profile.recent_route_ascents.map(a => (
                <ActivityRow
                  key={`ra${a.id}`}
                  icon={faCheck}
                  primary={`${a.route_name ?? '—'}${a.route_grade ? ` (${a.route_grade})` : ''}`}
                  secondary={a.ascent_style ? styleLabel('route_ascent', a.ascent_style) : null}
                  date={a.ascent_date}
                />
              ))}
            </>
          )}
          {profile.recent_mtp_ascents?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.recent_mtp_ascents')}</Text>
              {profile.recent_mtp_ascents.map(a => (
                <ActivityRow
                  key={`ma${a.id}`}
                  icon={faCheck}
                  primary={a.mtp_name ?? '—'}
                  secondary={a.ascent_style ? styleLabel('mtp_ascent', a.ascent_style) : null}
                  date={a.ascent_date}
                />
              ))}
            </>
          )}
          {profile.recent_route_reviews?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.my_route_reviews')}</Text>
              {profile.recent_route_reviews.map(r => (
                <ActivityRow key={`r${r.id}`} icon={faStar} primary={r.route_name ?? '—'} secondary={r.text} date={r.created_at} />
              ))}
            </>
          )}
          {profile.recent_mtp_reviews?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.mtp_reviews')}</Text>
              {profile.recent_mtp_reviews.map(r => (
                <ActivityRow key={`m${r.id}`} icon={faStar} primary={r.mtp_name ?? '—'} secondary={r.text} date={r.created_at} />
              ))}
            </>
          )}
          {profile.recent_comments?.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>{t('user.my_comments')}</Text>
              {profile.recent_comments.map(c => (
                <ActivityRow key={`c${c.id}`} icon={faComment} primary={c.text} date={c.created_at} />
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
  reportBtn: { marginTop: 10 },
  center: { padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: COLORS.muted, fontSize: 14, fontFamily: FONTS.body },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  avatarWrap: { marginBottom: 12 },
  avatarImg: { width: 84, height: 84, borderRadius: 42, borderWidth: 2, borderColor: COLORS.primary },
  avatarFallback: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarText: { fontSize: 32, fontFamily: FONTS.displayBold, color: '#fff' },
  name: { fontSize: 28, lineHeight: 31, fontFamily: FONTS.displayBold, color: COLORS.ink, marginBottom: 4, textAlign: 'center' },
  bio: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.stone, textAlign: 'center', marginBottom: 8, lineHeight: 18 },
  socialRow: { flexDirection: 'row', marginBottom: 10, gap: 10 },
  socialIcon: { padding: 4 },
  sitesRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 10 },
  siteLink: { fontSize: 12, color: COLORS.primary, fontFamily: FONTS.bodySemi },
  socialIconText: { fontSize: 18, fontFamily: FONTS.body },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: COLORS.chalk, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontFamily: FONTS.bodySemi, color: COLORS.stone },
  pointsChip: { backgroundColor: COLORS.hold, borderColor: COLORS.hold },
  pointsChipText: { color: COLORS.ink },
  followBtn: { backgroundColor: COLORS.primary, borderRadius: 20, paddingHorizontal: 24, paddingVertical: 9, marginTop: 2 },
  followingBtn: { backgroundColor: COLORS.line },
  followBtnText: { color: '#fff', fontFamily: FONTS.bodyBold, fontSize: 13 },
  followingBtnText: { color: COLORS.stone },
  radarSection: { alignItems: 'center', paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.line, marginTop: 16 },
  countsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, paddingHorizontal: 12 },
  countCol: { alignItems: 'center', width: '33%', paddingVertical: 6 },
  countNum: { fontSize: 18, fontFamily: FONTS.bodyBold, color: COLORS.primary },
  countLabel: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.muted, marginTop: 2, textAlign: 'center', maxWidth: 70 },
  allUsersLink: { marginTop: 12 },
  allUsersLinkText: { color: COLORS.primary, fontFamily: FONTS.bodySemi, fontSize: 13 },
  activitySection: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  sectionTitle: { fontSize: 15, fontFamily: FONTS.bodyBold, color: COLORS.ink, marginBottom: 8 },
  subsectionTitle: { fontSize: 12, fontFamily: FONTS.bodyBold, color: COLORS.muted, textTransform: 'uppercase', marginTop: 12, marginBottom: 6, letterSpacing: 0.5 },
  activityRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.chalk },
  activityPrimary: { fontSize: 13, fontFamily: FONTS.bodySemi, color: COLORS.ink },
  activitySecondary: { fontSize: 12, fontFamily: FONTS.body, color: COLORS.stone, marginTop: 2 },
  activityDate: { fontSize: 10, fontFamily: FONTS.body, color: COLORS.muted, marginTop: 3 },
  viewFullBtn: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginHorizontal: 20, marginTop: 8, marginBottom: 20 },
  viewFullBtnText: { color: '#fff', fontFamily: FONTS.bodyBold, fontSize: 14 },
});
