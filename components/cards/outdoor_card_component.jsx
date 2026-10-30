import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import ArticleCardShell from './ArticleCardShell';
import FavoriteHeart from '../guide/FavoriteHeart';
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from '../../utils/api';
import { countSectorsAndRoutes } from '../../utils/sectorCount';
import { loadSectorsData, saveSectorsData } from '../../utils/offlineStorage';

export default function OutdoorCard({ cardData }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const gd = cardData.global_data;
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    if (!gd.id) return;
    api.get(corsUrl(`${API_BASE_URL}/get_sector/get_sector_and_routes/${gd.id}`))
      .then(({ data }) => {
        saveSectorsData(gd.id, data);
        setCounts(countSectorsAndRoutes(data));
      })
      .catch(async () => {
        const cached = await loadSectorsData(gd.id);
        if (cached) setCounts(countSectorsAndRoutes(cached));
      });
  }, [gd.id]);

  const chips = [];
  if (counts?.sectors > 0) chips.push({ label: `${counts.sectors} ${t('card.sectors')}`, tone: 'accent' });
  if (counts?.routes > 0) chips.push({ label: `${counts.routes} ${t('card.routes')}`, tone: 'accent' });
  if (counts?.mtps > 0) chips.push({ label: `${counts.mtps} ${t('card.mtp')}`, tone: 'accent' });

  return (
    <ArticleCardShell
      topRight={<FavoriteHeart articleId={gd.id} size="sm" />}
      imageUri={imgUri(IMG_BASES.outdoor, gd.image, gd.updated_at)}
      title={cardData.locale_data.title}
      text={cardData.locale_data.short_description}
      chips={chips}
      onPress={() => navigation.navigate('outdoor_page', gd.url_title)}
    />
  );
}
