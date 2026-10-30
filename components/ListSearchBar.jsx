import React from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII } from '../assets/styles/styles';

// The website's ListSearchBarComponent: a search box with "N found" for the
// guide list pages (filtering lives in utils/listSearch).
export default function ListSearchBar({ value, onChange, found, placeholder }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <View style={styles.box}>
        <FontAwesomeIcon icon={faMagnifyingGlass} size={14} color={COLORS.muted} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder || t('site.guide.list_search.placeholder')}
          placeholderTextColor={COLORS.muted}
          autoCorrect={false}
          returnKeyType="search"
        />
        {!!value && (
          <TouchableOpacity onPress={() => onChange('')} hitSlop={10}>
            <FontAwesomeIcon icon={faXmark} size={14} color={COLORS.stone} />
          </TouchableOpacity>
        )}
      </View>
      {!!value.trim() && <Text style={styles.found}>{found ? t('site.guide.list_search.results', { n: found }) : t('site.guide.list_search.none')}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 11, fontFamily: FONTS.body, fontSize: 15, color: COLORS.ink },
  found: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.stone, marginTop: 6, marginLeft: 6 },
});
