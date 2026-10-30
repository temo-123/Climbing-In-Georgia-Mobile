import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faBook, faRoute, faSun, faToolbox, faCircleInfo, faLocationDot } from '@fortawesome/free-solid-svg-icons';
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';

import CachedImage from '../CachedImage';
import EmbedBlock from '../EmbedBlock';
import HtmlContent from '../HtmlContent';
import ArticleSection, { SECTION_PADDING } from './ArticleSection';
import GlobalInfoBlock from './article_general_info';
import { composeGeneralInfo } from '../../utils/generalInfo';
import FavoriteHeart from '../guide/FavoriteHeart';
import GearChecklist from '../guide/GearChecklist';
import { imgUri } from '../../utils/api';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

const iframeConfig = {
  renderers: { iframe: IframeRenderer },
  customHTMLElementModels: { iframe: iframeModel },
  defaultWebViewProps: { onError: () => {}, onHttpError: () => {} },
  renderersProps: {
    iframe: {
      scalesPageToFit: true,
      webViewProps: {},
    },
  },
};

const PAGE_PADDING = 16;

// Article layout shared by every guide detail page: a 16:9 hero photo with
// the title on it, then the text sections in panels — the website's
// ArticleTextBlocksComponent order (text, how to get there + map, best time
// + weather, what you need, info & contacts, routes).
//
// `headerExtra` renders on the hero under the title (chips); `favoriteId`
// puts the favourite heart on the photo; `gearChecklist` adds the packing
// checklist under "What you need" (outdoor, ice, mountaineering);
// `afterHowGet` goes right after "How to get there" (gym hours + price);
// `afterImageContent` between the hero and the sections; `children` after
// the sections.
export default function ArticleBlock({
  local_data,
  global_data,
  global_info_data = {},
  imgBase = null,
  afterImageContent = null,
  headerUri = null,
  headerExtra = null,
  favoriteId = null,
  gearChecklist = false,
  afterHowGet = null,
  children,
}) {
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const textWidth = width - PAGE_PADDING * 2 - SECTION_PADDING * 2;
  const heroUri = headerUri || (imgBase != null && global_data.image ? imgUri(imgBase, global_data.image, global_data.updated_at) : null);
  const routeText = local_data.route || local_data.routes;

  function has(globalInfo, own) {
    return composeGeneralInfo(globalInfo, own).length > 0;
  }

  return (
    <View>
      <View style={styles.hero}>
        {heroUri ? (
          <CachedImage uri={heroUri} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={[styles.heroImage, styles.heroBlank]} />
        )}
        {!!favoriteId && <FavoriteHeart articleId={favoriteId} style={styles.heart} />}
        <View style={styles.heroText}>
          <Text style={styles.heroTitle}>{local_data.title}</Text>
          {headerExtra}
        </View>
      </View>

      {afterImageContent}

      {!!local_data.text && (
        <ArticleSection icon={faBook}>
          <HtmlContent
            html={local_data.text}
            contentWidth={textWidth}
            renderers={iframeConfig.renderers}
            WebView={WebView}
            customHTMLElementModels={iframeConfig.customHTMLElementModels}
            defaultWebViewProps={iframeConfig.defaultWebViewProps}
            renderersProps={iframeConfig.renderersProps}
          />
        </ArticleSection>
      )}

      {(!!local_data.how_get || !!global_data.map) && (
        <ArticleSection title={t('article.how_to_get')} icon={faLocationDot}>
          {!!local_data.how_get && <HtmlContent html={local_data.how_get} contentWidth={textWidth} />}
          {!!global_data.map && (
            <View style={styles.embed}>
              <EmbedBlock html={global_data.map} height={260} type="map" padding={PAGE_PADDING * 2 + SECTION_PADDING * 2} />
            </View>
          )}
        </ArticleSection>
      )}

      {afterHowGet}

      {(has(global_info_data.best_time, local_data.best_time) || !!global_data.weather) && (
        <ArticleSection title={t('article.best_time')} icon={faSun}>
          <GlobalInfoBlock global_info_data={global_info_data.best_time} actyve_block_data={local_data.best_time} contentWidth={textWidth} />
          {!!global_data.weather && (
            <View style={styles.embed}>
              <EmbedBlock html={global_data.weather} height={220} type="weather" padding={PAGE_PADDING * 2 + SECTION_PADDING * 2} />
            </View>
          )}
        </ArticleSection>
      )}

      {has(global_info_data.what_need_info, local_data.what_need) && (
        <ArticleSection title={t('article.what_need')} icon={faToolbox}>
          <GlobalInfoBlock global_info_data={global_info_data.what_need_info} actyve_block_data={local_data.what_need} contentWidth={textWidth} />
          {gearChecklist && (
            <GearChecklist
              html={composeGeneralInfo(global_info_data.what_need_info, local_data.what_need).join('')}
              articleId={global_data.id}
              title={local_data.title}
            />
          )}
        </ArticleSection>
      )}

      {has(global_info_data.info_block, local_data.info) && (
        <ArticleSection title={t('article.info_contacts')} icon={faCircleInfo}>
          <GlobalInfoBlock global_info_data={global_info_data.info_block} actyve_block_data={local_data.info} contentWidth={textWidth} />
        </ArticleSection>
      )}

      {has(global_info_data.routes_info, routeText) && (
        <ArticleSection title={t('article.routes')} icon={faRoute}>
          <GlobalInfoBlock global_info_data={global_info_data.routes_info} actyve_block_data={routeText} contentWidth={textWidth} />
        </ArticleSection>
      )}

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: RADII.xl,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: COLORS.ink,
    ...SHADOWS.md,
  },
  heroImage: { width: '100%', aspectRatio: 16 / 9 },
  heroBlank: { aspectRatio: 16 / 7, backgroundColor: COLORS.ink },
  heroText: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    backgroundColor: COLORS.ink,
    gap: 10,
  },
  heroTitle: { color: '#fff', fontFamily: FONTS.displayBold, fontSize: 30, lineHeight: 33 },
  heart: { position: 'absolute', top: 12, right: 12 },
  embed: { marginTop: 10, borderRadius: RADII.md, overflow: 'hidden' },
});
