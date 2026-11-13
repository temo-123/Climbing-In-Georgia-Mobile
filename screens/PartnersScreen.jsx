import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faPlus, faLock, faLocationDot, faCalendarDays, faChartSimple, faLanguage, faArrowUpRightFromSquare,
  faTrashCan, faUser, faAddressCard,
} from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL, corsUrl } from '../utils/api';
import { useAuth, useAccount } from '../utils/AuthContext';
import { useLocale } from '../utils/LocaleContext';
import { toDate, dayMonth, dayMonthYear, startOfDay } from '../utils/eventDates';
import { timeAgo } from '../utils/timeAgo';
import { apiErrorMessage } from '../utils/apiError';
import { openArticle } from '../utils/articleRoutes';
import PageHead from '../components/ui/PageHead';
import Button from '../components/ui/Button';
import Chip from '../components/ui/Chip';
import Avatar from '../components/ui/Avatar';
import Sheet from '../components/ui/Sheet';
import FilterChips from '../components/FilterChips';
import EmptyState from '../components/EmptyState';
import PageFooter from '../components/PageFooter';
import { SkeletonList } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/Toast';
import PartnerPostForm from '../components/partners/PartnerPostForm';
import { DISCIPLINES, LANGUAGES, tripDays, isOngoing } from '../components/partners/partnerRules';
import { COLORS, FONTS, RADII, SHADOWS } from '../assets/styles/styles';

