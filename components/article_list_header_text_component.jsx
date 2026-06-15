import { StyleSheet, Text, View } from 'react-native';

export default function ArticleListHeaderText({ title, description }) {
  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View style={styles.accent} />
        <Text style={styles.title}>{title}</Text>
        <View style={styles.accent} />
      </View>
      {!!description ? (
        <Text style={styles.description}>{description}</Text>
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
    backgroundColor: '#279fbb',
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
  description: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 8,
    lineHeight: 20,
  },
});
