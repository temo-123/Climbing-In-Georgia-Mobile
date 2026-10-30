import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { useReducedMotion } from './useReducedMotion';
import { COLORS, RADII } from '../../assets/styles/styles';

// `cg-shimmer` skeletons: shimmering placeholders for async blocks instead
// of spinners. Still (no pulse) when the OS asks for reduced motion.
export function SkeletonBlock({ width = '100%', height = 14, radius = 6, style }) {
  const reduce = useReducedMotion();
  const pulse = useRef(new Animated.Value(0.55)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.55, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce]);
  return <Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: COLORS.chalk2, opacity: pulse }, style]} />;
}

// A list-card-shaped placeholder (16:9 photo + two text lines).
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <SkeletonBlock height={undefined} radius={0} style={styles.media} />
      <View style={styles.body}>
        <SkeletonBlock width="70%" height={18} />
        <SkeletonBlock width="45%" height={12} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
  },
  media: { width: '100%', aspectRatio: 16 / 9 },
  body: { padding: 14, gap: 10 },
});
