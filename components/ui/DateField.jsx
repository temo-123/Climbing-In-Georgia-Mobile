import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendarDays, faChevronLeft, faChevronRight, faCaretDown } from '@fortawesome/free-solid-svg-icons';
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
  return y ? new Date(y, m - 1, d) : null;
}

// Date input with an inline month calendar (no native picker dependency).
// `value` / `onChange` use 'YYYY-MM-DD'; `min` / `max` (same format) disable
// earlier / later days. With no value it shows `placeholder` and opens on
// `initialView` (a 'YYYY-MM-DD', else today / max). Tapping the month title
// switches to a year list — needed for dates far back, like a birthday.
// `error` draws the field red. The ref has `open()` (focus the field).
function DateField({ value, onChange, min, max, placeholder, initialView, error }, ref) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [years, setYears] = useState(false);
  const selected = parse(value);
  const minDate = min ? parse(min) : null;
  const maxDate = max ? parse(max) : null;
  const start = selected || parse(initialView) || (maxDate && maxDate < new Date() ? maxDate : new Date());
  const [view, setView] = useState(new Date(start.getFullYear(), start.getMonth(), 1));

  useImperativeHandle(ref, () => ({ open: () => setOpen(true) }), []);

  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const nextDisabled = maxDate && new Date(view.getFullYear(), view.getMonth() + 1, 1) > maxDate;
  const prevDisabled = minDate && new Date(view.getFullYear(), view.getMonth(), 0) < minDate;

  const lastYear = (maxDate || new Date()).getFullYear();
  const firstYear = minDate ? minDate.getFullYear() : lastYear - 100;
  const yearList = Array.from({ length: lastYear - firstYear + 1 }, (_, i) => lastYear - i);

  function pickYear(y) {
    let m = view.getMonth();
    if (maxDate && y === maxDate.getFullYear()) m = Math.min(m, maxDate.getMonth());
    if (minDate && y === minDate.getFullYear()) m = Math.max(m, minDate.getMonth());
    setView(new Date(y, m, 1));
    setYears(false);
  }

  return (
    <View>
      <TouchableOpacity style={[styles.input, error && styles.inputError]} onPress={() => setOpen((v) => !v)} activeOpacity={0.8}>
        <FontAwesomeIcon icon={faCalendarDays} size={14} color={COLORS.primary} />
        <Text style={[styles.inputText, !selected && styles.placeholder]}>
          {selected ? dayMonthYear(selected, locale) : (placeholder || '—')}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.cal}>
          <View style={styles.calHead}>
            <TouchableOpacity hitSlop={10} disabled={prevDisabled || years} onPress={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
              <FontAwesomeIcon icon={faChevronLeft} size={14} color={prevDisabled || years ? COLORS.line : COLORS.ink2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.titleBtn} onPress={() => setYears((v) => !v)} hitSlop={6}>
              <Text style={styles.calTitle}>{monthYear(view, locale)}</Text>
              <FontAwesomeIcon icon={faCaretDown} size={13} color={COLORS.ink2} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={10} disabled={nextDisabled || years} onPress={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
              <FontAwesomeIcon icon={faChevronRight} size={14} color={nextDisabled || years ? COLORS.line : COLORS.ink2} />
            </TouchableOpacity>
          </View>
          {years ? (
            <ScrollView style={styles.years} nestedScrollEnabled>
              <View style={styles.grid}>
                {yearList.map((y) => {
                  const active = y === view.getFullYear();
                  return (
                    <TouchableOpacity key={y} style={styles.yearCell} onPress={() => pickYear(y)}>
                      <View style={[styles.year, active && styles.dayActive]}>
                        <Text style={[styles.dayText, active && styles.dayTextActive]}>{y}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.grid}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <Text key={`w${i}`} style={styles.weekday}>{weekdayShort(i, locale)}</Text>
              ))}
              {cells.map((d, i) => {
                if (!d) return <View key={`e${i}`} style={styles.cell} />;
                const date = new Date(view.getFullYear(), view.getMonth(), d);
                const disabled = (maxDate && date > maxDate) || (minDate && date < minDate);
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
          )}
        </View>
      )}
    </View>
  );
}

export default forwardRef(DateField);

const styles = StyleSheet.create({
  input: { ...inputStyle, flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputError: { borderColor: COLORS.danger },
  inputText: { fontFamily: FONTS.bodySemi, fontSize: 15, color: COLORS.ink },
  placeholder: { fontFamily: FONTS.body, color: COLORS.muted },
  cal: {
    marginTop: 8,
    padding: 10,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
  },
  calHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6, marginBottom: 8 },
  titleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  calTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: COLORS.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  years: { maxHeight: 240 },
  yearCell: { width: '25%', alignItems: 'center', paddingVertical: 3 },
  year: { paddingHorizontal: 12, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.muted, paddingVertical: 4 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 2 },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: COLORS.primary },
  dayText: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
  dayTextActive: { color: '#fff', fontFamily: FONTS.bodyHeavy },
  dayDisabled: { color: COLORS.line },
});
