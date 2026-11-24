import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFlag, faBan } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../utils/AuthContext';
import { blockUser } from '../../utils/blockedUsers';
import { useToast } from '../ui/Toast';
import ReportSheet from './ReportSheet';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Confirms, then blocks `author` ({ id, name, surname, … }).
export function useConfirmBlock() {
  const { t } = useTranslation();
  const toast = useToast();
  return (author, onBlocked) => {
    if (!author?.id) return;
    const name = `${author.name ?? ''} ${author.surname ?? ''}`.trim();
    Alert.alert(t('block.confirm_title', { name }), t('block.confirm_text'), [
      { text: t('user.cancel'), style: 'cancel' },
      {
        text: t('block.button'),
        style: 'destructive',
        onPress: async () => {
          await blockUser(author);
          toast.show({ message: t('block.done', { name }) });
          onBlocked?.();
        },
      },
    ]);
  };
}

// "Report · Block" links under a piece of user content. Hidden on the
// viewer's own content. `author` may be null (guest content) → report only.
export default function ModerationActions({ type, id, label, author, onBlocked, style, compact }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const confirmBlock = useConfirmBlock();
  const [reporting, setReporting] = useState(false);

  const isMine = !!(author?.id && user && Number(author.id) === Number(user.id));
  if (isMine) return null;

  return (
    <View style={[styles.row, style]}>
      {id != null && (
        <TouchableOpacity onPress={() => setReporting(true)} style={styles.action} hitSlop={6} accessibilityRole="button">
          <FontAwesomeIcon icon={faFlag} size={10} color={COLORS.stone} />
          <Text style={styles.text}>{t('report.button')}</Text>
        </TouchableOpacity>
      )}
      {!!author?.id && (
        <TouchableOpacity onPress={() => confirmBlock(author, onBlocked)} style={styles.action} hitSlop={6} accessibilityRole="button">
          <FontAwesomeIcon icon={faBan} size={10} color={COLORS.stone} />
          <Text style={styles.text}>{compact ? t('block.button') : t('block.button_user')}</Text>
        </TouchableOpacity>
      )}
      <ReportSheet visible={reporting} onClose={() => setReporting(false)} type={type} id={id} label={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  text: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.stone },
});
