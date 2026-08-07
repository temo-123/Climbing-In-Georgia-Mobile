import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useTranslation } from 'react-i18next';
import api, { corsUrl, API_BASE_URL } from "../../../utils/api";
import EmbedBlock from "../../EmbedBlock";
import HtmlContent from "../../HtmlContent";
import { useLocale } from "../../../utils/LocaleContext";
import { saveMassiveData, loadMassiveData } from "../../../utils/offlineStorage";
import { COLORS } from '../../../assets/styles/styles';

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function HtmlBlock({ html, width }) {
  return <HtmlContent html={html} contentWidth={width} />;
}

export default function MassiveSection({ mountMasiveName, articleId }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [open, setOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (articleId) fetchData();
  }, [articleId, locale]);

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!open && !fetched) {
      fetchData();
    }
    setOpen((v) => !v);
  }

  function fetchData() {
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
        <Text style={styles.arrow}>{open ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {open ? renderContent() : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 10,
    marginBottom: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#e8f6fb",
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerLabel: {
    fontSize: 13,
    color: "#555",
  },
  headerName: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  arrow: {
    fontSize: 12,
    color: COLORS.primary,
  },
  body: {
    padding: 14,
    backgroundColor: "#fff",
  },
  loader: {
    marginVertical: 16,
  },
  subSection: {
    marginTop: 12,
  },
  subTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.primary,
    paddingBottom: 4,
  },
  noData: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
  },
});
