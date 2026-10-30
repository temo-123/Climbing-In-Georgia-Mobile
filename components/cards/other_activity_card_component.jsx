import React from 'react';
import { useNavigation } from '@react-navigation/native';
import ArticleCardShell from './ArticleCardShell';
import FavoriteHeart from '../guide/FavoriteHeart';
import { imgUri, IMG_BASES } from '../../utils/api';

export default function OtherActivityCard({ cardData }) {
  const navigation = useNavigation();
  const gd = cardData.global_data;
  return (
    <ArticleCardShell
      topRight={<FavoriteHeart articleId={gd.id} size="sm" />}
      imageUri={imgUri(IMG_BASES.other, gd.image, gd.updated_at)}
      title={cardData.locale_data.title}
      text={cardData.locale_data.short_description}
      onPress={() => navigation.navigate('other_activity_page', gd.url_title)}
    />
  );
}
