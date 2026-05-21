import { StyleSheet, Text, View } from 'react-native';
import api, { corsUrl } from '../../../utils/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES_URL = 'https://climbing.ge/api/get_sector/sectors_and_routes_quantity_by_categories/';

export default function IceRoutesQuantityText() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .post(corsUrl(CATEGORIES_URL), { route_categories: ['ice', 'drytooling'] })
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const ice = data.ice || {};
  const drytooling = data.drytooling || {};

  const iceRoutes  = ice.routes   ?? ice.routes_count   ?? 0;
  const iceSectors = ice.sectors  ?? ice.sectors_count  ?? 0;
  const dtRoutes   = drytooling.routes   ?? drytooling.routes_count   ?? 0;
  const dtSectors  = drytooling.sectors  ?? drytooling.sectors_count  ?? 0;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {t('routes_count.ice', { dtRoutes, dtSectors, iceRoutes, iceSectors })}
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
