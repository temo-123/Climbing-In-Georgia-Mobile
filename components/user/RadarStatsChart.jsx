import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText, TSpan } from 'react-native-svg';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Pure inline-SVG radar chart — no charting library, mirrors the website's
// RadarStatsChartComponent.vue. One axis per value, evenly spaced clockwise
// from the top (the profile uses 6: route reviews, MTP reviews, summit
// ascents, route ascents, MTP ascents, comments). Each axis name sits at its
// corner; `legend` also lists "name: count" below.
function axisAngles(n) {
  // degrees, 0 = pointing right, -90 = up
  return Array.from({ length: n }, (_, i) => -90 + (360 / n) * i);
}

function pointAt(cx, cy, radius, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
}

// Split a label into ≤ 2 lines at the space nearest the middle.
function splitLabel(label) {
  const s = String(label ?? '');
  if (s.length <= 12 || !s.includes(' ')) return [s];
  const mid = s.length / 2;
  let best = -1;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return [s.slice(0, best), s.slice(best + 1)];
}

const LABEL_W = 64; // horizontal room reserved on each side for corner labels
const LABEL_H = 30; // vertical room above / below

export default function RadarStatsChart({ labels, values, size = 140, color = COLORS.primary, legend = true }) {
  const showCorners = !!labels;
  const padX = showCorners ? LABEL_W : 4;
  const padY = showCorners ? LABEL_H : 4;
  const width = size + padX * 2;
  const height = size + padY * 2;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = size / 2 - 4;
  const maxValue = Math.max(1, ...values);
  const AXIS_ANGLES = axisAngles(values.length);

  const dataPoints = values.map((v, i) => {
    const radius = (Math.max(v, 0) / maxValue) * maxRadius;
    return pointAt(cx, cy, radius, AXIS_ANGLES[i]);
  });
  const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {[0.25, 0.5, 0.75, 1].map(fraction => {
          const ring = AXIS_ANGLES.map(angle => pointAt(cx, cy, maxRadius * fraction, angle));
          return (
            <Polygon
              key={fraction}
              points={ring.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={COLORS.line}
              strokeWidth={1}
            />
          );
        })}
        {AXIS_ANGLES.map(angle => {
          const edge = pointAt(cx, cy, maxRadius, angle);
          return <Line key={angle} x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke={COLORS.line} strokeWidth={1} />;
        })}
        <Polygon points={polygonPoints} fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
        {showCorners && AXIS_ANGLES.map((angle, i) => {
          const p = pointAt(cx, cy, maxRadius + 10, angle);
          const cos = Math.cos((angle * Math.PI) / 180);
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          const lines = splitLabel(labels[i]);
          const sin = Math.sin((angle * Math.PI) / 180);
          // Top label grows upward, bottom downward, sides centred on the corner.
          const lineH = 12;
          const blockH = lines.length * lineH;
          const top = sin < -0.8 ? p.y - blockH + 6 : sin > 0.8 ? p.y + 4 : p.y - blockH / 2 + 8;
          return (
            <SvgText
              key={`l${i}`}
              x={p.x}
              y={top}
              fontSize={10}
              fontFamily={FONTS.bodyBold}
              fill={COLORS.stone}
              textAnchor={anchor}
            >
              {lines.map((line, j) => (
                <TSpan key={j} x={p.x} dy={j === 0 ? 0 : lineH}>{line}</TSpan>
              ))}
            </SvgText>
          );
        })}
      </Svg>
      {!!labels && legend && (
        <View style={styles.legend}>
          {labels.map((label, i) => (
            <View key={label} style={styles.legendRow}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.legendText}>{label}: <Text style={styles.legendCount}>{values[i]}</Text></Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: 14, rowGap: 2, paddingHorizontal: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 1 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  legendText: { fontSize: 11, fontFamily: FONTS.body, color: COLORS.muted },
  legendCount: { fontFamily: FONTS.bodyBold, color: COLORS.ink2 },
});
