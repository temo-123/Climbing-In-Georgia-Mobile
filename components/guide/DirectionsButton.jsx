import React from 'react';
import { Linking, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons';
import Button from '../ui/Button';

// The website's DirectionsButtonComponent: `articles.parking` holds
// "lat, lng" or a Google Maps link (admin global article form, outdoor /
// ice / indoor). Coordinates become a Maps directions link; hidden when empty.
export function directionsUrl(parking) {
  const v = String(parking || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) return v;
  const m = v.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
  return m ? `https://www.google.com/maps/dir/?api=1&destination=${m[1]},${m[2]}` : null;
}

export default function DirectionsButton({ parking }) {
  const { t } = useTranslation();
  const url = directionsUrl(parking);
  if (!url) return null;
  return (
    <Button
      variant="outline"
      icon={faDiamondTurnRight}
      title={t('site.guide.directions.button')}
      onPress={() => Linking.openURL(url).catch(() => {})}
      style={styles.btn}
    />
  );
}

const styles = StyleSheet.create({ btn: { marginBottom: 14 } });
