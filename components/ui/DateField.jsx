import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendarDays, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useLocale } from '../../utils/LocaleContext';
import { dayMonthYear, monthYear, weekdayShort, pad2 } from '../../utils/eventDates';
import { inputStyle } from './Field';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// 'YYYY-MM-DD' in local time (not toISOString, which is UTC and can be a
// day off around midnight in Tbilisi).
export function isoDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parse(v) {
  const [y, m, d] = String(v || '').split('-').map(Number);
  return y ? new Date(y, m - 1, d) : new Date();
}

// Date input with an inline month calendar (no native picker dependency).
// `value` / `onChange` use 'YYYY-MM-DD'; `max` (same format) disables later days.
export default function DateField({ value, onChange, max }) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const selected = parse(value);
  const [view, setView] = useState(new Date(selected.getFullYear(), selected.getMonth(), 1));
  const maxDate = max ? parse(max) : null;

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const nextDisabled = maxDate && new Date(view.getFullYear(), view.getMonth() + 1, 1) > maxDate;

  return (
    <View>
      <TouchableOpacity style={styles.input} onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
        <FontAwesomeIcon icon={faCalendarDays} size={14} color={COLORS.primary} />
        <Text style={styles.inputText}>{dayMonthYear(selected, locale)}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.cal}>
          <View style={styles.calHead}>
            <TouchableOpacity hitSlop={10} onPress={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              <FontAwesomeIcon icon={faChevronLeft} size={14} color={COLORS.ink2} />
            </TouchableOpacity>
            <Text style={styles.calTitle}>{monthYear(view, locale)}</Text>
            <TouchableOpacity hitSlop={10} disabled={nextDisabled} onPress={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
              <FontAwesomeIcon icon={faChevronRight} size={14} color={nextDisabled ? COLORS.line : COLORS.ink2} />
            </TouchableOpacity>
          </View>
          <View style={styles.grid}>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <Text key={`w${i}`} style={styles.weekday}>{weekdayShort(i, locale)}</Text>
            ))}
            {cells.map((d, i) => {
              if (!d) return <View key={`e${i}`} style={styles.cell} />;
              const date = new Date(view.getFullYear(), view.getMonth(), d);
              const disabled = maxDate && date > maxDate;
              const active = isoDate(date) === value;
              return (
                <TouchableOpacity
                  key={d}
                  style={styles.cell}
                  disabled={disabled}
                  onPress={() => { onChange(isoDate(date)); setOpen(false); }}
                >
                  <View style={[styles.day, active && styles.dayActive]}>
                    <Text style={[styles.dayText, active && styles.dayTextActive, disabled && styles.dayDisabled]}>{d}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { ...inputStyle, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.ink },
  cal: {
    marginTop: 8,
    padding: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 8 },
  calTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.muted, paddingVertical: 4 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: COLORS.primary },
  dayText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
  dayTextActive: { color: '#fff', fontFamily: FONTS.bodyHeavy },
  dayDisabled: { color: COLORS.line },
});