// The website's /partners (PartnersPageComponent): climbers post a trip
// (dates, discipline, languages, area or place, grades, note, contact).
// Guests see who goes where and when; notes / contacts come back blank for
// them (has_note / has_contact), so those show as locked.
export default function PartnersScreen({ navigation }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { isUnderage } = useAccount();
  const toast = useToast();
  const [posts, setPosts] = useState(null);
  const [mine, setMine] = useState([]);
  const [areas, setAreas] = useState([]);
  const [discipline, setDiscipline] = useState(null);
  const [language, setLanguage] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(null);

  const load = useCallback((isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    api.get(`${API_BASE_URL}/get_partner_post/get_partner_posts`)
      .then(({ data }) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts((p) => p ?? []))
      .finally(() => setRefreshing(false));
    if (user) {
      api.get(`${API_BASE_URL}/set_partner_post/get_my_partner_posts`)
        .then(({ data }) => setMine((Array.isArray(data) ? data : []).map((x) => (typeof x === 'object' ? x.id : x))))
        .catch(() => {});
    } else {
      setMine([]);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Area names for the form and the cards (the posts API only sends id /
  // category / url_title) — same three lists the website loads.
  useEffect(() => {
    const lang = locale === 'ka' ? 'ka' : 'en';
    Promise.all(['outdoor', 'ice', 'indoor'].map((category) =>
      api.get(corsUrl(`${API_BASE_URL}/get_article/get_locale_articles/${category}/${lang}`))
        .then(({ data }) => (Array.isArray(data) ? data : [])
          .filter((a) => a?.global_data && a?.locale_data)
          .map((a) => ({ id: a.global_data.id, category, url_title: a.global_data.url_title, title: a.locale_data.title })))
        .catch(() => []),
    )).then((lists) => setAreas(lists.flat().sort((a, b) => a.title.localeCompare(b.title))));
  }, [locale]);

  const placeOf = (p) => (p.article && areas.find((a) => a.id === p.article.id)?.title) || p.place || '—';

  const sections = useMemo(() => {
    const list = (posts || [])
      .filter((p) => !discipline || p.discipline === discipline)
      .filter((p) => !language || (p.languages || []).includes(language));
    const now = list.filter((p) => isOngoing(p));
    const later = list.filter((p) => !isOngoing(p));
    const byDay = new Map();
    later.forEach((p) => {
      const key = String(p.climb_date).slice(0, 10);
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key).push(p);
    });
    const out = [];
    if (now.length) out.push({ key: 'now', title: t('site.guide.partners.on_trip_now'), data: now });
    [...byDay.keys()].sort().forEach((k) => {
      const d = toDate(k);
      out.push({ key: k, title: d ? dayMonthYear(d, locale) : k, data: byDay.get(k) });
    });
    return out;
  }, [posts, discipline, language, locale, t]);

  const languagesPresent = useMemo(() => {
    const set = new Set((posts || []).flatMap((p) => p.languages || []));
    return LANGUAGES.filter((l) => set.has(l));
  }, [posts]);

  function startPost() {
    if (!user) {
      Alert.alert(t('site.guide.partners.new_post'), t('site.guide.partners.login_needed'), [
        { text: t('site.common.cancel'), style: 'cancel' },
        { text: t('auth.nav_login'), onPress: () => navigation.navigate('login') },
      ]);
      return;
    }
    setCreating(true);
  }

  function remove(p) {
    Alert.alert(t('site.guide.partners.delete_confirm'), '', [
      { text: t('site.common.cancel'), style: 'cancel' },
      {
        text: t('site.common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/set_partner_post/del_my_partner_post/${p.id}`);
            setOpen(null);
            load();
          } catch (err) {
            toast.show({ type: 'error', message: apiErrorMessage(err, t) });
          }
        },
      },
    ]);
  }

  function dateRange(p) {
    const s = toDate(p.climb_date);
    const e = toDate(p.end_date);
    if (!s) return '';
    if (!e || startOfDay(s).getTime() === startOfDay(e).getTime()) return dayMonth(s, locale);
    return `${dayMonth(s, locale)} – ${dayMonth(e, locale)}`;
  }

  const header = (
    <View>
      <PageHead art="partners" title={t('site.guide.partners.title')} lead={t('site.guide.partners.lead')}>
        {!isUnderage && <Button variant="hold" block={false} icon={faPlus} title={t('site.guide.partners.new_post')} onPress={startPost} style={styles.cta} />}
      </PageHead>
      {!user && (
        <View style={styles.gate}>
          <FontAwesomeIcon icon={faLock} size={16} color={COLORS.primaryDark} />
          <View style={styles.flex}>
            <Text style={styles.gateTitle}>{t('site.guide.partners.gate_title')}</Text>
            <Text style={styles.gateText}>{t('site.guide.partners.gate_text')}</Text>
          </View>
          <Button small block={false} title={t('auth.nav_login')} onPress={() => navigation.navigate('login')} />
        </View>
      )}
      {(posts?.length ?? 0) > 0 && (
        <>
          <FilterChips
            options={[{ key: null, label: t('site.guide.partners.all') }, ...DISCIPLINES.map((d) => ({ key: d, label: t(`site.guide.partners.disciplines.${d}`) }))]}
            selected={discipline}
            onSelect={setDiscipline}
          />
          {languagesPresent.length > 1 && (
            <View style={styles.langFilter}>
              <FilterChips
                options={[{ key: null, label: t('site.guide.partners.any_language') }, ...languagesPresent.map((l) => ({ key: l, label: t(`site.guide.partners.languages.${l}`) }))]}
                selected={language}
                onSelect={setLanguage}
              />
            </View>
          )}
        </>
      )}
    </View>
  );

  if (posts === null) return <SkeletonList count={3} />;

  return (
    <View style={styles.flex}>
      <SectionList
        sections={sections}
        keyExtractor={(p) => String(p.id)}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[COLORS.primary]} />}
        ListEmptyComponent={<EmptyState message={t('site.guide.partners.empty')} />}
        ListFooterComponent={<PageFooter />}
        ListFooterComponentStyle={styles.footer}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHead}>
            <View style={[styles.dayDot, section.key === 'now' && styles.dayDotNow]} />
            <Text style={styles.dayTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: p }) => {
          const days = tripDays(p);
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={() => setOpen(p)}>
              <View style={styles.cardHead}>
                <Avatar user={p.user} size={38} />
                <View style={styles.flex}>
                  <Text style={styles.name} numberOfLines={1}>{p.user ? `${p.user.name} ${p.user.surname ?? ''}` : '—'}</Text>
                  <Text style={styles.posted}>{t('site.guide.partners.posted')} {timeAgo(p.created_at, t, locale)}</Text>
                </View>
                <Chip small tone="accent" label={t(`site.guide.partners.disciplines.${p.discipline}`)} />
              </View>
              <View style={styles.facts}>
                <Fact icon={faCalendarDays} text={`${dateRange(p)}${days > 1 ? ` · ${t('site.guide.partners.n_days', { n: days })}` : ''}`} />
                <Fact icon={faLocationDot} text={placeOf(p)} />
                {!!(p.grade_from || p.grade_to) && <Fact icon={faChartSimple} text={[p.grade_from, p.grade_to].filter(Boolean).join(' – ')} />}
                {!!p.languages?.length && <Fact icon={faLanguage} text={p.languages.map((l) => t(`site.guide.partners.languages.${l}`)).join(', ')} />}
              </View>
              <View style={styles.badges}>
                {isOngoing(p) && <Chip small tone="success" label={t('site.guide.partners.happening_now')} />}
                {!user && (p.has_note || p.has_contact) && <Chip small icon={faLock} label={t('site.guide.partners.locked')} />}
              </View>
              {!!p.note && <Text style={styles.note} numberOfLines={2}>{p.note}</Text>}
            </TouchableOpacity>
          );
        }}
      />

      <Sheet visible={creating} onClose={() => setCreating(false)} eyebrow={t('site.guide.partners.new_post')} title={t('site.guide.partners.post_title')}>
        {creating && (
          <PartnerPostForm
            areas={areas}
            onDone={() => { setCreating(false); toast.show({ message: t('partners_app.published') }); load(); }}
          />
        )}
      </Sheet>

      {!!open && (
        <Sheet visible onClose={() => setOpen(null)} eyebrow={t('site.guide.partners.post_title')} title={open.user ? `${open.user.name} ${open.user.surname ?? ''}` : '—'}>
          <View style={styles.detail}>
            <Chip tone="accent" label={t(`site.guide.partners.disciplines.${open.discipline}`)} />
            <Row label={t('site.guide.partners.when')} value={`${dateRange(open)}${tripDays(open) > 1 ? ` · ${t('site.guide.partners.n_days', { n: tripDays(open) })}` : ''}`} />
            <Row label={t('site.guide.partners.where')} value={placeOf(open)} />
            {!!(open.grade_from || open.grade_to) && <Row label={t('site.guide.partners.grades')} value={[open.grade_from, open.grade_to].filter(Boolean).join(' – ')} />}
            {!!open.languages?.length && <Row label={t('site.guide.partners.speaks')} value={open.languages.map((l) => t(`site.guide.partners.languages.${l}`)).join(', ')} />}
            {!!open.note && <Text style={styles.detailNote}>{open.note}</Text>}
            {!!open.contact && (
              <TouchableOpacity onPress={() => /^https?:\/\//.test(open.contact) && Linking.openURL(open.contact)} style={styles.contact}>
                <FontAwesomeIcon icon={faAddressCard} size={14} color={COLORS.primaryDark} />
                <Text selectable style={styles.contactText}>{open.contact}</Text>
              </TouchableOpacity>
            )}
            {!user && (open.has_note || open.has_contact) && (
              <Button variant="hold" icon={faLock} title={t('site.guide.partners.locked')} onPress={() => { setOpen(null); navigation.navigate('login'); }} />
            )}
            {!!user && !open.contact && <Text style={styles.hint}>{t('site.guide.partners.contact_via_profile')}</Text>}
            <View style={styles.detailActions}>
              {!!open.user && (
                <Button small variant="outline" icon={faUser} style={styles.flex} title={t('site.guide.partners.view_profile')} onPress={() => { const id = open.user.id; setOpen(null); navigation.navigate('climber_profile', { userId: id }); }} />
              )}
              {!!open.article && (
                <Button small variant="outline" icon={faArrowUpRightFromSquare} style={styles.flex} title={t('site.guide.partners.open_area')} onPress={() => { const a = open.article; setOpen(null); openArticle(navigation, a.category, a.url_title); }} />
              )}
            </View>
            {mine.includes(open.id) && (
              <Button small variant="danger" icon={faTrashCan} title={t('site.common.delete')} onPress={() => remove(open)} />
            )}
          </View>
        </Sheet>
      )}
    </View>
  );
}

