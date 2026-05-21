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
import RenderHtml from "react-native-render-html";
import { useWindowDimensions } from "react-native";
import api, { corsUrl } from "../../../utils/api";
import EmbedBlock from "../../EmbedBlock";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function HtmlBlock({ html, width }) {
  if (!html) return null;
  return (
    <RenderHtml
      contentWidth={width}
      source={{ html }}
    />
  );
}

export default function MassiveSection({ mountMasiveName, articleId }) {
  const [open, setOpen] = useState(true);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { width } = useWindowDimensions();

  useEffect(() => {
    if (articleId) fetchData();
  }, [articleId]);

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
      .get(corsUrl("https://climbing.ge/api/get_mount/on_page/en/" + articleId))
      .then(({ data }) => {
        if (typeof data === "object" && data !== null) {
          setContent(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false);
        setFetched(true);
      });
  }

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator color="#279fbb" style={styles.loader} />;
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
              Detailed information about {mountMasiveName} is not available yet.
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
              <Text style={styles.subTitle}>Best Time to Climb</Text>
              <HtmlBlock html={localeData.best_time} width={width} />
            </View>
          ) : null}

          {globalData.weather ? (
            <EmbedBlock html={globalData.weather} height={220} padding={60} />
          ) : null}

          {localeData.how_get ? (
            <View style={styles.subSection}>
              <Text style={styles.subTitle}>How to Get There</Text>
              <HtmlBlock html={localeData.how_get} width={width} />
            </View>
          ) : null}

          {globalData.map ? (
            <EmbedBlock html={globalData.map} height={280} padding={60} />
          ) : null}
        </View>
      );
    }

    return (
      <View style={styles.body}>
        <Text style={styles.noData}>
          Detailed information about {mountMasiveName} is not available yet.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.header} onPress={toggle} activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>Mountain Massive</Text>
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
    borderColor: "#279fbb",
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
    color: "#279fbb",
  },
  arrow: {
    fontSize: 12,
    color: "#279fbb",
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
    borderBottomColor: "#279fbb",
    paddingBottom: 4,
  },
  noData: {
    fontSize: 13,
    color: "#888",
    fontStyle: "italic",
  },
});
