import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faWandMagicSparkles, faChevronDown, faChevronUp, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL, imgUri, IMG_BASES } from '../../utils/api';
import { GRADE_BANDS } from '../../utils/routeFilters';
import CachedImage from '../CachedImage';
import ChoiceChips from '../ui/ChoiceChips';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's CragPickerComponent, a collapsed panel under the outdoor
// list head: grade band + sun preference + family friendly → the three
// areas with the most routes in that band (GET get_outdoor/get_area_profiles,
// cached server-side for an hour). Summer pre-selects shade, winter sun.
const SUN_OPTIONS = ['any', 'sun', 'shade', 'morning_shade', 'afternoon_shade'];

export default function CragPicker({ areas }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const month = new Date().getMonth();
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState(null);
  const [grade, setGrade] = useState('mid');
  const [sun, setSun] = useState([5, 6, 7].includes(month) ? 'shade' : ([11, 0, 1].includes(month) ? 'sun' : 'any'));
  const [family, setFamily] = useState(false);

  const seasonHint = [5, 6, 7].includes(month)
    ? t('site.guide.crag_picker.hint_summer')
    : ([11, 0, 1].includes(month) ? t('site.guide.crag_picker.hint_winter') : '');

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && profiles === null) {
      api.get(`${API_BASE_URL}/get_outdoor/get_area_profiles`)
        .then(({ data }) => setProfiles(Array.isArray(data) ? data : []))
        .catch(() => setProfiles([]));
    }
  }

  // areas: [{ global_data, locale_data }] from the outdoor list
  const byId = useMemo(() => {
    const m = {};
    (areas || []).forEach((a) => { if (a?.global_data) m[a.global_data.id] = a; });
    return m;
  }, [areas]);

  const bandLabel = GRADE_BANDS.find((b) => b.key === grade)?.label ?? '';
  const results = useMemo(() => (profiles || [])
    .filter((p) => byId[p.article_id])
    .filter((p) => sun === 'any' || p[sun])
    .filter((p) => !family || p.family)
    .map((p) => {
      const count = grade === 'any' ? p.routes : (p.bands?.[grade] || 0);
      const why = [];
      if (sun !== 'any') why.push(t(`site.guide.crag_picker.sun_${sun}`));
      if (p.family) why.push(t('site.guide.crag_picker.family_short'));
      if (p.max_walk) why.push(t('site.guide.crag_picker.walk', { n: p.max_walk }));
      return { count, why, area: byId[p.article_id] };
    })
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3), [profiles, byId, sun, family, grade, t]);

  return (
    <View style={styles.card}>
      <TouchableOpacity style={styles.head} onPress={toggle} activeOpacity={0.8}>
        <View style={styles.icon}>
          <FontAwesomeIcon icon={faWandMagicSparkles} size={15} color={COLORS.ink} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>{t('site.guide.crag_picker.title')}</Text>
          {!open && <Text style={styles.lead} numberOfLines={2}>{t('site.guide.crag_picker.lead')}</Text>}
        </View>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} size={14} color={COLORS.stone} />
      </TouchableOpacity>

      {open && (
        <View style={styles.body}>
          <Text style={styles.label}>{t('site.guide.crag_picker.grade')}</Text>
          <ChoiceChips
            scroll
            options={[{ key: 'any', label: t('site.guide.crag_picker.any') }, ...GRADE_BANDS.map((b) => ({ key: b.key, label: b.label }))]}
            value={grade}
            onChange={setGrade}
          />
          <Text style={styles.label}>{t('site.guide.crag_picker.sun')}</Text>
          <ChoiceChips
            options={SUN_OPTIONS.map((o) => ({ key: o, label: t(`site.guide.crag_picker.sun_${o}`) }))}
            value={sun}
            onChange={setSun}
          />
          {!!seasonHint && <Text style={styles.hint}>{seasonHint}</Text>}
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>{t('site.guide.crag_picker.family')}</Text>
            <Switch value={family} onValueChange={setFamily} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />
          </View>

          {profiles === null ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : results.length === 0 ? (
            <Text style={styles.none}>{t('site.guide.crag_picker.none')}</Text>
          ) : results.map(({ area, count, why }) => {
            const gd = area.global_data;
            return (
              <TouchableOpacity
                key={gd.id}
                style={styles.result}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('outdoor_page', gd.url_title)}
              >
                <CachedImage uri={imgUri(IMG_BASES.outdoor, gd.image, gd.updated_at)} style={styles.thumb} contentFit="cover" />
                <View style={styles.flex}>
                  <Text style={styles.resultTitle} numberOfLines={2}>{area.locale_data?.title}</Text>
                  <Text style={styles.resultCount}>
                    {count} {grade === 'any' ? t('site.guide.crag_picker.routes') : t('site.guide.crag_picker.routes_in', { band: bandLabel })}
                  </Text>
                  {!!why.length && <Text style={styles.why} numberOfLines={2}>{why.join(' · ')}</Text>}
                </View>
                <FontAwesomeIcon icon={faArrowRight} size={13} color={COLORS.primary} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    marginBottom: 14,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  icon: { width: 38, height: 38, borderRadius: 12, backgroundColor: COLORS.hold, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONTS.displayBold, fontSize: 21, color: COLORS.ink },
  lead: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: COLORS.stone, marginTop: 1 },
  body: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  label: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2, marginTop: 4 },
  hint: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.primaryDark },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  switchLabel: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2, flex: 1 },
  loader: { marginVertical: 12 },
  none: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: RADII.md,
    backgroundColor: COLORS.chalk,
  },
  thumb: { width: 72, height: 54, borderRadius: RADII.sm },
  resultTitle: { fontFamily: FONTS.displayBold, fontSize: 17, lineHeight: 19, color: COLORS.ink },
  resultCount: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.primaryDark, marginTop: 2 },
  why: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.stone, marginTop: 1 },
});
