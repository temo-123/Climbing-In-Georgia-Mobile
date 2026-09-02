import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { COLORS } from '../../assets/styles/styles';

// Pure inline-SVG 4-axis radar chart — no charting library, mirrors the
// website's RadarStatsChartComponent.vue (labels/values/size/color props).
// Axes run clockwise from the top: route reviews, mtp reviews, ascents, comments.
const AXIS_ANGLES = [-90, 0, 90, 180]; // degrees, 0 = pointing right, -90 = up

function pointAt(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

export default function RadarStatsChart({ labels, values, size = 140, color = COLORS.primary }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxRadius = size / 2 - 4;
  const maxValue = Math.max(1, ...values);

  const dataPoints = values.map((v, i) => {
    const radius = (Math.max(v, 0) / maxValue) * maxRadius;
    return pointAt(cx, cy, radius, AXIS_ANGLES[i]);
  });
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map(fraction => {
          const ring = AXIS_ANGLES.map(angle => pointAt(cx, cy, maxRadius * fraction, angle));
          return (
            <Polygon
              key={fraction}
              points={ring.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#e0e0e0"
              strokeWidth={1}
            />
          );
        })}
        {AXIS_ANGLES.map(angle => {
          const edge = pointAt(cx, cy, maxRadius, angle);
          return <Line key={angle} x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="#e0e0e0" strokeWidth={1} />;
        })}
        <Polygon points={polygonPoints} fill={color} fillOpacity={0.35} stroke={color} strokeWidth={2} />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
      </Svg>
      {!!labels && (
        <View style={styles.legend}>
          {labels.map((label, i) => (
            <View key={label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}: {values[i]}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { marginTop: 8, alignItems: 'flex-start' },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 11, color: '#888' },
});
