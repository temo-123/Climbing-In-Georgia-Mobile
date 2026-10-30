// Guide article category → app screen + card image base. Detail screens
// take the article's url_title as their route param (mountain routes take
// an object). Categories without an app page (tech tips, news…) → null.
import { IMG_BASES } from './api';

const MAP = {
  outdoor: { screen: 'outdoor_page', img: IMG_BASES.outdoor },
  ice: { screen: 'ice_page', img: IMG_BASES.ice },
  indoor: { screen: 'indoor_page', img: IMG_BASES.indoor },
  mount_route: { screen: 'mountain_route_page', img: IMG_BASES.mountRoute },
  other: { screen: 'other_activity_page', img: IMG_BASES.other },
};

export function articleImageBase(category) {
  return MAP[category]?.img ?? IMG_BASES.outdoor;
}

export function canOpenArticle(category) {
  return !!MAP[category];
}

export function openArticle(navigation, category, urlTitle) {
  const m = MAP[category];
  if (!m || !urlTitle) return false;
  navigation.navigate(m.screen, category === 'mount_route' ? { url_title: urlTitle } : urlTitle);
  return true;
}
