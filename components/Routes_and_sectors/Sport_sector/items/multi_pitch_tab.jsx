import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Table, Row } from 'react-native-reanimated-table';
import { getRowBg } from './routes_tab';
import { gStyle } from '../../../../assets/styles/styles';

const HEADER = ['#', 'Name', 'Grade FR', 'Grade YDS'];
const FLEX   = [0.4, 2.5, 1, 1];

function PitchesTable({ pitchs }) {
  if (!pitchs || pitchs.length === 0) return null;
  return (
    <Table borderStyle={styles.border}>
      <Row
        data={HEADER}
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
  if (!mtps || mtps.length === 0) return null;

  return (
    <View>
      {mtps.map((mtp, index) => (
        <View key={mtp.mtp_id || index} style={styles.mtpBlock}>
          <Text style={gStyle.h3}>
            Multi-Pitch {mtp.mtp_num}
            {mtp.mtp_name && String(mtp.mtp_name) !== String(mtp.mtp_num)
              ? `: ${mtp.mtp_name}`
              : ''}
          </Text>

          {mtp.mtp_text ? (
            <Text style={styles.mtpText}>
              {mtp.mtp_text.replace(/<[^>]*>/g, '').trim()}
            </Text>
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
    fontSize: 12,
    color: '#555',
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
