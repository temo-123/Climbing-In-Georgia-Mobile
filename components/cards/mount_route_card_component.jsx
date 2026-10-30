import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { faMountain } from '@fortawesome/free-solid-svg-icons';
import ArticleCardShell from './ArticleCardShell';
import FavoriteHeart from '../guide/FavoriteHeart';
import { imgUri, IMG_BASES } from '../../utils/api';

export default function MountRouteCard({ cardData }) {
  const navigation = useNavigation();
  const gd = cardData.global_data;
  const chips = [];
  if (cardData.mount_masive) chips.push({ icon: faMountain, label: cardData.mount_masive, tone: 'accent' });
  if (gd.mount_grade) chips.push({ label: gd.mount_grade });

  return (
    <ArticleCardShell
      topRight={<FavoriteHeart articleId={gd.id} size="sm" />}
      imageUri={imgUri(IMG_BASES.mountRoute, gd.image, gd.updated_at)}
      title={cardData.locale_data.title}
      text={cardData.locale_data.short_description}
      chips={chips}
      onPress={() => navigation.navigate('mountain_route_page', { url_title: gd.url_title, mount_masive: cardData.mount_masive })}
    />
  );
}
