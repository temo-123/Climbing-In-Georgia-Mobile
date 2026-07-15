import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSun, faMoon, faCloudSun, faCloudMoon,
  faPersonWalking,
  faChildren, faPeopleGroup,
  faArrowUp, faMountain, faAnglesUp, faDiamondTurnRight,
  faHelmetSafety,
} from '@fortawesome/free-solid-svg-icons';
import { useTranslation } from 'react-i18next';

function InfoChip({ icon, label, color, bg }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg || '#f0f0f0' }]}>
      {icon && <FontAwesomeIcon icon={icon} size={14} color={color || '#555'} />}
      {label ? <Text style={[styles.chipLabel, { color: color || '#555' }]}>{label}</Text> : null}
    </View>
  );
}

export default function SectorInfoBar({ sector }) {
  const { t } = useTranslation();
  if (!sector) return null;

  const chips = [];

  if (sector.all_day_in_sun)
    chips.push(<InfoChip key="sun"    icon={faSun}       label={t('sector.full_sun')}   color="#c0860a" bg="#fff8e1" />);
  if (sector.all_day_in_shade)
    chips.push(<InfoChip key="shade"  icon={faMoon}      label={t('sector.full_shade')} color="#546e7a" bg="#eceff1" />);
  if (sector.in_the_shade_afternoon)
    chips.push(<InfoChip key="pmsh"   icon={faCloudSun}  label={t('sector.shade_pm')}   color="#607d8b" bg="#eceff1" />);
  if (sector.in_the_shade_befornoon)
    chips.push(<InfoChip key="amsh"   icon={faCloudMoon} label={t('sector.shade_am')}   color="#607d8b" bg="#eceff1" />);
  if (sector.in_shade_after_10)
    chips.push(<InfoChip key="sh10"   icon={faCloudSun}  label={t('sector.shade_10')}   color="#607d8b" bg="#eceff1" />);
  if (sector.in_shade_after_15)
    chips.push(<InfoChip key="sh15"   icon={faCloudSun}  label={t('sector.shade_15')}   color="#607d8b" bg="#eceff1" />);

  if (sector.wolking_time)
    chips.push(<InfoChip key="walk"   icon={faPersonWalking} label={`${sector.wolking_time} min`} color="#2e7d32" bg="#e8f5e9" />);
  if (sector.is_helmet === 1)
    chips.push(<InfoChip key="helm"   icon={faHelmetSafety}  label={t('sector.helmet')} color="#b71c1c" bg="#ffebee" />);
  if (sector.for_kids)
    chips.push(<InfoChip key="kids"   icon={faChildren}  label={t('sector.kids')}       color="#00695c" bg="#e0f2f1" />);
  if (sector.for_family)
    chips.push(<InfoChip key="fam"    icon={faPeopleGroup} label={t('sector.family')}   color="#00695c" bg="#e0f2f1" />);

  if (sector.vertical)
    chips.push(<InfoChip key="vert"   icon={faArrowUp}   label={t('sector.vertical')}   color="#1565c0" bg="#e3f2fd" />);
  if (sector.overhang)
    chips.push(<InfoChip key="over"   icon={faDiamondTurnRight} label={t('sector.overhang')} color="#6a1b9a" bg="#f3e5f5" />);
  if (sector.slabby)
    chips.push(<InfoChip key="slab"   icon={faAnglesUp}  label={t('sector.slab')}       color="#e65100" bg="#fff3e0" />);
  if (sector.roof)
    chips.push(<InfoChip key="roof"   icon={faMountain}  label={t('sector.roof')}       color="#880e4f" bg="#fce4ec" />);

  if (chips.length === 0) return null;

  return <View style={styles.bar}>{chips}</View>;
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});
