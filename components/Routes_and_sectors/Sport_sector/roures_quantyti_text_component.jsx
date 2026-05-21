import { StyleSheet, Text, View } from 'react-native';
import api, { corsUrl } from '../../../utils/api';
import React, { useState, useEffect } from 'react';

const CATEGORIES_URL = 'https://climbing.ge/api/get_sector/sectors_and_routes_quantity_by_categories/';

export default function RoutesQuantityText() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .post(corsUrl(CATEGORIES_URL), { route_categories: ['sport', 'boulder', 'mtp'] })
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const sport = data.sport || {};
  const boulder = data.boulder || {};
  const mtp = data.mtp || {};

  const sportRoutes = sport.routes ?? sport.routes_count ?? 0;
  const sportSectors = sport.sectors ?? sport.sectors_count ?? 0;
  const boulderRoutes = boulder.routes ?? boulder.routes_count ?? 0;
  const boulderSectors = boulder.sectors ?? boulder.sectors_count ?? 0;
  const mtpRoutes = mtp.routes ?? mtp.routes_count ?? 0;
  const mtpSectors = mtp.sectors ?? mtp.sectors_count ?? 0;

  const totalSectors = sportSectors + boulderSectors + mtpSectors;
  const totalRoutes = sportRoutes + boulderRoutes + mtpRoutes;

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Georgia is waiting for you! Find {totalSectors} sectors with {totalRoutes} routes for Sport Climbing and Bouldering and Multi-Pitch!{'\n'}
        All climbing spots are ready to welcome you. {sportRoutes} Sport Climbing routes in {sportSectors} sectors. {boulderRoutes} Bouldering routes in {boulderSectors} sectors. {mtpRoutes} Multi-Pitch routes in {mtpSectors} sectors.{'\n'}
        Your next adventure is waiting. Come and explore Georgia's amazing climbing areas today!
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
