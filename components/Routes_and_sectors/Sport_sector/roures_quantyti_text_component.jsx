import { faRoute, faHandBackFist, faLayerGroup, faMountain } from '@fortawesome/free-solid-svg-icons';
import StatTiles from '../../ui/StatTiles';
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

  const sectorsLabel = (n) => `${n} ${t('card.sectors')}`;
  return (
    <StatTiles
      items={[
        { icon: faRoute, value: totalRoutes, label: t('card.routes'), sub: sectorsLabel(totalSectors) },
        { icon: faLayerGroup, value: sportRoutes, label: t('site.guide.route_type_sport_climbing'), sub: sectorsLabel(sportSectors) },
        { icon: faHandBackFist, value: boulderRoutes, label: t('site.guide.route_type_bouldering'), sub: sectorsLabel(boulderSectors) },
        { icon: faMountain, value: mtpRoutes, label: t('site.guide.route_type_multi_pitch'), sub: sectorsLabel(mtpSectors) },
      ]}
    />
  );
}
