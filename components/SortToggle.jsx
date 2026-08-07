import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowUpAZ, faSort } from '@fortawesome/free-solid-svg-icons';
import { COLORS } from '../assets/styles/styles';

// Toggles between the list's default (server) order and A-Z. The site's
// filter/group endpoints don't expose a sort order themselves — this is a
// client-side addition on top of whatever order the API returns.
export default function SortToggle({ active, onToggle, label }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onToggle} activeOpacity={0.75}>
      <FontAwesomeIcon icon={active ? faArrowUpAZ : faSort} size={13} color={COLORS.primary} />
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 16,
  },
  text: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
});
