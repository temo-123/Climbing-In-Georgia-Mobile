import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';

const BOLT_ICONS = {
  hangerr: 'https://climbing.ge/images/svg/hangerr%20bolt.svg',
  glued:   'https://climbing.ge/images/svg/glued%20bolt.png',
};

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

function getRowBg(grade) {
  // if (!grade || grade.toLowerCase() === 'project') return '#f0f0f0';
  // const g = grade.toLowerCase().replace(/\s+/g, '');
  // const val = ICE_GRADE_VALUES[g];
  // if (val === undefined) return '#ffffff';
  // if (val >= 7) return '#df8d8d';
  // if (val >= 4) return '#dfad8d';
  // return '#ffffff';
  return '#f0e4a0';
}

export default function IceRoutesTable({ routes }) {
  const [selectedRoute, setSelectedRoute] = useState(null);

  if (!routes || routes.length === 0) {
    return <Text style={styles.empty}>No routes</Text>;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.row, styles.headerRow]}>
        <Text style={[styles.cell, styles.cellN, styles.headerText]}>#</Text>
        <Text style={[styles.cell, styles.cellName, styles.headerText]}>Name</Text>
        <Text style={[styles.cell, styles.cellHeight, styles.headerText]}>Height</Text>
        <Text style={[styles.cell, styles.cellGrade, styles.headerText]}>Grade</Text>
        <View style={[styles.cell, styles.cellInfo]} />
      </View>

      {/* Data rows */}
      {routes.map((route, index) => {
        const gradeText = route.or_grade
          ? `${route.grade || '-'} / ${route.or_grade}`
          : (route.grade || '-');

        return (
          <View
            key={route.id || index}
            style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}
          >
            <Text style={[styles.cell, styles.cellN, styles.rowText]}>
              {route.num ?? index + 1}
            </Text>
            <Text style={[styles.cell, styles.cellName, styles.rowText]}>
              {route.name || '-'}
            </Text>
            <Text style={[styles.cell, styles.cellHeight, styles.rowText]}>
              {route.height ? `${route.height}m` : '-'}
            </Text>
            <Text style={[styles.cell, styles.cellGrade, styles.rowText]}>
              {gradeText}
            </Text>
            <TouchableOpacity
              style={[styles.cell, styles.cellInfo, styles.infoBtnCell]}
              onPress={() => setSelectedRoute(route)}
            >
              <View style={styles.infoBtn}>
                <Text style={styles.infoBtnText}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}

      <IceRouteModal route={selectedRoute} onClose={() => setSelectedRoute(null)} />
    </View>
  );
}

function IceRouteModal({ route, onClose }) {
  if (!route) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          <View style={modal.header}>
            <Text style={modal.title}>Route Details</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={modal.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={modal.body} showsVerticalScrollIndicator={false}>
            {/* Route Details */}
            <View style={modal.section}>
              <Text style={modal.sectionTitle}>Route Details</Text>
              <View style={modal.divider} />
              <Text style={modal.field}><Text style={modal.label}>Name</Text> - {route.name || '-'}</Text>
              <Text style={modal.field}><Text style={modal.label}>Height</Text> - {route.height || '-'}</Text>
              {route.category ? (
                <Text style={modal.field}><Text style={modal.label}>Category</Text> - {route.category}</Text>
              ) : null}
              <Text style={modal.field}><Text style={modal.label}>Grade</Text> - {route.grade || '-'}</Text>
              {route.or_grade ? (
                <Text style={modal.field}>- {route.or_grade}</Text>
              ) : null}
            </View>

            {/* Additional Information */}
            {(route.author || route.created_at) ? (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>Additional Information</Text>
                <View style={modal.divider} />
                {route.author ? (
                  <Text style={modal.field}><Text style={modal.label}>Author</Text> - {route.author}</Text>
                ) : null}
                {route.created_at ? (
                  <Text style={modal.field}><Text style={modal.label}>Creation Date</Text> - {route.created_at}</Text>
                ) : null}
              </View>
            ) : null}

            {/* Technical Details */}
            {(route.anchor_type || route.bolts_type) ? (
              <View style={modal.section}>
                <Text style={modal.sectionTitle}>Technical Details</Text>
                <View style={modal.divider} />
                {route.anchor_type ? (
                  <Text style={modal.field}><Text style={modal.label}>Anchor Type</Text> - {route.anchor_type}</Text>
                ) : null}
                {route.bolts_type ? (
                  <View style={modal.boltRow}>
                    <Text style={modal.label}>Bolts Type</Text>
                    <Image
                      source={{ uri: BOLT_ICONS[route.bolts_type] }}
                      style={modal.boltIcon}
                      contentFit="contain"
                    />
                  </View>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#c8c8c8',
  },
  headerRow: {
    backgroundColor: '#f6d27e',
  },
  rowEven: {
    backgroundColor: '#f0e4a0',
  },
  rowOdd: {
    backgroundColor: '#d0cfca',
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: '#c8c8c8',
    justifyContent: 'center',
  },
  cellN:      { flex: 0.4 },
  cellName:   { flex: 2.2 },
  cellHeight: { flex: 0.8 },
  cellGrade:  { flex: 1.4 },
  cellInfo:   { flex: 0.6, borderRightWidth: 0 },
  headerText: {
    fontWeight: 'bold',
    fontSize: 11,
    textAlign: 'center',
  },
  rowText: {
    fontSize: 11,
    textAlign: 'center',
  },
  infoBtnCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtn: {
    backgroundColor: '#279fbb',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  empty: {
    margin: 8,
    color: '#888',
    fontStyle: 'italic',
  },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  sheet: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  closeBtn: {
    fontSize: 18,
    color: '#666',
    paddingHorizontal: 4,
  },
  body: {
    padding: 16,
  },
  section: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
  },
  divider: {
    height: 1.5,
    backgroundColor: '#279fbb',
    marginBottom: 10,
  },
  field: {
    fontSize: 13,
    color: '#333',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    color: '#111',
  },
  boltRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  boltIcon: {
    width: 32,
    height: 32,
  },
});
