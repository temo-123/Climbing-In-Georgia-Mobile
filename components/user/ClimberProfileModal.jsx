import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import ClimberProfileContent from './ClimberProfileContent';
import { COLORS } from '../../assets/styles/styles';

// Quick-view modal opened from the climbers list grid — mirrors
// ClimberProfileModalComponent.vue's "quick view + View full profile" pattern.
export default function ClimberProfileModal({ visible, userId, onClose, onViewFullProfile }) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t('user.climber_profile')}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {userId != null && (
              <ClimberProfileContent
                userId={userId}
                compact
                onViewFullProfile={onViewFullProfile ? () => onViewFullProfile(userId) : undefined}
              />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '88%' },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  closeIcon: { fontSize: 20, color: '#999' },
  scrollContent: { paddingBottom: 20 },
});
