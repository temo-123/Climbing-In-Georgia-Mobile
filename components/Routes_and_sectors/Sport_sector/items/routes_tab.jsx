import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Table, Row } from 'react-native-reanimated-table';

const GRADE_VALUES = {
  '3': 0, '3+': 0, '4': 0, '4+': 0,
  '5a': 1, '5b': 2, '5c': 3,
  '6a': 4, '6a+': 5, '6b': 6, '6b+': 7, '6c': 8, '6c+': 9,
  '7a': 10, '7a+': 11, '7b': 12, '7b+': 13, '7c': 14, '7c+': 15,
  '8a': 16, '8a+': 17, '8b': 18, '8b+': 19, '8c': 20, '8c+': 21,
  '9a': 22, '9a+': 23, '9b': 24, '9b+': 25,
};

export function getRowBg(grade) {
  if (!grade || grade.toLowerCase() === 'project') return '#f0f0f0';
  const val = GRADE_VALUES[grade.toLowerCase()];
  if (val === undefined) return '#ffffff';
  if (val >= 13) return '#df8d8d'; // 7b+ and above
  if (val >= 9)  return '#dfad8d'; // 6c+ to 7b
  return '#ffffff';
}

function starsText(stars) {
  if (!stars) return '-';
  return '★'.repeat(Number(stars));
}

const HEADER  = ['#', 'Name', 'Height', 'Grade FR', 'Grade YDS', 'Stars'];
const FLEX    = [0.4, 2.2, 0.7, 1, 1, 0.7];

export default function RoutesTable({ routes }) {
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
          flexArr={FLEX}
        />
        {routes.map((route, index) => (
          <Row
            key={route.id || index}
            data={[
              route.num ?? index + 1,
              route.name || '-',
              route.height ? `${route.height}m` : '-',
              route.grade || '-',
              route.or_grade || '-',
              starsText(route.stars),
            ]}
            style={{ backgroundColor: getRowBg(route.grade) }}
            textStyle={styles.rowText}
            flexArr={FLEX}
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
    margin: 4,
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  rowText: {
    margin: 4,
    fontSize: 11,
  },
  empty: {
    margin: 8,
    color: '#888',
    fontStyle: 'italic',
  },
});
