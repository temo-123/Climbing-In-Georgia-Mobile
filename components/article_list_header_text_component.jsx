import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { COLORS } from '../assets/styles/styles';

const descriptionTagsStyles = {
  body: { fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20 },
  p: { margin: 0 },
};

export default function ArticleListHeaderText({ title, description }) {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.accent} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.accent} />
      </View>
      {!!description ? (
        <RenderHtml
          contentWidth={width - 16}
          source={{ html: description }}
          tagsStyles={descriptionTagsStyles}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  accent: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});
