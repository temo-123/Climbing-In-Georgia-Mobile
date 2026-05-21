import React from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Text, Dimensions } from 'react-native';
import { Image } from 'expo-image';

const { width, height } = Dimensions.get('window');

export default function ImageViewerModal({ uri, visible, onClose }) {
  if (!uri) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Image source={{ uri }} style={styles.image} contentFit="contain" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
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
  image: {
    width,
    height: height * 0.8,
  },
});
