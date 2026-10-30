import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faXmark, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Bottom sheet — the app's counterpart of the website's StackModal. Header
// (eyebrow + display-font title + close), scrollable body, optional sticky
// footer (actions). Tapping the dimmed backdrop closes it.
// `onBack` shows a back arrow (for sheets that switch between views).
export default function Sheet({ visible, onClose, onBack, title, eyebrow, children, footer, scroll = true }) {
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <Modal visible={!!visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.backdropWrap}>
          <Pressable style={styles.backdrop} onPress={onClose} />
          <View style={[styles.sheet, { paddingBottom: footer ? 0 : insets.bottom + 8 }]}>
            <View style={styles.handle} />
            <View style={styles.header}>
              {!!onBack && (
                <TouchableOpacity onPress={onBack} style={styles.close} hitSlop={10}>
                  <FontAwesomeIcon icon={faArrowLeft} size={15} color={COLORS.ink2} />
                </TouchableOpacity>
              )}
              <View style={styles.flex}>
                {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
                {!!title && <Text style={styles.title}>{title}</Text>}
              </View>
              <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={10}>
                <FontAwesomeIcon icon={faXmark} size={16} color={COLORS.ink2} />
              </TouchableOpacity>
            </View>
            <Body
              style={scroll ? styles.body : [styles.body, styles.bodyStatic]}
              contentContainerStyle={scroll ? styles.bodyContent : undefined}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </Body>
            {!!footer && <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View>}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdropWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(21,33,43,0.55)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: COLORS.chalk,
    borderTopLeftRadius: RADII.xl,
    borderTopRightRadius: RADII.xl,
    overflow: 'hidden',
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: COLORS.chalk2, marginTop: 8 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 12 },
  eyebrow: {
    fontFamily: FONTS.bodyHeavy,
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: COLORS.primary,
    marginBottom: 2,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 26, lineHeight: 29, color: COLORS.ink },
  close: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.chalk2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 0 },
  bodyStatic: { paddingHorizontal: 18 },
  bodyContent: { paddingHorizontal: 18, paddingBottom: 12 },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
    backgroundColor: COLORS.surface,
    gap: 10,
  },
});
