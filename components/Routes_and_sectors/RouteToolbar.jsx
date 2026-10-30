import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass, faXmark, faStar, faEyeSlash, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { GRADE_BANDS, PROJECT_COLOR, bandOf, routeMatches, isFiltering, routeStars, CLASSIC_STARS } from '../../utils/routeFilters';
import { useMyAscents } from '../../utils/myAscents';
import { alpha } from '../../utils/color';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's AreaRouteToolbarComponent ("Find a route"), above the
// sectors on outdoor and ice pages: count / "Showing N of M" + Clear,
// name-or-grade search, the area's grade spread as a coloured bar (one
// tappable segment per band), band chips with counts, Classics / Hide
// climbed, and for logged-in climbers "N of M routes climbed".
export default function RouteToolbar({ routes, tools, setTools }) {
  const { t } = useTranslation();
  const { loggedIn, ticked } = useMyAscents();

  const counts = useMemo(() => {
    const c = { project: 0 };
    GRADE_BANDS.forEach((b) => { c[b.key] = 0; });
    routes.forEach((r) => { c[bandOf(r)] += 1; });
    return c;
  }, [routes]);

  const total = routes.length;
  const shown = useMemo(() => routes.filter((r) => routeMatches(r, tools, ticked)).length, [routes, tools, ticked]);
  const climbed = useMemo(() => routes.filter((r) => ticked[r.id]).length, [routes, ticked]);
  const hasClassics = useMemo(() => routes.some((r) => routeStars(r) >= CLASSIC_STARS), [routes]);
  const filtering = isFiltering(tools);
  if (total === 0) return null;

  const set = (patch) => setTools({ ...tools, ...patch });
  const bands = [
    ...GRADE_BANDS.map((b) => ({ key: b.key, label: t(`site.guide.route_tools.bands.${b.key}`), sub: b.label, color: b.color })),
    { key: 'project', label: t('site.guide.route_tools.projects'), sub: '', color: PROJECT_COLOR },
  ].filter((b) => counts[b.key] > 0);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>{t('site.guide.route_tools.title')}</Text>
        <Text style={styles.count}>
          {filtering
            ? t('site.guide.route_tools.showing', { n: shown, total })
            : t('site.guide.route_tools.total', { n: total })}
        </Text>
      </View>

      <View style={styles.search}>
        <FontAwesomeIcon icon={faMagnifyingGlass} size={14} color={COLORS.muted} />
        <TextInput
          style={styles.searchInput}
          value={tools.query}
          onChangeText={(query) => set({ query })}
          placeholder={t('site.guide.route_tools.search_placeholder')}
          placeholderTextColor={COLORS.muted}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {!!tools.query && (
          <TouchableOpacity onPress={() => set({ query: '' })} hitSlop={10}>
            <FontAwesomeIcon icon={faXmark} size={14} color={COLORS.stone} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.spread}>
        {bands.map((b) => (
          <TouchableOpacity
            key={b.key}
            onPress={() => set({ band: tools.band === b.key ? 'all' : b.key })}
            style={[
              styles.segment,
              { flex: counts[b.key], backgroundColor: b.color },
              tools.band !== 'all' && tools.band !== b.key && styles.segmentDim,
            ]}
          />
        ))}
      </View>

      <View style={styles.chips}>
        {bands.map((b) => {
          const active = tools.band === b.key;
          return (
            <TouchableOpacity
              key={b.key}
              activeOpacity={0.8}
              onPress={() => set({ band: active ? 'all' : b.key })}
              style={[styles.chip, { borderColor: alpha(b.color, 0.45) }, active && { backgroundColor: b.color, borderColor: b.color }]}
            >
              <View style={[styles.dot, { backgroundColor: active ? '#fff' : b.color }]} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {b.label}{b.sub ? ` ${b.sub}` : ''} · {counts[b.key]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.toggles}>
        {hasClassics && (
          <Toggle icon={faStar} label={t('site.guide.route_tools.classics')} on={tools.classics} onPress={() => set({ classics: !tools.classics })} />
        )}
        {loggedIn && climbed > 0 && (
          <Toggle icon={faEyeSlash} label={t('site.guide.route_tools.hide_climbed')} on={tools.hideTicked} onPress={() => set({ hideTicked: !tools.hideTicked })} />
        )}
        {filtering && (
          <TouchableOpacity onPress={() => setTools({ band: 'all', classics: false, hideTicked: false, query: '' })} style={styles.clear}>
            <Text style={styles.clearText}>{t('site.guide.route_tools.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loggedIn && (
        <View style={styles.progress}>
          <View style={styles.progressHead}>
            <FontAwesomeIcon icon={faCircleCheck} size={13} color={COLORS.success} />
            <Text style={styles.progressText}>{t('site.guide.route_tools.progress', { n: climbed, total })}</Text>
          </View>
          <View style={styles.bar}>
            <View style={[styles.barFill, { width: `${Math.round((climbed / total) * 100)}%` }]} />
          </View>
        </View>
      )}

      {filtering && shown === 0 && <Text style={styles.none}>{t('site.guide.route_tools.no_match')}</Text>}
    </View>
  );
}

function Toggle({ icon, label, on, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.toggle, on && styles.toggleOn]}>
      <FontAwesomeIcon icon={icon} size={12} color={on ? COLORS.ink : COLORS.stone} />
      <Text style={[styles.toggleText, on && styles.toggleTextOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
    marginBottom: 14,
    gap: 12,
    ...SHADOWS.sm,
  },
  head: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 },
  title: { fontFamily: FONTS.displayBold, fontSize: 22, color: COLORS.ink },
  count: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.stone },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.chalk,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, paddingVertical: 10, fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink },
  spread: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 },
  segment: { height: '100%' },
  segmentDim: { opacity: 0.25 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: RADII.pill,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.ink2 },
  chipTextActive: { color: '#fff' },
  toggles: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.chalk2,
  },
  toggleOn: { backgroundColor: COLORS.hold },
  toggleText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.stone },
  toggleTextOn: { color: COLORS.ink },
  clear: { paddingHorizontal: 6, paddingVertical: 6 },
  clearText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.primary, textDecorationLine: 'underline' },
  progress: { gap: 6 },
  progressHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.ink2 },
  bar: { height: 8, borderRadius: 4, backgroundColor: COLORS.chalk2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.success },
  none: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.rope, textAlign: 'center' },
});
