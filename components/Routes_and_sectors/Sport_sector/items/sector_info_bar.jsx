import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  faSun, faMoon, faCloudSun, faCloudMoon,
  faPersonWalking,
  faChildren, faPeopleGroup,
  faArrowUp, faMountain, faAnglesUp, faDiamondTurnRight,
  faHelmetSafety,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';
import Chip from '../../../ui/Chip';

// The API sends these flags as booleans (older rows as 1/0).
const on = (v) => v === true || v === 1 || v === '1';

// Sector facts as chips (the website's SectorIconTip row): sun / shade,
// approach time, helmet, kids / family, wall angle.
export default function SectorInfoBar({ sector }) {
  const { t } = useTranslation();
  if (!sector) return null;

  const chips = [];
  if (on(sector.all_day_in_sun)) chips.push({ key: 'sun', icon: faSun, label: t('sector.full_sun'), tone: 'hold' });
  if (on(sector.all_day_in_shade)) chips.push({ key: 'shade', icon: faMoon, label: t('sector.full_shade') });
  if (on(sector.in_the_shade_afternoon)) chips.push({ key: 'pmsh', icon: faCloudSun, label: t('sector.shade_pm') });
  if (on(sector.in_the_shade_befornoon)) chips.push({ key: 'amsh', icon: faCloudMoon, label: t('sector.shade_am') });
  if (on(sector.in_shade_after_10)) chips.push({ key: 'sh10', icon: faCloudSun, label: t('sector.shade_10') });
  if (on(sector.in_shade_after_15)) chips.push({ key: 'sh15', icon: faCloudSun, label: t('sector.shade_15') });
  if (sector.wolking_time) chips.push({ key: 'walk', icon: faPersonWalking, label: `${sector.wolking_time} min`, tone: 'success' });
  if (on(sector.is_helmet)) chips.push({ key: 'helm', icon: faHelmetSafety, label: t('sector.helmet'), tone: 'danger' });
  if (on(sector.for_kids)) chips.push({ key: 'kids', icon: faChildren, label: t('sector.kids'), tone: 'accent' });
  if (on(sector.for_family)) chips.push({ key: 'fam', icon: faPeopleGroup, label: t('sector.family'), tone: 'accent' });
  if (on(sector.vertical)) chips.push({ key: 'vert', icon: faArrowUp, label: t('sector.vertical') });
  if (on(sector.overhang)) chips.push({ key: 'over', icon: faDiamondTurnRight, label: t('sector.overhang') });
  if (on(sector.slabby)) chips.push({ key: 'slab', icon: faAnglesUp, label: t('sector.slab') });
  if (on(sector.roof)) chips.push({ key: 'roof', icon: faMountain, label: t('sector.roof') });

  if (chips.length === 0) return null;

  return (
    <View style={styles.bar}>
      {chips.map(({ key, ...c }) => <Chip key={key} {...c} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 10 },
});
