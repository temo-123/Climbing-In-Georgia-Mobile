import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCircleCheck, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's ToastNotificationComponent: one toast at a time at the
// bottom, optionally with an action button (e.g. Undo). Use it instead of
// Alert.alert for reversible actions — `toast.show({ message, type, action:
// { label, handler } })`.
const ToastContext = createContext({ show: () => {} });

const ICONS = { success: faCircleCheck, error: faCircleExclamation, info: faCircleInfo };
const ICON_COLORS = { success: '#5fd3a5', error: '#ff8f8f', info: COLORS.hold };

export function ToastProvider({ children }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState(null);
  const anim = useRef(new Animated.Value(0)).current;
  const timer = useRef(null);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback(({ message, type = 'success', duration, action }) => {
    clearTimeout(timer.current);
    setToast({ message, type, action, key: Date.now() });
    anim.setValue(0);
    Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    timer.current = setTimeout(hide, duration ?? (action ? 5000 : 2800));
  }, [anim, hide]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, { bottom: insets.bottom + 20, opacity: anim, transform: [{ translateY }] }]}
        >
          <View style={styles.toast}>
            <FontAwesomeIcon icon={ICONS[toast.type] ?? faCircleInfo} size={16} color={ICON_COLORS[toast.type] ?? COLORS.hold} />
            <Text style={styles.message}>{toast.message}</Text>
            {!!toast.action && (
              <TouchableOpacity
                onPress={() => { hide(); toast.action.handler?.(); }}
                style={styles.action}
                hitSlop={8}
              >
                <Text style={styles.actionText}>{toast.action.label}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: { position: 'absolute', left: 16, right: 16, alignItems: 'center' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: 520,
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADII.md,
    backgroundColor: COLORS.ink,
    ...SHADOWS.md,
  },
  message: { flex: 1, color: '#fff', fontFamily: FONTS.bodySemi, fontSize: 14, lineHeight: 19 },
  action: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,194,51,0.16)' },
  actionText: { color: COLORS.hold, fontFamily: FONTS.bodyHeavy, fontSize: 13 },
});
