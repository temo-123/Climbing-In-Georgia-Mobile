import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBlockedUsers, unblockUser } from '../../utils/blockedUsers';
import Avatar from '../ui/Avatar';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Options → "Blocked climbers": everyone this account blocked, with Unblock.
export default function BlockedUsersManager() {
  const { t } = useTranslation();
  const { list, loaded } = useBlockedUsers();

  function confirmUnblock(u) {
    const name = `${u.name ?? ''} ${u.surname ?? ''}`.trim();
    Alert.alert(t('block.unblock_confirm', { name }), undefined, [
      { text: t('user.cancel'), style: 'cancel' },
      { text: t('block.unblock'), onPress: () => unblockUser(u.id) },
    ]);
  }

  if (!loaded) return null;
  if (list.length === 0) return <Text style={styles.empty}>{t('block.none')}</Text>;

  return (
    <View>
      {list.map((u) => (
        <View key={u.id} style={styles.row}>
          <Avatar user={u} size={32} />
          <Text style={styles.name} numberOfLines={1}>{`${u.name ?? ''} ${u.surname ?? ''}`.trim() || `#${u.id}`}</Text>
          <TouchableOpacity onPress={() => confirmUnblock(u)} hitSlop={8} style={styles.btn}>
            <Text style={styles.btnText}>{t('block.unblock')}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.muted },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.chalk2 },
  name: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: COLORS.line },
  btnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.primaryDark },
});
