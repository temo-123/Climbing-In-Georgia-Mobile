import { StyleSheet, View, TouchableOpacity } from 'react-native';
import CachedImage from '../CachedImage';
import SectionTitle from '../ui/SectionTitle';
import { COLORS, RADII } from '../../assets/styles/styles';

// Shared grid for the photo sections on article pages (route photos,
// article galleries): even landscape 3:2 tiles like the website's
// ArticleImageGalleryComponent; tapping opens the full, uncropped photo.
export default function ArticleImageGrid({ title, uris, onPress, columns = 2 }) {
  if (!uris || uris.length === 0) return null;

  return (
    <View style={styles.section}>
      <SectionTitle align="left">{title}</SectionTitle>
      <View style={styles.grid}>
        {uris.map((uri, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
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
  section: { marginTop: 8, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  item: { padding: 4 },
  thumb: { width: '100%', aspectRatio: 3 / 2, borderRadius: RADII.md, backgroundColor: COLORS.chalk2 },
});
