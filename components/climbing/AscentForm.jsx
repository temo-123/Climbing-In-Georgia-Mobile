import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import { withRecaptchaRetry } from '../../utils/recaptcha';
import { readPhotoAsBase64, deletePersistedPhoto } from '../../utils/imageCompress';
import { apiErrorMessage } from '../../utils/apiError';
import { LEAD_GRADES, BOULDER_GRADES } from '../../utils/grades';
import Field from '../ui/Field';
import DateField, { isoDate } from '../ui/DateField';
import ChoiceChips from '../ui/ChoiceChips';
import PhotoPicker from '../ui/PhotoPicker';
import Button from '../ui/Button';
import { KINDS, ROUTE_STYLES, BOULDER_STYLES, MTP_STYLES, isBoulder } from './kinds';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Log a route ascent / record a multi-pitch ascent — the website's
// CreateRouteAscentModal / CreateMtpAscentModal. The photo goes as base64 in
// the JSON body (photo_base64 / photo_ext), never multipart.
export default function AscentForm({ kind, item, onDone }) {
  const { t } = useTranslation();
  const cfg = KINDS[kind];
  const isRoute = kind === 'route';
  const boulder = isRoute && isBoulder(item);
  const styles_ = isRoute ? (boulder ? BOULDER_STYLES : ROUTE_STYLES) : MTP_STYLES;
  const today = isoDate(new Date());

  const [date, setDate] = useState(today);
  const [style, setStyle] = useState(isRoute ? 'redpoint' : null);
  const [attempts, setAttempts] = useState('');
  const [grade, setGrade] = useState('');
  const [time, setTime] = useState('');
  const [comment, setComment] = useState('');
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const firstTry = style === 'onsight' || style === 'flash';
  const gradeOptions = boulder ? BOULDER_GRADES.filter((g) => /^V\d+$/.test(g)) : LEAD_GRADES;

  async function submit() {
    setError('');
    if (isRoute && !style) { setError(t('site.guide.route_ascent.style_required')); return; }
    if (!isRoute && time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { setError(t('site.guide.mtp_ascent.time_label')); return; }
    setSaving(true);
    try {
      const body = {
        ascent_date: date,
        comment: comment.trim() || null,
        ...(isRoute
          ? { ascent_style: style, attempts: firstTry || !attempts ? null : Number(attempts), suggested_grade: grade || null }
          : { ascent_style: style || null, ascent_time: time || null }),
      };
      if (photo) {
        body.photo_base64 = await readPhotoAsBase64(photo);
        body.photo_ext = (photo.split('.').pop() || 'jpg').toLowerCase();
      }
      await withRecaptchaRetry(cfg.ascentAction, (recaptcha_token) =>
        api.post(cfg.createAscent(item.id), { ...body, recaptcha_token }, { timeout: 60000 }));
      if (photo) deletePersistedPhoto(photo);
      onDone(style);
    } catch (err) {
      setError(apiErrorMessage(err, t, `${cfg.i18n}.error`));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Field label={t(`${cfg.i18n}.style_label`)} required={isRoute}>
        <ChoiceChips
          options={styles_.map((s) => ({ key: s, label: t(`${cfg.i18n}.style.${s}`) }))}
          value={style}
          onChange={setStyle}
          allowClear={!isRoute}
        />
        {isRoute && !!style && <Text style={s.hint}>{t(`${cfg.i18n}.style_hint.${style}`)}</Text>}
      </Field>

      <Field label={t(`${cfg.i18n}.date_label`)} required>
        <DateField value={date} onChange={setDate} max={today} />
      </Field>

      {isRoute && !firstTry && (
        <Field
          label={t('site.guide.route_ascent.attempts_label')}
          value={attempts}
          onChangeText={(v) => setAttempts(v.replace(/[^0-9]/g, '').slice(0, 3))}
          keyboardType="number-pad"
          placeholder="2"
        />
      )}

      {!isRoute && (
        <Field
          label={t('site.guide.mtp_ascent.time_label')}
          value={time}
          onChangeText={(v) => setTime(v.replace(/[^0-9:]/g, '').slice(0, 5))}
          keyboardType="numbers-and-punctuation"
          placeholder="14:30"
        />
      )}

      {isRoute && (
        <Field label={t('site.guide.route_ascent.suggested_grade_label')}>
          <ChoiceChips
            options={[{ key: '', label: t('site.guide.route_ascent.grade_agree') }, ...gradeOptions.map((g) => ({ key: g, label: g }))]}
            value={grade}
            onChange={setGrade}
            scroll
          />
        </Field>
      )}

      <Field
        label={t(`${cfg.i18n}.comment_label`)}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={2000}
      />

      <Field label={t(`${cfg.i18n}.photo_label`)}>
        <PhotoPicker uri={photo} onChange={setPhoto} />
      </Field>

      {!!error && <Text style={s.error}>{error}</Text>}

      <Button variant="hold" icon={faCheck} title={t(`${cfg.i18n}.save_btn`)} onPress={submit} loading={saving} />
    </View>
  );
}

const s = StyleSheet.create({
  hint: { fontFamily: FONTS.body, fontSize: 12, lineHeight: 17, color: COLORS.stone, marginTop: 8 },
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
