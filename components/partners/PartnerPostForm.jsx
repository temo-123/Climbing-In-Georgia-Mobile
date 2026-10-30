import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faPaperPlane, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import api, { API_BASE_URL } from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { apiErrorMessage } from '../../utils/apiError';
import Field, { inputStyle } from '../ui/Field';
import DateField, { isoDate } from '../ui/DateField';
import ChoiceChips from '../ui/ChoiceChips';
import MultiChips from '../ui/MultiChips';
import Button from '../ui/Button';
import { DISCIPLINES, LANGUAGES, MAX_TRIP_DAYS } from './partnerRules';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// "Post a plan" (the website's PartnersPageComponent form). Rules match
// PartnerPostController::create_partner_post: start today … +6 months, end
// ≥ start and < 30 days later, area OR free-text place, ≤ 6 languages.
export default function PartnerPostForm({ areas, onDone }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const today = new Date();
  const max = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate() - 1);
  const [form, setForm] = useState({
    climb_date: isoDate(today),
    end_date: null,
    discipline: 'sport',
    languages: [locale === 'ka' ? 'ka' : 'en'],
    article_id: null,
    place: '',
    grade_from: '',
    grade_to: '',
    note: '',
    contact: '',
  });
  const [otherPlace, setOtherPlace] = useState(false);
  const [areaQuery, setAreaQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const areaMatches = useMemo(() => {
    const q = areaQuery.trim().toLowerCase();
    const list = q ? areas.filter((a) => a.title.toLowerCase().includes(q)) : areas;
    return list.slice(0, 12);
  }, [areas, areaQuery]);
  const chosen = areas.find((a) => a.id === form.article_id);

  async function submit() {
    setError('');
    if (!form.article_id && !form.place.trim()) { setError(t('partners_app.need_place')); return; }
    if (form.end_date) {
      const days = (new Date(form.end_date) - new Date(form.climb_date)) / 86400000;
      if (days < 0) { setError(t('partners_app.end_before_start')); return; }
      if (days >= MAX_TRIP_DAYS) { setError(t('partners_app.too_long', { n: MAX_TRIP_DAYS })); return; }
    }
    setSaving(true);
    try {
      await api.post(`${API_BASE_URL}/set_partner_post/create_partner_post`, {
        ...form,
        place: otherPlace ? form.place.trim() || null : null,
        article_id: otherPlace ? null : form.article_id,
        grade_from: form.grade_from.trim() || null,
        grade_to: form.grade_to.trim() || null,
        note: form.note.trim() || null,
        contact: form.contact.trim() || null,
      });
      onDone();
    } catch (err) {
      setError(apiErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Field label={t('site.guide.partners.trip_start')} required>
        <DateField value={form.climb_date} onChange={(climb_date) => set({ climb_date })} max={isoDate(max)} />
      </Field>
      <Field label={t('site.guide.partners.trip_end')} hint={t('site.guide.partners.one_day_hint')}>
        {form.end_date ? (
          <View style={styles.endRow}>
            <View style={styles.flex}>
              <DateField value={form.end_date} onChange={(end_date) => set({ end_date })} max={isoDate(max)} />
            </View>
            <TouchableOpacity onPress={() => set({ end_date: null })} style={styles.clear}>
              <Text style={styles.clearText}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addEnd} onPress={() => set({ end_date: form.climb_date })}>
            <Text style={styles.addEndText}>+ {t('site.guide.partners.trip_end')}</Text>
          </TouchableOpacity>
        )}
      </Field>

      <Field label={t('site.guide.partners.discipline')} required>
        <ChoiceChips
          options={DISCIPLINES.map((d) => ({ key: d, label: t(`site.guide.partners.disciplines.${d}`) }))}
          value={form.discipline}
          onChange={(discipline) => set({ discipline })}
        />
      </Field>

      <Field label={t('site.guide.partners.speaks')}>
        <MultiChips
          options={LANGUAGES.map((l) => ({ key: l, label: t(`site.guide.partners.languages.${l}`) }))}
          value={form.languages}
          onChange={(languages) => set({ languages })}
          max={6}
        />
      </Field>

      <Field label={t('site.guide.partners.area')} required>
        <ChoiceChips
          options={[{ key: 'area', label: t('site.guide.partners.area') }, { key: 'other', label: t('site.guide.partners.area_other') }]}
          value={otherPlace ? 'other' : 'area'}
          onChange={(k) => setOtherPlace(k === 'other')}
        />
        {otherPlace ? (
          <TextInput
            style={[inputStyle, styles.gap]}
            value={form.place}
            onChangeText={(place) => set({ place: place.slice(0, 120) })}
            placeholder={t('site.guide.partners.place_placeholder')}
            placeholderTextColor={COLORS.muted}
          />
        ) : (
          <View style={styles.gap}>
            {chosen ? (
              <ChoiceChips options={[{ key: chosen.id, label: chosen.title }]} value={chosen.id} onChange={() => set({ article_id: null })} />
            ) : (
              <>
                <View style={styles.search}>
                  <FontAwesomeIcon icon={faMagnifyingGlass} size={13} color={COLORS.muted} />
                  <TextInput
                    style={styles.searchInput}
                    value={areaQuery}
                    onChangeText={setAreaQuery}
                    placeholder={t('partners_app.search_area')}
                    placeholderTextColor={COLORS.muted}
                  />
                </View>
                <ChoiceChips
                  options={areaMatches.map((a) => ({ key: a.id, label: a.title }))}
                  value={form.article_id}
                  onChange={(article_id) => set({ article_id })}
                />
              </>
            )}
          </View>
        )}
      </Field>

      <View style={styles.twoCol}>
        <Field style={styles.flex} label={t('site.guide.partners.grade_from')} value={form.grade_from} onChangeText={(v) => set({ grade_from: v.slice(0, 8) })} placeholder="6a" autoCapitalize="none" />
        <Field style={styles.flex} label={t('site.guide.partners.grade_to')} value={form.grade_to} onChangeText={(v) => set({ grade_to: v.slice(0, 8) })} placeholder="7a" autoCapitalize="none" />
      </View>

      <Field
        label={t('site.guide.partners.note')}
        value={form.note}
        onChangeText={(note) => set({ note: note.slice(0, 500) })}
        placeholder={t('site.guide.partners.note_placeholder')}
        hint={`${form.note.length} / 500`}
        multiline
      />
      <Field
        label={t('site.guide.partners.contact')}
        hint={t('site.guide.partners.contact_public')}
        value={form.contact}
        onChangeText={(contact) => set({ contact: contact.slice(0, 120) })}
        placeholder={t('site.guide.partners.contact_placeholder')}
      />

      {!!error && <Text style={styles.error}>{error}</Text>}
      <Button variant="hold" icon={faPaperPlane} title={t('site.guide.partners.publish')} onPress={submit} loading={saving} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gap: { marginTop: 10 },
  twoCol: { flexDirection: 'row', gap: 10 },
  endRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  clear: {
    width: 44,
    height: 46,
    borderRadius: RADII.md,
    backgroundColor: COLORS.chalk2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { fontFamily: FONTS.bodyBold, fontSize: 20, color: COLORS.stone },
  addEnd: {
    ...inputStyle,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  addEndText: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.primary },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontFamily: FONTS.body, fontSize: 14, color: COLORS.ink },
  error: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13,
    color: COLORS.danger,
    backgroundColor: '#fbe9ea',
    borderRadius: RADII.md,
    padding: 10,
    marginBottom: 12,
  },
});