function Fact({ icon, text }) {
  return (
    <View style={styles.fact}>
      <FontAwesomeIcon icon={icon} size={12} color={COLORS.primary} />
      <Text style={styles.factText} numberOfLines={1}>{text}</Text>
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { padding: 16, flexGrow: 1 },
  footer: { flexGrow: 1, justifyContent: 'flex-end' },
  cta: { marginTop: 16 },
  gate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 14,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: 'rgba(31,147,176,0.25)',
  },
  gateTitle: { fontFamily: FONTS.bodyHeavy, fontSize: 14, color: COLORS.ink },
  gateText: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: COLORS.stone, marginTop: 2 },
  langFilter: { marginTop: 8 },
  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 8 },
  dayDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  dayDotNow: { backgroundColor: COLORS.success },
  dayTitle: { fontFamily: FONTS.displayBold, fontSize: 20, color: COLORS.ink },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 10,
    gap: 10,
    ...SHADOWS.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: FONTS.bodyBold, fontSize: 15, color: COLORS.ink },
  posted: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
  facts: { gap: 5 },
  fact: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  factText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.ink2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  note: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  detail: { gap: 10, paddingBottom: 8 },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: COLORS.chalk2 },
  rowLabel: { width: 96, fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.muted },
  rowValue: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
  detailNote: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.ink2 },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.primarySoft,
  },
  contactText: { flex: 1, fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.primaryDark },
  hint: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: COLORS.muted },
  detailActions: { flexDirection: 'row', gap: 10 },
});
