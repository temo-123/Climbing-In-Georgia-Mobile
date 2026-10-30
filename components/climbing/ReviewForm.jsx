import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import { withRecaptchaRetry } from '../../utils/recaptcha';
import { apiErrorMessage } from '../../utils/apiError';
import Field from '../ui/Field';
import { StarsInput } from '../ui/Stars';
import Button from '../ui/Button';
import { KINDS } from './kinds';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Star rating + text review (CreateRouteReviewModal / CreateMtpReviewModal).
// Login only. The backend answers 422 `already_reviewed` for a second review
// of the same route — shown as a normal message.
export default function ReviewForm({ kind, item, onDone }) {
  const { t } = useTranslation();
  const cfg = KINDS[kind];
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!stars) { setError(t('climb.rating_required')); return; }
    setSaving(true);
    try {
      const body = { stars, text: text.trim() || null, ...(kind === 'route' ? { route_id: item.id } : {}) };
      await withRecaptchaRetry(cfg.reviewAction, (recaptcha_token) =>
        api.post(cfg.createReview(item.id), { ...body, recaptcha_token }));
      onDone();
    } catch (err) {
      setError(err?.response?.data?.already_reviewed ? t('site.guide.route.already_reviewed') : apiErrorMessage(err, t));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View>
      <Field label={t('climb.your_rating')} required>
        <StarsInput value={stars} onChange={setStars} />
      </Field>
      <Field
        label={t('climb.review_text')}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={2000}
        placeholder={t('site.guide.route.feedback_placeholder')}
      />
      {!!error && <Text style={s.error}>{error}</Text>}
      <Button icon={faPaperPlane} title={t('site.common.save')} onPress={submit} loading={saving} />
    </View>
  );
}

const s = StyleSheet.create({
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
