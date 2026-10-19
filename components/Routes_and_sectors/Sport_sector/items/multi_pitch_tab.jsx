import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Table, Row } from 'react-native-reanimated-table';
import { useTranslation } from 'react-i18next';
import { getRowBg } from './routes_tab';
import { gStyle } from '../../../../assets/styles/styles';
import HtmlContent from '../../../HtmlContent';

const MTP_TEXT_STYLE = { fontSize: 13, lineHeight: 19, color: '#555' };

const FLEX = [0.4, 2.5, 1, 1];

function PitchesTable({ pitchs }) {
  const { t } = useTranslation();
  if (!pitchs || pitchs.length === 0) return null;
  const header = ['#', t('routes_tab.col_name'), t('routes_tab.col_grade_fr'), t('routes_tab.col_grade_yds')];
  return (
    <Table borderStyle={styles.border}>
      <Row
        data={header}
        style={styles.head}
        textStyle={styles.headText}
        flexArr={FLEX}
      />
      {pitchs.map((pitch, i) => (
        <Row
          key={pitch.id || i}
          data={[
            pitch.num ?? i + 1,
            pitch.name || '-',
            pitch.grade || '-',
            pitch.or_grade || '-',
          ]}
          style={{ backgroundColor: getRowBg(pitch.grade) }}
          textStyle={styles.rowText}
          flexArr={FLEX}
        />
      ))}
    </Table>
  );
}

export default function MultiPitchTab({ mtps }) {
  const { t } = useTranslation();
  if (!mtps || mtps.length === 0) return null;

  return (
    <View>
      {mtps.map((mtp, index) => (
        <View key={mtp.mtp_id || index} style={styles.mtpBlock}>
          <Text style={gStyle.h3}>
            {t('multi_pitch.prefix')} {mtp.mtp_num}
            {mtp.mtp_name && String(mtp.mtp_name) !== String(mtp.mtp_num)
              ? `: ${mtp.mtp_name}`
              : ''}
          </Text>

          {mtp.mtp_text ? (
            <View style={styles.mtpText}>
              <HtmlContent html={mtp.mtp_text} baseStyle={MTP_TEXT_STYLE} />
            </View>
          ) : null}

          <PitchesTable pitchs={mtp.mtp_pitchs} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  mtpBlock: {
    marginTop: 12,
    marginBottom: 8,
  },
  mtpText: {
    marginBottom: 6,
  },
  border: {
    borderWidth: 1,
    borderColor: '#c0c0c0',
  },
  head: {
    backgroundColor: '#f6d27e',
    height: 36,
  },
  headText: {
    margin: 4,
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  rowText: {
    margin: 4,
    fontSize: 11,
  },
});
