import { StyleSheet, Text, View } from 'react-native';

export default function ArticleListHeaderText({ title, description }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.divider} />
      {!!description && (
        <Text style={styles.description}>{description}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    width: '80%',
    backgroundColor: '#ccc',
    marginVertical: 8,
  },
  description: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 20,
  },
});
