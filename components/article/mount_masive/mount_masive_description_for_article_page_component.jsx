import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from "../../../utils/api";
import EmbedBlock from "../../EmbedBlock";
import HtmlContent from "../../HtmlContent";
import { useLocale } from "../../../utils/LocaleContext";
import { saveMassiveData, loadMassiveData } from "../../../utils/offlineStorage";
import { useRefetchOnReconnect } from "../../../utils/useRefetchOnReconnect";
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII, SHADOWS } from '../../../assets/styles/styles';


function HtmlBlock({ html, width }) {
  return <HtmlContent html={html} contentWidth={width - 60} />;
}

export default function MassiveSection({ mountMasiveName, articleId }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [open, setOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { width } = useWindowDimensions();

  const fetchData = useCallback(() => {
    if (!articleId) return;
    setLoading(true);
    api
      .get(corsUrl(`${API_BASE_URL}/get_mount/on_page/${locale}/` + articleId))
      .then(({ data }) => {
        if (typeof data === "object" && data !== null) {
          setContent(data);
          saveMassiveData(locale, articleId, data);
        }
      })
      .catch(async () => {
        const cached = await loadMassiveData(locale, articleId);
        if (cached) setContent(cached);
      })
      .finally(() => {
        setLoading(false);
        setFetched(true);
      });
  }, [articleId, locale]);

  useEffect(() => {
    if (articleId) fetchData();
  }, [articleId, locale]);

  // Only re-fetch on reconnect once the section has actually been loaded —
  // it's lazy (collapsed sections never fetched at all shouldn't suddenly
  // fire a request just because connectivity changed).
  useRefetchOnReconnect(useCallback(() => {
    if (fetched) fetchData();
  }, [fetched, fetchData]));

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!open && !fetched) {
      fetchData();
    }
    setOpen((v) => !v);
  }

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color={COLORS.primary} style={styles.loader} />;
    }

    if (content) {
      const localeData = content.locale_data || {};
      const globalData = content.global_data || {};
      const hasContent =
        localeData.description || localeData.text || localeData.best_time ||
        localeData.how_get || globalData.map || globalData.weather;

      if (!hasContent) {
        return (
          <View style={styles.body}>
            <Text style={styles.noData}>
              {t('massive.no_data', { name: mountMasiveName })}
            </Text>
          </View>
        );
      }

      return (
        <View style={styles.body}>
          {localeData.description ? (
            <HtmlBlock html={localeData.description} width={width} />
          ) : null}

          {localeData.text ? (
            <View style={styles.subSection}>
              <HtmlBlock html={localeData.text} width={width} />
            </View>
          ) : null}

          {localeData.best_time ? (
            <View style={styles.subSection}>
              <Text style={styles.subTitle}>{t('massive.best_time')}</Text>
              <HtmlBlock html={localeData.best_time} width={width} />
            </View>
          ) : null}

          {globalData.weather ? (
            <EmbedBlock html={globalData.weather} height={220} padding={60} type="weather" />
          ) : null}

          {localeData.how_get ? (
            <View style={styles.subSection}>
              <Text style={styles.subTitle}>{t('massive.how_to_get')}</Text>
              <HtmlBlock html={localeData.how_get} width={width} />
            </View>
          ) : null}

          {globalData.map ? (
            <EmbedBlock html={globalData.map} height={280} padding={60} type="map" />
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.body}>
        <Text style={styles.noData}>
          {t('massive.no_data', { name: mountMasiveName })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>{t('massive.label')}</Text>
          <Text style={styles.headerName}>{mountMasiveName || "—"}</Text>
        </View>
        <FontAwesomeIcon icon={open ? faChevronUp : faChevronDown} size={13} color={COLORS.hold} />
      </TouchableOpacity>

      {open ? renderContent() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.lg,
    marginBottom: 14,
    overflow: "hidden",
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.ink,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLeft: { flex: 1 },
  headerLabel: {
    fontSize: 10,
    fontFamily: FONTS.bodyHeavy,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: COLORS.hold,
  },
  headerName: { fontSize: 22, fontFamily: FONTS.displayBold, color: "#fff" },
  body: { padding: 16 },
  loader: { marginVertical: 16 },
  subSection: { marginTop: 12 },
  subTitle: { fontSize: 20, fontFamily: FONTS.displayBold, color: COLORS.ink, marginBottom: 6 },
  noData: { fontSize: 13, fontFamily: FONTS.body, color: COLORS.muted, fontStyle: "italic" },
});
