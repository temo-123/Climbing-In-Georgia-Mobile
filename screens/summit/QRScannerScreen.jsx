import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTranslation } from 'react-i18next';

const SUMMIT_ASCENT_PATTERN = /\/make_ascent\/(\d+)/;

export default function QRScannerScreen({ navigation }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const cooldown = useRef(false);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  function handleBarcodeScanned({ data }) {
    if (scanned || cooldown.current) return;
    cooldown.current = true;
    setScanned(true);

    const match = data.match(SUMMIT_ASCENT_PATTERN);
    if (match) {
      const summit_id = parseInt(match[1], 10);
      navigation.replace('submit_ascent', { summit_id, title: `Summit #${summit_id}` });
    } else {
      Alert.alert(
        t('summit.invalid_qr_title'),
        t('summit.invalid_qr_message'),
        [{ text: 'OK', onPress: () => { setScanned(false); cooldown.current = false; } }],
      );
    }
  }

  if (!permission) {
    return <View style={styles.center}><Text style={styles.infoText}>{t('summit.camera_loading')}</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.infoText}>{t('summit.camera_permission')}</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission} activeOpacity={0.8}>
          <Text style={styles.btnText}>{t('summit.grant_permission')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanWindow}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.hint}>{t('summit.qr_hint')}</Text>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelBtnText}>{t('summit.cancel_scan')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const WINDOW_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#111' },
  infoText: { color: '#fff', fontSize: 15, textAlign: 'center', marginBottom: 20 },
  btn: { backgroundColor: '#279fbb', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 28 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  overlay: { ...StyleSheet.absoluteFillObject },
  topOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middleRow: { flexDirection: 'row', height: WINDOW_SIZE },
  sideOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  scanWindow: {
    width: WINDOW_SIZE,
    height: WINDOW_SIZE,
    position: 'relative',
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 16,
  },
  hint: { color: 'rgba(255,255,255,0.85)', fontSize: 14, textAlign: 'center' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 32,
  },
  cancelBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },

  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#279fbb',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
});
