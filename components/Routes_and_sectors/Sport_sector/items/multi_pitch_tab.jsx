import React, { useState } from 'react';
import { StyleSheet, View, Text, useWindowDimensions } from 'react-native';
import { faCircleInfo, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import ClimbSheet from '../../../climbing/ClimbSheet';
import { StarsShow } from '../../../ui/Stars';
import Chip from '../../../ui/Chip';
import Button from '../../../ui/Button';
import { useMyAscents } from '../../../../utils/myAscents';
import { useTranslation } from 'react-i18next';
import HtmlContent from '../../../HtmlContent';
import RouteTable from '../../RouteTable';
import { withAlt } from '../../../../utils/grades';
import { COLORS, FONTS, RADII } from '../../../../assets/styles/styles';

const MTP_TEXT_STYLE = { fontSize: 13, lineHeight: 19, color: COLORS.stone };

function pitchBolts(p, t) {
  if (p.category === 'tred') return t('site.guide.route.tred');
  if (p.category === 'sport climbing') return p.bolts || '?';
  return '?';
}

export function mtpTitle(mtp, t) {
  const named = mtp.mtp_name && String(mtp.mtp_name) !== String(mtp.mtp_num);
  return `${t('multi_pitch.prefix')} ${mtp.mtp_num}${named ? `: ${mtp.mtp_name}` : ''}`;
}

// Multi-pitch routes of a sector: a card per route with its rating, the
// climber's tick, a Details button (ascents / reviews sheet) and the pitch
// table.
export default function MultiPitchTab({ mtps }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { mtpTicked } = useMyAscents();
  const [selected, setSelected] = useState(null);
  if (!mtps || mtps.length === 0) return null;

  const columns = [
    { key: 'num', label: 'N', flex: 0.45, value: (p, i) => p.num ?? i + 1 },
    { key: 'name', label: t('site.common.name'), flex: 2.2, value: (p) => p.name },
    { key: 'height', label: t('site.common.height'), flex: 0.9, value: (p) => p.height },
    { key: 'bolts', label: t('site.guide.route.bolts'), flex: 0.9, value: (p) => pitchBolts(p, t) },
    { key: 'grade', label: t('site.guide.route.grade fr'), flex: 1.25, value: (p) => withAlt(p.grade, p.or_grade) },
  ];

  return (
    <View>
      {mtps.map((mtp, index) => (
        <View key={mtp.mtp_id || index} style={styles.card}>
          <Text style={styles.eyebrow}>{t('site.guide.route.mtp detals')}</Text>
          <Text style={styles.title}>{mtpTitle(mtp, t)}</Text>
          <View style={styles.headRow}>
            <StarsShow stars={mtp.reviews_stars} count={mtp.ascents_count} size={12} />
            {!!mtpTicked[mtp.mtp_id] && <Chip small tone="success" icon={faCircleCheck} label={t('site.guide.route_tools.climbed')} />}
            <View style={styles.flex} />
            <Button small block={false} variant="outline" icon={faCircleInfo} title={t('climb.details')} onPress={() => setSelected(mtp)} />
          </View>
          {!!mtp.mtp_text && mtp.mtp_text !== 'None' && (
            <View style={styles.text}>
              <HtmlContent html={mtp.mtp_text} baseStyle={MTP_TEXT_STYLE} contentWidth={width - 96} />
            </View>
          )}
          <RouteTable columns={columns} rows={mtp.mtp_pitchs || []} onRowPress={() => setSelected(mtp)} />
        </View>
      ))}
      {!!selected && (
        <ClimbSheet kind="mtp" item={selected} title={mtpTitle(selected, t)} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.chalk,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  eyebrow: { fontFamily: FONTS.bodyHeavy, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: COLORS.primary },
  title: { fontFamily: FONTS.displayBold, fontSize: 20, lineHeight: 24, color: COLORS.ink, marginTop: 2 },
  text: { marginTop: 6 },
  flex: { flex: 1 },
  headRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 6 },
});
