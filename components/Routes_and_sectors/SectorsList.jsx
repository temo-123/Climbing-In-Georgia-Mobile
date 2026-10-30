import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';

import RoutesTable, { BoulderTable } from './Sport_sector/items/routes_tab';
import MultiPitchTab from './Sport_sector/items/multi_pitch_tab';
import SectorInfoBar from './Sport_sector/items/sector_info_bar';
import IceRoutesTable from './Ice_sectors/items/ice_routes_tab';
import ImageViewerModal from '../ImageViewerModal';
import NaturalImage from '../ui/NaturalImage';
import SectionTitle from '../ui/SectionTitle';
import { SkeletonBlock } from '../ui/Skeleton';
import api, { corsUrl, imgUri, API_BASE_URL, IMG_BASES } from '../../utils/api';
import { loadSectorsData, saveSectorsData } from '../../utils/offlineStorage';
import { useRefetchOnReconnect } from '../../utils/useRefetchOnReconnect';
import RouteToolbar from './RouteToolbar';
import { RouteToolsContext, useRouteTools } from './routeTools';
import { useMyAscents } from '../../utils/myAscents';
import { newRouteTools, isFiltering, routeMatches, flatRoutes } from '../../utils/routeFilters';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// Flatten the API's Type A (direct sector) / Type B (sub-area with
// `local_images` + `sectors`) items into sector items, in page order.
export function flattenSectors(data) {
  const out = [];
  for (const item of data || []) {
    if (item.local_images) out.push(...(item.sectors || []));
    else out.push(item);
  }
  return out;
}

// One sector panel: name, info chips, topos (natural shape, tap to zoom),
// then its sport / boulder / multi-pitch (or ice) tables, filtered by the
// area route finder when there is one.
function SectorPanel({ item, isIce, onImagePress }) {
  const { t } = useTranslation();
  const tools = useRouteTools();
  const { ticked } = useMyAscents();
  const routes = [...(item.sport_routes || []), ...(item.boulder_route || [])];
  const allHidden = !!tools && isFiltering(tools.tools) && routes.length > 0
    && !routes.some((r) => routeMatches(r, tools.tools, ticked));
  const sector = item.sector;
  const images = (item.sector_imgs || [])
    .map((img, i) => ({ key: img.id ?? i, uri: imgUri(IMG_BASES.sector, img.image, img.updated_at) }))
    .filter((img) => img.uri);
  const uris = images.map((img) => img.uri);

  return (
    <View style={styles.panel}>
      <Text style={styles.eyebrow}>{t('sector.label')}</Text>
      {!!sector?.name && <Text style={styles.sectorName}>{sector.name}</Text>}
      {!isIce && <SectorInfoBar sector={sector} />}

      {images.map((img, idx) => (
        <TouchableOpacity key={img.key} activeOpacity={0.9} onPress={() => onImagePress(uris, idx)} style={styles.topo}>
          <NaturalImage uri={img.uri} />
        </TouchableOpacity>
      ))}

      {allHidden && <Text style={styles.none}>{t('site.guide.route_tools.none_in_sector')}</Text>}

      {isIce ? (
        <IceRoutesTable routes={item.sport_routes} />
      ) : (
        <>
          <RoutesTable routes={item.sport_routes} />
          <BoulderTable routes={item.boulder_route} />
          <MultiPitchTab mtps={item.mtps} />
        </>
      )}
    </View>
  );
}

// `withTools` adds the area route finder (outdoor and ice area pages).
export default function SectorsList({ article_id, isIce = false, onImagePress, header, onLoaded, withTools = true }) {
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [tools, setTools] = useState(newRouteTools);
  const [isLoading, setLoading] = useState(true);
  const [viewer, setViewer] = useState(null);

  const handleImagePress = (uris, idx) => {
    if (onImagePress) onImagePress(uris, idx);
    else setViewer({ uris, idx });
  };

  const load = useCallback(() => {
    if (!article_id) { setLoading(false); return; }
    api.get(corsUrl(`${API_BASE_URL}/get_sector/get_sector_and_routes/${article_id}`))
      .then(({ data }) => {
        setData(Array.isArray(data) ? data : []);
        saveSectorsData(article_id, data);
        setLoading(false);
      })
      .catch(async () => {
        const cached = await loadSectorsData(article_id);
        if (cached) setData(cached);
        setLoading(false);
      });
  }, [article_id]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  useRefetchOnReconnect(load);
  useEffect(() => { if (!isLoading) onLoaded?.(data); }, [isLoading, data]);
  const allRoutes = useMemo(() => flatRoutes(data), [data]);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <SkeletonBlock width="40%" height={22} />
        <SkeletonBlock height={180} radius={RADII.md} />
        <SkeletonBlock height={120} radius={RADII.md} />
      </View>
    );
  }

  if (data.length === 0) return null;

  return (
    <RouteToolsContext.Provider value={withTools ? { tools, setTools } : null}>
    <View style={styles.container}>
      <SectionTitle align="left">{t('sectors_block.title')}</SectionTitle>
      {header}
      {withTools && <RouteToolbar routes={allRoutes} tools={tools} setTools={setTools} />}

      {data.map((item, index) => {
        if (item.local_images) {
          const localImages = (item.local_images || [])
            .map((li) => ({ ...li, uri: imgUri(IMG_BASES.sectorLocal, li.image, li.updated_at) }))
            .filter((li) => li.uri);
          const localUris = localImages.map((li) => li.uri);

          return (
            <View key={index} style={styles.group}>
              {localImages.map((li, idx) => (
                <View key={li.id ?? idx} style={styles.groupHead}>
                  {!!li.title && <Text style={styles.groupTitle}>{li.title}</Text>}
                  <TouchableOpacity activeOpacity={0.9} onPress={() => handleImagePress(localUris, idx)}>
                    <NaturalImage uri={li.uri} />
                  </TouchableOpacity>
                </View>
              ))}
              {(item.sectors || []).map((sub, subIdx) => (
                <SectorPanel key={sub.sector?.id ?? subIdx} item={sub} isIce={isIce} onImagePress={handleImagePress} />
              ))}
            </View>
          );
        }

        return <SectorPanel key={item.sector?.id ?? index} item={item} isIce={isIce} onImagePress={handleImagePress} />;
      })}

      {!onImagePress && (
        <ImageViewerModal
          uris={viewer?.uris}
          initialIndex={viewer?.idx ?? 0}
          visible={viewer != null}
          onClose={() => setViewer(null)}
        />
      )}
    </View>
    </RouteToolsContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 8, paddingBottom: 16 },
  loading: { gap: 12, marginVertical: 16 },
  group: {
    marginBottom: 6,
    paddingLeft: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.hold,
  },
  groupHead: { marginBottom: 12 },
  groupTitle: { fontFamily: FONTS.displayBold, fontSize: 24, color: COLORS.ink, marginBottom: 8 },
  panel: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.lg,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.sm,
  },
  eyebrow: { fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: COLORS.primary },
  sectorName: { fontFamily: FONTS.displayBold, fontSize: 26, lineHeight: 30, color: COLORS.ink },
  topo: { marginTop: 4, marginBottom: 8 },
  none: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.muted, fontStyle: 'italic', marginVertical: 6 },
});
