import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS, RADII, ROUTE_COLS } from '../../assets/styles/styles';
import { darken, tintOnWhite } from '../../utils/color';

// The website's `.table.cg-route-table.cg-route-table--cols`: every column
// type has its own colour (slate N, teal name, green height, orange bolts,
// violet grade, raspberry 2nd grade, amber info) — a tinted header with a
// coloured top stripe, light cell tints, bold name + main grade. Phone
// layout as on the site: compact cells, wrapping names, arrow-only Info.
//
// columns = [{ key: 'num'|'name'|'height'|'bolts'|'grade'|'grade2'|'info',
//              label, flex, value: (row, i) => string }]
// `renderName(row)` can add marks after the name (✓ climbed, ★ rating);
// `nameStyle(row)` can restyle the name (climbed routes turn green).
const HEAD = Object.fromEntries(Object.entries(ROUTE_COLS).map(([k, c]) => [k, {
  bg: tintOnWhite(c, 0.26), stripe: c, fg: darken(c, 0.3), cell: tintOnWhite(c, 0.12),
}]));

export default function RouteTable({ columns, rows, onRowPress, renderName, nameStyle, rowKey }) {
  if (!rows || rows.length === 0) return null;
  return (
    <View style={styles.table}>
      <View style={styles.row}>
        {columns.map((col) => (
          <View
            key={col.key}
            style={[styles.cell, styles.headCell, { flex: col.flex, backgroundColor: HEAD[col.key].bg, borderTopColor: HEAD[col.key].stripe }]}
          >
            <Text style={[styles.headText, { color: HEAD[col.key].fg }]} numberOfLines={2}>{col.label}</Text>
          </View>
        ))}
      </View>
      {rows.map((row, i) => {
        const press = onRowPress ? () => onRowPress(row) : undefined;
        return (
          <TouchableOpacity
            key={rowKey ? rowKey(row, i) : (row.id ?? i)}
            style={[styles.row, styles.bodyRow]}
            onPress={press}
            disabled={!press}
            activeOpacity={0.7}
          >
            {columns.map((col) => {
              const tint = { flex: col.flex, backgroundColor: HEAD[col.key].cell };
              if (col.key === 'info') {
                return (
                  <View key={col.key} style={[styles.cell, styles.center, tint]}>
                    <View style={styles.arrow}>
                      <FontAwesomeIcon icon={faArrowRight} size={10} color={ROUTE_COLS.info} />
                    </View>
                  </View>
                );
              }
              const value = col.value(row, i);
              const strong = col.key === 'name' || col.key === 'grade';
              return (
                <View key={col.key} style={[styles.cell, tint]}>
                  <Text style={[styles.text, strong && styles.strong, col.key !== 'name' && styles.textCenter, col.key === 'name' && nameStyle?.(row)]}>
                    {value === null || value === undefined || value === '' ? '–' : String(value)}
                  </Text>
                  {col.key === 'name' && renderName?.(row)}
                </View>
              );
            })}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    marginVertical: 8,
    borderRadius: RADII.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  row: { flexDirection: 'row' },
  bodyRow: { borderTopWidth: 1, borderTopColor: 'rgba(21,33,43,0.06)' },
  cell: { paddingVertical: 9, paddingHorizontal: 5, justifyContent: 'center' },
  center: { alignItems: 'center' },
  headCell: { borderTopWidth: 3, paddingVertical: 8 },
  headText: { fontFamily: FONTS.bodyHeavy, fontSize: 10, textAlign: 'center', letterSpacing: 0.2 },
  text: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: COLORS.ink2 },
  textCenter: { textAlign: 'center' },
  strong: { fontFamily: FONTS.bodyHeavy, color: COLORS.ink },
  arrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(201,138,12,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
