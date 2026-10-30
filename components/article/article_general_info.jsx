import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import IframeRenderer, { iframeModel } from '@native-html/iframe-plugin';
import WebView from 'react-native-webview';
import HtmlContent from '../HtmlContent';
import { composeGeneralInfo, isCollapsedGeneralInfo } from '../../utils/generalInfo';
import { COLORS, FONTS } from '../../assets/styles/styles';

const renderers = { iframe: IframeRenderer };
const customHTMLElementModels = { iframe: iframeModel };
const renderersProps = {
  iframe: {
    scalesPageToFit: true,
    webViewProps: {},
  },
};

// One article section that may be combined with a reusable general-info
// block — see utils/generalInfo.js for the before / after / instead rule.
// `contentWidth` is the width of the panel the text sits in.
export default function ArticleGeneralInfo({ global_info_data, actyve_block_data, contentWidth }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const parts = composeGeneralInfo(global_info_data, actyve_block_data);
  if (parts.length === 0) return null;
  const collapsed = isCollapsedGeneralInfo(global_info_data) && !expanded;

  return (
    <View style={collapsed && styles.collapsed}>
      {parts.map((html, i) => (
        <HtmlContent
          key={i}
          html={html}
          contentWidth={contentWidth}
          renderers={renderers}
          WebView={WebView}
          customHTMLElementModels={customHTMLElementModels}
          defaultWebViewProps={{}}
          renderersProps={renderersProps}
        />
      ))}
      {collapsed && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.showMore} onPress={() => setExpanded(true)} activeOpacity={0.85}>
            <FontAwesomeIcon icon={faEye} size={13} color={COLORS.ink} />
            <Text style={styles.showMoreText}>{t('site.guide.show_more')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  collapsed: { maxHeight: 150, overflow: 'hidden' },
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  showMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.hold,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  showMoreText: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: COLORS.ink },
});
