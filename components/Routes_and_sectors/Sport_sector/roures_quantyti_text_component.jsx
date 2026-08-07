import { StyleSheet, Text, View } from 'react-native';
import api, { corsUrl, API_BASE_URL } from '../../../utils/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES_URL = `${API_BASE_URL}/get_sector/sectors_and_routes_quantity_by_categories/`;

export default function RoutesQuantityText() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .post(corsUrl(CATEGORIES_URL), { route_categories: ['sport', 'boulder', 'mtp'] })
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const categories = data.categories || {};
  const sport = categories.sport || {};
  const boulder = categories.boulder || {};
  const mtp = categories.mtp || {};

  const sportRoutes    = sport.sport_routes     ?? 0;
  const sportSectors   = sport.sectors          ?? 0;
  const boulderRoutes  = boulder.boulder_routes ?? 0;
  const boulderSectors = boulder.sectors        ?? 0;
  const mtpRoutes      = mtp.mtps              ?? 0;
  const mtpSectors     = mtp.sectors            ?? 0;

  const totalSectors = sportSectors + boulderSectors + mtpSectors;
  const totalRoutes  = sportRoutes + boulderRoutes + mtpRoutes;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {t('routes_count.sport', {
          totalSectors, totalRoutes,
          sportRoutes, sportSectors,
          boulderRoutes, boulderSectors,
          mtpRoutes, mtpSectors,
        })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
