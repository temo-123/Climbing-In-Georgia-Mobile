import React, { useState, useRef, useEffect } from 'react';
import {
  Modal, StyleSheet, TouchableOpacity, View, Text,
  FlatList, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import CachedImage from './CachedImage';

const { width, height } = Dimensions.get('window');
const IMG_HEIGHT = height * 0.85;

function ZoomableImage({ uri }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onStart(() => { savedScale.value = scale.value; })
    .onUpdate(e => {
      scale.value = Math.max(1, Math.min(5, savedScale.value * e.scale));
    })
    .onEnd(() => {
      if (scale.value < 1.15) scale.value = withSpring(1);
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
      } else {
        scale.value = withSpring(2.5);
      }
    });

  const gesture = Gesture.Simultaneous(pinch, doubleTap);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.imageSlide}>
        <Animated.View style={animStyle}>
          <CachedImage uri={uri} style={styles.image} contentFit="contain" />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

export default function ImageViewerModal({ uri, uris, initialIndex = 0, visible, onClose }) {
  const images = uris || (uri ? [uri] : []);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const listRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    setCurrentIndex(initialIndex);
    const timer = setTimeout(() => {
      if (listRef.current && images.length > 1) {
        listRef.current.scrollToIndex({ index: initialIndex, animated: false });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [visible, initialIndex]);

  if (images.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {images.length > 1 && (
            <Text style={styles.counter}>{currentIndex + 1} / {images.length}</Text>
          )}

          <FlatList
            ref={listRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => i.toString()}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setCurrentIndex(idx);
            }}
            renderItem={({ item }) => <ZoomableImage uri={item} />}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.93)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSlide: {
    width,
    height: IMG_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width,
    height: IMG_HEIGHT,
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  closeText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  counter: {
    position: 'absolute',
    top: 54,
    left: 20,
    zIndex: 10,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 15,
  },
});
