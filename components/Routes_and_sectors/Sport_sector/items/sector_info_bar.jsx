import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSun, faMoon, faCloudSun, faCloudMoon,
  faPersonWalking,
  faChildren, faPeopleGroup,
  faArrowUp, faMountain, faAnglesUp, faDiamondTurnRight,
} from '@fortawesome/free-solid-svg-icons';

const HELMET_IMG = require('../../../../assets/xxx/helmet.png');

function InfoChip({ icon, localIcon, label, color, bg }) {
  return (
    <View style={[styles.chip, { backgroundColor: bg || '#f0f0f0' }]}>
      {icon ? (
        <FontAwesomeIcon icon={icon} size={14} color={color || '#555'} />
      ) : localIcon ? (
        <Image source={localIcon} style={[styles.localIcon, { tintColor: color }]} />
      ) : null}
      {label ? <Text style={[styles.chipLabel, { color: color || '#555' }]}>{label}</Text> : null}
    </View>
  );
}

export default function SectorInfoBar({ sector }) {
  if (!sector) return null;

  const chips = [];

  // ── Sun / shade ────────────────────────────────────────
  if (sector.all_day_in_sun)
    chips.push(<InfoChip key="sun"    icon={faSun}       label="Full sun"     color="#c0860a" bg="#fff8e1" />);
  if (sector.all_day_in_shade)
    chips.push(<InfoChip key="shade"  icon={faMoon}      label="Full shade"   color="#546e7a" bg="#eceff1" />);
  if (sector.in_the_shade_afternoon)
    chips.push(<InfoChip key="pmsh"   icon={faCloudSun}  label="Shade PM"     color="#607d8b" bg="#eceff1" />);
  if (sector.in_the_shade_befornoon)
    chips.push(<InfoChip key="amsh"   icon={faCloudMoon} label="Shade AM"     color="#607d8b" bg="#eceff1" />);
  if (sector.in_shade_after_10)
    chips.push(<InfoChip key="sh10"   icon={faCloudSun}  label="Shade 10+"    color="#607d8b" bg="#eceff1" />);
  if (sector.in_shade_after_15)
    chips.push(<InfoChip key="sh15"   icon={faCloudSun}  label="Shade 15+"    color="#607d8b" bg="#eceff1" />);

  // ── Practical info ─────────────────────────────────────
  if (sector.wolking_time)
    chips.push(<InfoChip key="walk"   icon={faPersonWalking} label={`${sector.wolking_time} min`} color="#2e7d32" bg="#e8f5e9" />);
  if (sector.is_helmet === 1)
    chips.push(<InfoChip key="helm"   localIcon={HELMET_IMG} label="Helmet"   color="#b71c1c" bg="#ffebee" />);
  if (sector.for_kids)
    chips.push(<InfoChip key="kids"   icon={faChildren}  label="Kids"         color="#00695c" bg="#e0f2f1" />);
  if (sector.for_family)
    chips.push(<InfoChip key="fam"    icon={faPeopleGroup} label="Family"     color="#00695c" bg="#e0f2f1" />);

  // ── Climbing character ─────────────────────────────────
  if (sector.vertical)
    chips.push(<InfoChip key="vert"   icon={faArrowUp}   label="Vertical"     color="#1565c0" bg="#e3f2fd" />);
  if (sector.overhang)
    chips.push(<InfoChip key="over"   icon={faDiamondTurnRight} label="Overhang" color="#6a1b9a" bg="#f3e5f5" />);
  if (sector.slabby)
    chips.push(<InfoChip key="slab"   icon={faAnglesUp}  label="Slab"         color="#e65100" bg="#fff3e0" />);
  if (sector.roof)
    chips.push(<InfoChip key="roof"   icon={faMountain}  label="Roof"         color="#880e4f" bg="#fce4ec" />);

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
  localIcon: {
    width: 14,
    height: 14,
    resizeMode: 'contain',
  },
});
