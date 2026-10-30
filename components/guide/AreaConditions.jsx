import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faSun, faDroplet, faSnowflake, faTemperatureHalf, faUsers, faTriangleExclamation, faBan, faCircleInfo,
  faBullhorn, faPaperPlane, faClock, faTrashCan,
} from '@fortawesome/free-solid-svg-icons';
import api, { API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { useLocale } from '../../utils/LocaleContext';
import { timeAgo } from '../../utils/timeAgo';
import { apiErrorMessage } from '../../utils/apiError';
import { useRefetchOnReconnect } from '../../utils/useRefetchOnReconnect';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { SkeletonBlock } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import { COLORS, FONTS, RADII, SHADOWS } from '../../assets/styles/styles';

// The website's AreaConditionsComponent ("Current conditions", outdoor and
// ice pages): logged-in climbers post a report in two steps — pick a
// condition card, then an optional note. Reports are shown for FEED_DAYS;
// hazard / closure ones also as a warning banner on top.
const FEED_DAYS = 4; // AreaConditionReport::FEED_DAYS
const WARNING_DAYS = 4;
const WARNINGS = ['hazard', 'closure'];
const META = {
  dry: { icon: faSun, color: '#c98a0c' },
  wet: { icon: faDroplet, color: '#2b86b8' },
  ice_good: { icon: faSnowflake, color: '#2b86b8' },
  ice_poor: { icon: faTemperatureHalf, color: '#e07a3e' },
  crowded: { icon: faUsers, color: '#6c45c4' },
  hazard: { icon: faTriangleExclamation, color: COLORS.danger },
  closure: { icon: faBan, color: COLORS.danger },
  info: { icon: faCircleInfo, color: COLORS.primary },
};

export default function AreaConditions({ articleId, category = 'outdoor' }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuth();
  const navigation = useNavigation();
  const toast = useToast();
  const [reports, setReports] = useState(null);
  const [form, setForm] = useState(null); // null = closed, { condition, note }
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [all, setAll] = useState(false);

  const offered = category === 'ice'
    ? ['ice_good', 'ice_poor', 'wet', 'crowded', 'hazard', 'closure', 'info']
    : ['dry', 'wet', 'crowded', 'hazard', 'closure', 'info'];

  const load = useCallback(() => {
    if (!articleId) return;
    api.get(`${API_BASE_URL}/get_area_report/get_area_reports/${articleId}`)
      .then(({ data }) => setReports(Array.isArray(data) ? data : []))
      .catch(() => setReports((r) => r ?? []));
  }, [articleId]);

  useEffect(() => { load(); }, [load]);
  useRefetchOnReconnect(load);

  const warnings = useMemo(() => {
    const since = Date.now() - WARNING_DAYS * 86400000;
    return (reports || []).filter((r) => WARNINGS.includes(r.condition) && new Date(r.created_at).getTime() >= since).slice(0, 2);
  }, [reports]);

  function openForm() {
    if (!user) {
      Alert.alert(t('site.guide.conditions.report'), t('site.guide.conditions.login_needed'), [
        { text: t('site.common.cancel'), style: 'cancel' },
        { text: t('auth.nav_login'), onPress: () => navigation.navigate('login') },
      ]);
      return;
    }
    setError('');
    setForm({ condition: '', note: '' });
  }

  async function send() {
    if (!form?.condition) { setError(t('site.guide.conditions.pick_first')); return; }
    setSending(true);
    setError('');
    try {
      await api.post(`${API_BASE_URL}/set_area_report/create_area_report/${articleId}`, {
        condition: form.condition,
        note: form.note.trim() || null,
      });
      setForm(null);
      toast.show({ message: t('site.guide.conditions.thanks', { days: FEED_DAYS }) });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, t, 'site.guide.conditions.error'));
    } finally {
      setSending(false);
    }
  }

  function remove(r) {
    Alert.alert(t('site.guide.conditions.delete_confirm'), '', [
      { text: t('site.common.cancel'), style: 'cancel' },
      {
        text: t('site.guide.conditions.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/set_area_report/del_my_area_report/${r.id}`);
            setReports((list) => (list || []).filter((x) => x.id !== r.id));
          } catch (err) {
            toast.show({ type: 'error', message: apiErrorMessage(err, t) });
          }
        },
      },
    ]);
  }

  const visible = all ? reports || [] : (reports || []).slice(0, 3);

  return (
    <View>
      {warnings.map((w) => (
        <View key={`w${w.id}`} style={styles.warning}>
          <FontAwesomeIcon icon={META[w.condition].icon} size={16} color="#fff" />
          <View style={styles.flex}>
            <Text style={styles.warningTitle}>{t(`site.guide.conditions.types.${w.condition}`)}</Text>
            {!!w.note && <Text style={styles.warningText}>{w.note}</Text>}
            <Text style={styles.warningMeta}>{timeAgo(w.created_at, t, locale)}{w.user ? ` · ${w.user.name}` : ''}</Text>
          </View>
        </View>
      ))}

      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.title}>{t('site.guide.conditions.title')}</Text>
          {!form && (
            <Button small block={false} variant="hold" icon={faBullhorn} title={t('site.guide.conditions.report')} onPress={openForm} />
          )}
        </View>
        <Text style={styles.window}>{t('site.guide.conditions.window', { days: FEED_DAYS })}</Text>

        {!!form && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>{t('site.guide.conditions.how_is_it')}</Text>
            <View style={styles.grid}>
              {offered.map((c) => {
                const active = form.condition === c;
                return (
                  <TouchableOpacity
                    key={c}
                    activeOpacity={0.85}
                    onPress={() => setForm({ ...form, condition: c })}
                    style={[styles.option, active && { borderColor: META[c].color, backgroundColor: '#fff' }]}
                  >
                    <View style={[styles.optionIcon, { backgroundColor: active ? META[c].color : COLORS.chalk2 }]}>
                      <FontAwesomeIcon icon={META[c].icon} size={14} color={active ? '#fff' : META[c].color} />
                    </View>
                    <Text style={styles.optionName}>{t(`site.guide.conditions.types.${c}`)}</Text>
                    <Text style={styles.optionHint} numberOfLines={2}>{t(`site.guide.conditions.hints.${c}`)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!form.condition && (
              <Field
                label={`${t('site.guide.conditions.note_title')} ${t('site.guide.conditions.optional')}`}
                hint={`${form.note.length} / 500`}
                value={form.note}
                onChangeText={(note) => setForm({ ...form, note: note.slice(0, 500) })}
                placeholder={t(`site.guide.conditions.examples.${form.condition}`)}
                multiline
              />
            )}
            <View style={styles.visibleRow}>
              <FontAwesomeIcon icon={faClock} size={11} color={COLORS.muted} />
              <Text style={styles.visibleText}>{t('site.guide.conditions.visible_for', { days: FEED_DAYS })}</Text>
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.formActions}>
              <Button small block={false} variant="ghost" title={t('site.guide.conditions.cancel')} onPress={() => setForm(null)} />
              <Button small block={false} icon={faPaperPlane} title={t('site.guide.conditions.send')} loading={sending} onPress={send} />
            </View>
          </View>
        )}

        {reports === null ? (
          <SkeletonBlock height={56} radius={RADII.md} />
        ) : reports.length === 0 ? (
          !form && <Text style={styles.empty}>{t('site.guide.conditions.empty')}</Text>
        ) : (
          visible.map((r) => (
            <View key={r.id} style={styles.report}>
              <View style={[styles.reportIcon, { backgroundColor: META[r.condition]?.color ?? COLORS.primary }]}>
                <FontAwesomeIcon icon={META[r.condition]?.icon ?? faCircleInfo} size={13} color="#fff" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.reportType}>{t(`site.guide.conditions.types.${r.condition}`)}</Text>
                {!!r.note && <Text style={styles.reportNote}>{r.note}</Text>}
                <View style={styles.reportMeta}>
                  {!!r.user && (
                    <TouchableOpacity style={styles.byline} onPress={() => navigation.navigate('climber_profile', { userId: r.user.id })}>
                      <Avatar user={r.user} size={18} />
                      <Text style={styles.reportBy}>{r.user.name}</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.reportTime}>{timeAgo(r.created_at, t, locale)}</Text>
                  {!!user && r.user_id === user.id && (
                    <TouchableOpacity onPress={() => remove(r)} hitSlop={8}>
                      <FontAwesomeIcon icon={faTrashCan} size={12} color={COLORS.danger} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          ))
        )}

        {(reports?.length ?? 0) > 3 && (
          <TouchableOpacity onPress={() => setAll((v) => !v)} style={styles.more}>
            <Text style={styles.moreText}>
              {all ? t('site.guide.conditions.show_less') : t('site.guide.conditions.show_all', { n: reports.length })}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  warning: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderRadius: RADII.lg,
    backgroundColor: COLORS.danger,
  },
  warningTitle: { fontFamily: FONTS.displayBold, fontSize: 19, color: '#fff' },
  warningText: { fontFamily: FONTS.bodyMedium, fontSize: 13, lineHeight: 19, color: '#fff', marginTop: 2 },
  warningMeta: { fontFamily: FONTS.bodySemi, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
    marginBottom: 14,
    gap: 10,
    ...SHADOWS.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  title: { flex: 1, fontFamily: FONTS.displayBold, fontSize: 23, color: COLORS.ink },
  window: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted, marginTop: -6 },
  form: { backgroundColor: COLORS.chalk, borderRadius: RADII.md, padding: 12 },
  formTitle: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.ink, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, marginBottom: 12 },
  option: {
    width: '48.5%',
    padding: 10,
    borderRadius: RADII.md,
    borderWidth: 1.5,
    borderColor: COLORS.line,
    backgroundColor: COLORS.surface,
    gap: 4,
  },
  optionIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  optionName: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: COLORS.ink },
  optionHint: { fontFamily: FONTS.body, fontSize: 11, lineHeight: 15, color: COLORS.stone },
  visibleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  visibleText: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
  error: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.danger, marginBottom: 8 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  empty: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.stone },
  report: { flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: COLORS.chalk2 },
  reportIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reportType: { fontFamily: FONTS.bodyHeavy, fontSize: 14, color: COLORS.ink },
  reportNote: { fontFamily: FONTS.body, fontSize: 13, lineHeight: 19, color: COLORS.ink2, marginTop: 2 },
  reportMeta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  byline: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reportBy: { fontFamily: FONTS.bodyBold, fontSize: 12, color: COLORS.primary },
  reportTime: { fontFamily: FONTS.body, fontSize: 12, color: COLORS.muted },
  more: { alignSelf: 'flex-start' },
  moreText: { fontFamily: FONTS.bodyHeavy, fontSize: 13, color: COLORS.primary },
});
