import { faIcicles, faHammer } from '@fortawesome/free-solid-svg-icons';
import StatTiles from '../../ui/StatTiles';
import api, { corsUrl, API_BASE_URL } from '../../../utils/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES_URL = `${API_BASE_URL}/get_sector/sectors_and_routes_quantity_by_categories/`;

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
    <StatTiles
      items={[
        { icon: faIcicles, value: iceRoutes, label: t('site.guide.route_type_ice_climbing'), sub: `${iceSectors} ${t('card.sectors')}` },
        { icon: faHammer, value: dtRoutes, label: t('site.guide.route_type_dry_tooling'), sub: `${dtSectors} ${t('card.sectors')}` },
      ]}
    />
  );
}
