import { faIcicles, faHammer } from '@fortawesome/free-solid-svg-icons';
import StatTiles from '../../ui/StatTiles';
import api, { corsUrl, API_BASE_URL } from '../../../utils/api';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CATEGORIES_URL = `${API_BASE_URL}/get_sector/sectors_and_routes_quantity_by_categories/`;

// POST get_sector/sectors_and_routes_quantity_by_categories
//   { route_categories: ['ice', 'dry'] }
//   → { categories: { ice: { sectors, ice_routes }, dry: { sectors, dry_routes } } }
// (backend SectorController: the dry-tooling category key is `dry`, and the
// numbers are under `categories` — same shape as the sport tiles.)
export default function IceRoutesQuantityText() {
  const { t } = useTranslation();
  const [data, setData] = useState(null);

  useEffect(() => {
    api
      .post(corsUrl(CATEGORIES_URL), { route_categories: ['ice', 'dry'] })
      .then(({ data }) => setData(data))
      .catch(() => {});
  }, []);

  if (!data) return null;

  const categories = data.categories || {};
  const ice = categories.ice || {};
  const dry = categories.dry || {};

  const iceRoutes  = Number(ice.ice_routes) || 0;
  const iceSectors = Number(ice.sectors) || 0;
  const dtRoutes   = Number(dry.dry_routes) || 0;
  const dtSectors  = Number(dry.sectors) || 0;

  return (
    <StatTiles
      items={[
        { icon: faIcicles, value: iceRoutes, label: t('site.guide.route_type_ice_climbing'), sub: `${iceSectors} ${t('card.sectors')}` },
        { icon: faHammer, value: dtRoutes, label: t('site.guide.route_type_dry_tooling'), sub: `${dtSectors} ${t('card.sectors')}` },
      ]}
    />
  );
}
