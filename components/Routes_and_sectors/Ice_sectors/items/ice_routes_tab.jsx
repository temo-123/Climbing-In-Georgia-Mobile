import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Table, Row } from 'react-native-reanimated-table';

// WI / M / AI ice grade difficulty values
const ICE_GRADE_VALUES = {
  'wi1': 1, 'wi2': 2, 'wi3': 3,
  'wi4': 4, 'wi4+': 5,
  'wi5': 6, 'wi5+': 7,
  'wi6': 8, 'wi6+': 9, 'wi7': 10,
  'm3': 1, 'm4': 2, 'm5': 3,
  'm6': 4, 'm7': 5,
  'm8': 6, 'm9': 7, 'm10': 8, 'm11': 9, 'm12': 10,
  'ai1': 1, 'ai2': 2, 'ai3': 3, 'ai4': 4, 'ai5': 5, 'ai6': 6,
};

function getRowStyle(grade) {
  if (!grade || grade.toLowerCase() === 'project') {
    return { backgroundColor: '#f0f0f0' };
  }
  const g = grade.toLowerCase().replace(/\s+/g, '');
  const val = ICE_GRADE_VALUES[g];
  if (val === undefined) return { backgroundColor: '#ffffff' };
  if (val >= 7) return { backgroundColor: '#df8d8d' }; // WI5+/M8+ — hard
  if (val >= 4) return { backgroundColor: '#dfad8d' }; // WI4/M6  — moderate-hard
  return { backgroundColor: '#ffffff' };
}

const HEADER = ['#', 'Name', 'Height', 'Grade'];

export default function IceRoutesTable({ routes }) {
  if (!routes || routes.length === 0) {
    return <Text style={styles.empty}>No routes</Text>;
  }

  return (
    <View style={styles.container}>
      <Table borderStyle={styles.border}>
        <Row
          data={HEADER}
          style={styles.head}
          textStyle={styles.headText}
        />
        {routes.map((route, index) => (
          <Row
            key={route.id || index}
            data={[
              route.num ?? index + 1,
              route.name || '-',
              route.height ? `${route.height}m` : '-',
              route.grade || '-',
            ]}
            style={getRowStyle(route.grade)}
            textStyle={styles.rowText}
          />
        ))}
      </Table>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 8,
  },
  border: {
    borderWidth: 1,
    borderColor: '#c0c0c0',
  },
  head: {
    backgroundColor: '#f6d27e',
    height: 40,
  },
  headText: {
    margin: 6,
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },
  rowText: {
    margin: 6,
    fontSize: 13,
  },
  empty: {
    margin: 8,
    color: '#888',
    fontStyle: 'italic',
  },
});
