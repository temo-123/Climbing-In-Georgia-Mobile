import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import {
  faComments, faPaperPlane, faReply, faXmark, faRotateRight, faFlag, faTrashCan, faRightToBracket, faUserPen,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import api, { API_BASE_URL } from '../../utils/api';
import { useAuth, useAccount } from '../../utils/AuthContext';
import { useLocale } from '../../utils/LocaleContext';
import { withRecaptchaRetry, isRecaptchaFailure } from '../../utils/recaptcha';
import { isGateHandled } from '../../utils/accountGate';
import { fieldErrors } from '../../utils/apiError';
import { bumpStats } from '../../utils/statsVersion';
import { timeAgo } from '../../utils/timeAgo';
import ArticleSection from '../article/ArticleSection';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Sheet from '../ui/Sheet';
import Chip from '../ui/Chip';
import { SkeletonBlock } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import AgeLockedNote from '../account/AgeLockedNote';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Article comments — the website's CommentFormComponent.vue:
// - signed in: "Commenting as <avatar> Name", name / surname / email sent
//   from the profile (a rejection links to Options); Reply one level deep
// - guest: a "log in" strip, then name / surname / email (guest comments stay
//   unpublished until confirmed from the e-mail link)
// - live n / 500 counter; errors inline under their field (`data.*` keys)
// - thread header with the total (comments + replies) and refresh
// - Delete own · Report others (reason radio cards)
// Commenter e-mails are never shown.
const MAX = 500;
const LIMITS = { name: 25, surname: 55 };
// The backend stores the English sentence; only the label is translated.
const REASONS = [
  ['hostile', 'Hostile remarks'],
  ['off_topic', 'Does not match the theme of the site'],
  ['spam', 'Spam'],
  ['sexual_content', 'Sexual content'],
  ['anger', 'Expression of anger'],
  ['conflict', 'Conflict with other members of the site'],
  ['language', 'The language of the comments does not match the requirements of the site'],
];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function displayName(row, user) {
  if (user) return `${user.name ?? ''} ${user.surname ?? ''}`.trim();
  return `${row?.name ?? ''} ${row?.surname ?? ''}`.trim() || '—';
}

function CommentRow({ row, user, nested, parentName, mine, onReply, onDelete, onReport, onOpenClimber, t, locale }) {
  return (
    <View style={[styles.row, nested && styles.nested]}>
      <TouchableOpacity disabled={!user} onPress={() => user && onOpenClimber(user.id)}>
        <Avatar user={user || { name: row.name, surname: row.surname }} size={nested ? 30 : 36} />
      </TouchableOpacity>
      <View style={styles.flex}>
        <View style={styles.rowHead}>
          <Text style={styles.name} numberOfLines={1}>{displayName(row, user)}</Text>
          {!user && <Chip small label={t('site.guide.comments.guest_badge')} />}
          <Text style={styles.time}>{timeAgo(row.created_at, t, locale)}</Text>
        </View>
        {nested && !!parentName && <Text style={styles.toParent} numberOfLines={1}>→ {parentName}</Text>}
        <Text style={styles.text}>{row.text}</Text>
        <View style={styles.actions}>
          {!!onReply && (
            <TouchableOpacity onPress={onReply} style={styles.action} hitSlop={6}>
              <FontAwesomeIcon icon={faReply} size={11} color={COLORS.primary} />
              <Text style={styles.actionText}>{t('site.guide.comments.reply')}</Text>
            </TouchableOpacity>
          )}
          {mine ? (
            <TouchableOpacity onPress={onDelete} style={styles.action} hitSlop={6}>
              <FontAwesomeIcon icon={faTrashCan} size={11} color={COLORS.danger} />
              <Text style={[styles.actionText, styles.actionDanger]}>{t('account.delete')}</Text>
            </TouchableOpacity>
          ) : !!onReport && (
            <TouchableOpacity onPress={onReport} style={styles.action} hitSlop={6}>
              <FontAwesomeIcon icon={faFlag} size={10} color={COLORS.stone} />
              <Text style={[styles.actionText, styles.actionMuted]}>{t('site.guide.comments.report')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default function ArticleComments({ articleId }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuth();
  const { isUnderage, canAct } = useAccount();
  const navigation = useNavigation();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [guest, setGuest] = useState({ name: '', surname: '', email: '' });
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});
  const [notice, setNotice] = useState(null); // { tone, text, profileLink? }
  const [report, setReport] = useState(null); // { id, reason, error, sending }
  const textRef = useRef(null);

  const load = useCallback(() => {
    if (!articleId) return;
    setRefreshing(true);
    api.get(`${API_BASE_URL}/get_article/get_guide_comment/get_article_comments/${articleId}`)
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList((l) => l ?? []))
      .finally(() => setRefreshing(false));
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  const isMine = (u) => !!(u && user && Number(u.id) === Number(user.id));

  function validate() {
    const e = {};
    if (!text.trim()) e['data.text'] = t('site.guide.comments.required');
    if (!user) {
      if (!guest.name.trim()) e['data.name'] = t('site.guide.comments.required');
      if (!guest.surname.trim()) e['data.surname'] = t('site.guide.comments.required');
      if (!guest.email.trim()) e['data.email'] = t('site.guide.comments.required');
      else if (!EMAIL_RE.test(guest.email.trim())) e['data.email'] = t('site.guide.comments.email_invalid');
    }
    setErrors(e);
    return !Object.keys(e).length;
  }

  async function send() {
    setNotice(null);
    if (!validate()) return;
    setSending(true);
    try {
      const who = user
        ? { name: (user.name || '').slice(0, LIMITS.name), surname: (user.surname || '').slice(0, LIMITS.surname), email: user.email }
        : { name: guest.name.trim(), surname: guest.surname.trim(), email: guest.email.trim() };
      const body = {
        data: { ...who, text: text.trim() },
        answer_array: replyTo ? { answer: true, comment_id: replyTo.id } : { answer: false, comment_id: 0 },
      };
      await withRecaptchaRetry('comment', (recaptcha_token) =>
        api.post(`${API_BASE_URL}/set_guide_comment_by_gest/create_comment/${articleId}`, { ...body, recaptcha_token }));
      setText('');
      setReplyTo(null);
      setErrors({});
      setNotice({ tone: 'ok', text: user ? t('site.guide.comments.sent') : t('site.guide.comments.sent_guest') });
      if (user) bumpStats();
      load();
    } catch (err) {
      if (isGateHandled(err)) return; // age / e-mail sheet explains it
      if (isRecaptchaFailure(err)) {
        setNotice({ tone: 'warn', text: t('climb.recaptcha_failed') });
        return;
      }
      const fe = fieldErrors(err);
      if (Object.keys(fe).length) {
        // Signed in: the server rejected the profile's name / surname / e-mail.
        if (user && (fe['data.name'] || fe['data.surname'] || fe['data.email'])) {
          setNotice({ tone: 'warn', text: t('site.guide.comments.profile_incomplete'), profileLink: true });
        }
        setErrors(fe);
      } else {
        setNotice({ tone: 'error', text: t('site.guide.comments.send_error') });
      }
    } finally {
      setSending(false);
    }
  }

  function startReply(id, name) {
    setReplyTo({ id, name });
    setTimeout(() => textRef.current?.focus?.(), 50);
  }

  function confirmDelete(id) {
    Alert.alert(t('site.guide.comments.confirm_delete'), '', [
      { text: t('user.cancel'), style: 'cancel' },
      {
        text: t('account.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`${API_BASE_URL}/set_article/set_guide_comment/del_comment/${id}`);
            bumpStats();
            load();
          } catch (err) {
            if (!isGateHandled(err)) toast.show({ type: 'error', message: t('auth.generic_error') });
          }
        },
      },
    ]);
  }

  function openReport(id) {
    if (!user) {
      Alert.alert(t('site.guide.comments.report_title'), t('account.report_login'), [
        { text: t('user.cancel'), style: 'cancel' },
        { text: t('auth.nav_login'), onPress: () => navigation.navigate('login') },
      ]);
      return;
    }
    setReport({ id, reason: '', error: '', sending: false });
  }

  async function sendReport() {
    if (!report.reason) { setReport((r) => ({ ...r, error: t('site.guide.comments.report_pick') })); return; }
    setReport((r) => ({ ...r, sending: true, error: '' }));
    try {
      const { data } = await api.post(`${API_BASE_URL}/set_article/set_guide_comment/add_comment_complaint/`, {
        comment_id: report.id,
        comment_complaint: report.reason,
        email: user?.email,
      });
      setReport(null);
      // The backend answers a plain sentence when this user already reported it.
      toast.show({ message: typeof data === 'string' && data ? data : t('site.guide.comments.report_done') });
    } catch (err) {
      if (isGateHandled(err)) { setReport(null); return; }
      setReport((r) => r && ({ ...r, sending: false, error: t('site.guide.comments.send_error') }));
    }
  }

  const openClimber = (userId) => navigation.navigate('climber_profile', { userId });
  const count = (list || []).reduce((n, c) => n + 1 + (c.answers?.length || 0), 0);
  const canReply = !!user && canAct;
  const setG = (k) => (v) => { setGuest((g) => ({ ...g, [k]: v })); setErrors((e) => ({ ...e, [`data.${k}`]: undefined })); };
  const err = (k) => errors[`data.${k}`];

  return (
    <ArticleSection
      title={t('site.guide.article.title.comments')}
      icon={faComments}
      right={(
        <View style={styles.headRight}>
          {count > 0 && <View style={styles.countPill}><Text style={styles.countText}>{count}</Text></View>}
          <TouchableOpacity onPress={load} style={styles.refresh} hitSlop={8} accessibilityLabel={t('account.refresh')}>
            {refreshing && list !== null
              ? <ActivityIndicator size="small" color={COLORS.primary} />
              : <FontAwesomeIcon icon={faRotateRight} size={13} color={COLORS.primaryDark} />}
          </TouchableOpacity>
        </View>
      )}
    >
      {list === null ? (
        <SkeletonBlock height={60} radius={RADII.md} />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>{t('site.guide.comments.empty')}</Text>
      ) : (
        list.map((c) => {
          const parentName = displayName(c.comment, c.user);
          return (
            <View key={c.comment.id} style={styles.thread}>
              <CommentRow
                row={c.comment}
                user={c.user}
                t={t}
                locale={locale}
                mine={isMine(c.user)}
                onOpenClimber={openClimber}
                onReply={canReply ? () => startReply(c.comment.id, parentName) : null}
                onDelete={() => confirmDelete(c.comment.id)}
                onReport={isUnderage ? null : () => openReport(c.comment.id)}
              />
              {(c.answers || []).map((a) => (
                <CommentRow
                  key={a.answer.id}
                  nested
                  parentName={parentName}
                  row={a.answer}
                  user={a.user}
                  t={t}
                  locale={locale}
                  mine={isMine(a.user)}
                  onOpenClimber={openClimber}
                  onDelete={() => confirmDelete(a.answer.id)}
                  onReport={isUnderage ? null : () => openReport(a.answer.id)}
                />
              ))}
            </View>
          );
        })
      )}

      <View style={styles.formWrap}>
        {isUnderage ? (
          <AgeLockedNote />
        ) : (
          <>
            {user ? (
              <View style={styles.as}>
                <Text style={styles.asText}>{t('site.guide.comments.commenting_as')}</Text>
                <Avatar user={user} size={22} />
                <Text style={styles.asName} numberOfLines={1}>{`${user.name ?? ''} ${user.surname ?? ''}`.trim()}</Text>
              </View>
            ) : (
              <>
                <View style={styles.guestStrip}>
                  <Text style={styles.guestText}>{t('site.guide.comments.guest_hint')}</Text>
                  <Button small block={false} variant="hold" icon={faRightToBracket} title={t('auth.login')} onPress={() => navigation.navigate('login')} />
                </View>
                <Field label={t('auth.name')} required value={guest.name} onChangeText={setG('name')} maxLength={LIMITS.name} autoCapitalize="words" />
                {!!err('name') && <Text style={styles.fieldError}>{err('name')}</Text>}
                <Field label={t('auth.surname')} required value={guest.surname} onChangeText={setG('surname')} maxLength={LIMITS.surname} autoCapitalize="words" />
                {!!err('surname') && <Text style={styles.fieldError}>{err('surname')}</Text>}
                <Field
                  label={t('auth.email')}
                  required
                  hint={t('site.guide.comments.email_hint')}
                  value={guest.email}
                  onChangeText={setG('email')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {!!err('email') && <Text style={styles.fieldError}>{err('email')}</Text>}
              </>
            )}

            {!!replyTo && (
              <View style={styles.replying}>
                <Text style={styles.replyingText} numberOfLines={1}>{t('site.guide.comments.replying_to', { name: replyTo.name })}</Text>
                <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8} accessibilityLabel={t('site.guide.comments.cancel_reply')}>
                  <FontAwesomeIcon icon={faXmark} size={13} color={COLORS.stone} />
                </TouchableOpacity>
              </View>
            )}
            <Field
              ref={textRef}
              label={t('site.guide.comments.text_label')}
              value={text}
              onChangeText={(v) => { setText(v); setErrors((e) => ({ ...e, 'data.text': undefined })); }}
              placeholder={replyTo ? t('site.guide.comments.reply_placeholder') : t('site.guide.comments.text_placeholder')}
              multiline
              maxLength={MAX}
            />
            <View style={styles.counterRow}>
              <Text style={styles.rules}>{t('site.guide.comments.rules')}</Text>
              <Text style={[styles.counter, text.length > MAX - 50 && styles.counterNear]}>{text.length} / {MAX}</Text>
            </View>
            {!!err('text') && <Text style={styles.fieldError}>{err('text')}</Text>}
            {user && (err('name') || err('surname') || err('email')) && !notice?.profileLink && (
              <Text style={styles.fieldError}>{[err('name'), err('surname'), err('email')].filter(Boolean).join('\n')}</Text>
            )}

            <Button
              icon={faPaperPlane}
              title={replyTo ? t('site.guide.comments.send_reply') : t('site.guide.comments.send')}
              onPress={send}
              loading={sending}
            />

            {!!notice && (
              <View style={[styles.notice, styles[`notice_${notice.tone}`]]}>
                <Text style={styles.noticeText}>{notice.text}</Text>
                {notice.profileLink && (
                  <Button
                    small
                    block={false}
                    variant="outline"
                    icon={faUserPen}
                    title={t('site.guide.comments.open_profile')}
                    onPress={() => navigation.navigate('user_options', { focus: 'name', at: Date.now() })}
                  />
                )}
              </View>
            )}
          </>
        )}
      </View>

      <Sheet
        visible={!!report}
        onClose={() => setReport(null)}
        title={t('site.guide.comments.report_title')}
        footer={(
          <Button icon={faFlag} title={t('site.guide.comments.report_send')} onPress={sendReport} loading={!!report?.sending} />
        )}
      >
        <Text style={styles.reportText}>{t('site.guide.comments.report_text')}</Text>
        {REASONS.map(([key, value]) => {
          const on = report?.reason === value;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.reason, on && styles.reasonOn]}
              onPress={() => setReport((r) => ({ ...r, reason: value, error: '' }))}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
            >
              <View style={[styles.radio, on && styles.radioOn]}>{on && <View style={styles.radioDot} />}</View>
              <Text style={styles.reasonText}>{t(`site.shop.product.feedback.reasons.${key}`)}</Text>
            </TouchableOpacity>
          );
        })}
        {!!report?.error && <Text style={styles.fieldError}>{report.error}</Text>}
      </Sheet>
    </ArticleSection>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto' },
  countPill: { minWidth: 24, height: 22, borderRadius: 11, paddingHorizontal: 7, backgroundColor: COLORS.primarySoft, alignItems: 'center', justifyContent: 'center' },
  countText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.primaryDark },
  refresh: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  empty: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.stone, marginBottom: 6 },
  thread: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.chalk2 },
  row: { flexDirection: 'row', gap: 10 },
  nested: { marginTop: 10, marginLeft: 22, paddingLeft: 12, paddingVertical: 8, paddingRight: 8, borderLeftWidth: 2, borderLeftColor: COLORS.hold, backgroundColor: COLORS.chalk, borderRadius: RADII.sm },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { flexShrink: 1, fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.ink },
  time: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
  toParent: { fontFamily: FONTS.bodySemi, fontSize: 11, color: COLORS.stone, marginTop: 1 },
  text: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.ink2, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 16, marginTop: 6 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.primary },
  actionDanger: { color: COLORS.danger },
  actionMuted: { color: COLORS.stone },
  formWrap: { marginTop: 14 },
  as: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  asText: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.stone },
  asName: { flexShrink: 1, fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.ink },
  guestStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 12,
    borderRadius: RADII.md, backgroundColor: COLORS.chalk, borderWidth: 1, borderColor: COLORS.line,
  },
  guestText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 12, lineHeight: 17, color: COLORS.ink2 },
  replying: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primarySoft,
    borderRadius: RADII.sm, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8,
  },
  replyingText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.primaryDark },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -6, marginBottom: 10 },
  rules: { flex: 1, fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
  counter: { fontFamily: FONTS.bodyBold, fontSize: 11, color: COLORS.muted },
  counterNear: { color: COLORS.rope },
  fieldError: { fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.danger, marginTop: -6, marginBottom: 10 },
  notice: { marginTop: 10, padding: 12, borderRadius: RADII.md, gap: 8, alignItems: 'flex-start' },
  notice_ok: { backgroundColor: '#e6f6ec' },
  notice_warn: { backgroundColor: '#fff4e0' },
  notice_error: { backgroundColor: '#fde8e8' },
  noticeText: { fontFamily: FONTS.bodySemi, fontSize: 13, lineHeight: 19, color: COLORS.ink2 },
  reportText: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 20, color: COLORS.stone, marginBottom: 12 },
  reason: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, marginBottom: 8,
    borderRadius: RADII.md, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.surface,
  },
  reasonOn: { borderColor: COLORS.primary, backgroundColor: COLORS.primarySoft },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.muted, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: COLORS.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  reasonText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink },
});
