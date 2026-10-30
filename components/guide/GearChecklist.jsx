import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faSquareCheck, faShareNodes, faRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { faSquare } from '@fortawesome/free-regular-svg-icons';
import { parseChecklist } from '../../utils/gearChecklist';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// The website's GearChecklistComponent under "What you need" on outdoor,
// ice and mountaineering pages: the gear text as a packing checklist with
// progress, "Untick all" and "Share list" (☑ / ☐ text for the team chat).
// Ticks are stored per article on the device, keyed by a hash of each
// item's text so editing the list doesn't shift them.
export default function GearChecklist({ html, articleId, title }) {
  const { t } = useTranslation();
  const groups = useMemo(() => parseChecklist(html), [html]);
  const items = useMemo(() => groups.flatMap((g) => g.items), [groups]);
  const storageKey = `cg_gear_check_${articleId}`;
  const [checked, setChecked] = useState({});

  useEffect(() => {
    AsyncStorage.getItem(storageKey)
      .then((v) => setChecked(v ? JSON.parse(v) : {}))
      .catch(() => {});
  }, [storageKey]);

  if (items.length === 0) return null;

  function save(next) {
    setChecked(next);
    AsyncStorage.setItem(storageKey, JSON.stringify(next)).catch(() => {});
  }

  const done = items.filter((i) => checked[i.key]).length;
  const allDone = done === items.length;

  function share() {
    const lines = [t('site.guide.gear_check.share_intro', { title: title || '' })]
      .concat(items.map((i) => `${checked[i.key] ? '☑' : '☐'} ${i.text}`))
      .join('\n');
    Share.share({ message: lines, title }).catch(() => {});
  }

  return (
    <View style={styles.box}>
      <Text style={styles.title}>{t('site.guide.gear_check.title')}</Text>
      <View style={styles.progressRow}>
        <View style={styles.bar}>
          <View style={[styles.fill, { width: `${(done / items.length) * 100}%` }, allDone && styles.fillDone]} />
        </View>
        <Text style={[styles.count, allDone && styles.countDone]}>
          {allDone ? t('site.guide.gear_check.all_packed') : t('site.guide.gear_check.packed', { n: done, total: items.length })}
        </Text>
      </View>

      {groups.map((g, gi) => (
        <View key={gi}>
          {!!g.note && <Text style={styles.note}>{g.note}</Text>}
          {g.items.map((it) => {
            const on = !!checked[it.key];
            return (
              <TouchableOpacity
                key={it.key}
                style={styles.item}
                activeOpacity={0.7}
                onPress={() => save({ ...checked, [it.key]: !on })}
              >
                <FontAwesomeIcon icon={on ? faSquareCheck : faSquare} size={18} color={on ? COLORS.success : COLORS.muted} />
                <Text style={[styles.itemText, on && styles.itemDone]}>{it.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      <View style={styles.actions}>
        {done > 0 && (
          <TouchableOpacity style={styles.action} onPress={() => save({})}>
            <FontAwesomeIcon icon={faRotateLeft} size={12} color={COLORS.stone} />
            <Text style={styles.actionText}>{t('site.guide.gear_check.reset')}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.action} onPress={share}>
          <FontAwesomeIcon icon={faShareNodes} size={12} color={COLORS.primary} />
          <Text style={[styles.actionText, styles.actionPrimary]}>{t('site.guide.gear_check.share')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 12,
    padding: 12,
    borderRadius: RADII.md,
    backgroundColor: COLORS.chalk,
    borderWidth: 1,
    borderColor: COLORS.line,
  },
  title: { fontFamily: FONTS.displayBold, fontSize: 19, color: COLORS.ink, marginBottom: 8 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: COLORS.chalk2, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.primary },
  fillDone: { backgroundColor: COLORS.success },
  count: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.stone },
  countDone: { color: COLORS.success },
  note: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink2, marginTop: 8, marginBottom: 2 },
  item: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 7 },
  itemText: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 14, lineHeight: 20, color: COLORS.ink },
  itemDone: { color: COLORS.muted, textDecorationLine: 'line-through' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  actionText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.stone },
  actionPrimary: { color: COLORS.primary },
});
