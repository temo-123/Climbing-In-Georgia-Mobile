import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as WebBrowser from 'expo-web-browser';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSignsPost, faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import Button from './ui/Button';
import { COLORS, FONTS } from '../assets/styles/styles';

// A detail page whose slug the API doesn't know any more (and the website
// didn't redirect): instead of a dead page, open it on climbing.ge, which
// follows its own redirects.
export default function NotFoundMoved({ url }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <FontAwesomeIcon icon={faSignsPost} size={40} color={COLORS.primary} />
      <Text style={styles.title}>{t('account.page_moved_title')}</Text>
      <Text style={styles.text}>{t('account.page_moved_text')}</Text>
      {!!url && (
        <Button
          block={false}
          icon={faArrowUpRightFromSquare}
          title={t('account.open_on_website')}
          onPress={() => WebBrowser.openBrowserAsync(url).catch(() => {})}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 12, backgroundColor: COLORS.chalk },
  title: { fontFamily: FONTS.displayBold, fontSize: 26, color: COLORS.ink, textAlign: 'center' },
  text: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.stone, textAlign: 'center', marginBottom: 6 },
});
