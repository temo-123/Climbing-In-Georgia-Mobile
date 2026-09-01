import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import CachedImage from '../CachedImage';
import { gStyle } from '../../assets/styles/styles';

// Shared grid for the photo sections on article pages (sector galleries,
// route photos, article galleries) so they all share one layout/style
// instead of each screen re-implementing its own grid.
export default function ArticleImageGrid({ title, uris, onPress, columns = 3 }) {
  if (!uris || uris.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={gStyle.h2}>{title}</Text>
      <View style={styles.grid}>
        {uris.map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.item, { width: `${100 / columns}%` }]}
            onPress={() => onPress(idx)}
          >
            <CachedImage uri={uri} style={styles.thumb} contentFit="cover" />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16, marginBottom: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  item: { padding: 2 },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: 4 },
});
