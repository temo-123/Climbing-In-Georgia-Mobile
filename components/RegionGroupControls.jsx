import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import FilterChips from './FilterChips';
import Segmented from './ui/Segmented';
import { COLORS, FONTS } from '../assets/styles/styles';

// Region chips + "By region / Flat" switch — identical on the outdoor, ice,
// indoor and mountaineering lists (see utils/regionSections.js). The switch
// shows only while All is selected and nothing is searched. `groupLabel`
// replaces "By region" (the mountaineering list groups by mountain).
export default function RegionGroupControls({ options, region, onRegion, flat, onFlat, searching, groupLabel }) {
  const { t } = useTranslation();
  if (options.length <= 2) return null;
  return (
    <View>
      <View style={styles.gap}>
        <FilterChips options={options} selected={region} onSelect={onRegion} />
      </View>
      {region == null && !searching && (
        <Segmented
          style={styles.gap}
          options={[{ key: false, label: groupLabel || t('site.guide.group.by_region') }, { key: true, label: t('site.guide.group.flat') }]}
          value={flat}
          onChange={onFlat}
        />
      )}
    </View>
  );
}

// Section header used by all three lists.
export function RegionSectionHeader({ section }) {
  if (!section.title) return null;
  return (
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={1}>{section.title}</Text>
      <Text style={styles.count}>{section.count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  gap: { marginBottom: 12 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 6, marginBottom: 10, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: COLORS.hold,
  },
  title: { flexShrink: 1, fontFamily: FONTS.displayBold, fontSize: 22, color: COLORS.ink },
  count: {
    fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.stone,
    backgroundColor: COLORS.chalk2, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden',
  },
});
