import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { faComments, faPaperPlane, faReply, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import api, { API_BASE_URL } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { useLocale } from '../../utils/LocaleContext';
import { withRecaptchaRetry } from '../../utils/recaptcha';
import { apiErrorMessage } from '../../utils/apiError';
import { timeAgo } from '../../utils/timeAgo';
import ArticleSection from '../article/ArticleSection';
import Field from '../ui/Field';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import { SkeletonBlock } from '../ui/Skeleton';
import { useToast } from '../ui/Toast';
import LoginPrompt from '../auth/LoginPrompt';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

// Article comments (the website's CommentFormComponent): threaded list from
// get_article_comments, and for logged-in climbers a form + replies. The
// backend still validates name / surname / email in `data`, so they're
// filled from the account. Commenter emails are never shown.
function displayName(row, user) {
  if (user) return `${user.name ?? ''} ${user.surname ?? ''}`.trim();
  return `${row?.name ?? ''} ${row?.surname ?? ''}`.trim() || '—';
}

function CommentRow({ row, user, onReply, nested, onOpenClimber, t, locale }) {
  return (
    <View style={[styles.row, nested && styles.nested]}>
      <TouchableOpacity disabled={!user} onPress={() => user && onOpenClimber(user.id)}>
        <Avatar user={user || { name: row.name, surname: row.surname }} size={nested ? 30 : 36} />
      </TouchableOpacity>
      <View style={styles.flex}>
        <View style={styles.rowHead}>
          <Text style={styles.name} numberOfLines={1}>{displayName(row, user)}</Text>
          <Text style={styles.time}>{timeAgo(row.created_at, t, locale)}</Text>
        </View>
        <Text style={styles.text}>{row.text}</Text>
        {!!onReply && (
          <TouchableOpacity onPress={onReply} style={styles.replyBtn} hitSlop={6}>
            <FontAwesomeIcon icon={faReply} size={11} color={COLORS.primary} />
            <Text style={styles.replyText}>{t('comments.reply')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function ArticleComments({ articleId }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { user } = useAuth();
  const navigation = useNavigation();
  const toast = useToast();
  const [list, setList] = useState(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!articleId) return;
    api.get(`${API_BASE_URL}/get_article/get_guide_comment/get_article_comments/${articleId}`)
      .then(({ data }) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList((l) => l ?? []));
  }, [articleId]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    setError('');
    if (!text.trim()) { setError(t('comments.empty_text')); return; }
    setSending(true);
    try {
      const body = {
        data: {
          name: (user.name || '').slice(0, 25),
          surname: (user.surname || '-').slice(0, 55),
          email: user.email,
          text: text.trim(),
        },
        answer_array: replyTo ? { answer: true, comment_id: replyTo.id } : { answer: false, comment_id: 0 },
      };
      await withRecaptchaRetry('submit', (recaptcha_token) =>
        api.post(`${API_BASE_URL}/set_guide_comment_by_gest/create_comment/${articleId}`, { ...body, recaptcha_token }));
      setText('');
      setReplyTo(null);
      toast.show({ message: t('comments.thanks') });
      load();
    } catch (err) {
      setError(apiErrorMessage(err, t));
    } finally {
      setSending(false);
    }
  }

  const openClimber = (userId) => navigation.navigate('climber_profile', { userId });
  const count = (list || []).reduce((n, c) => n + 1 + (c.answers?.length || 0), 0);

  return (
    <ArticleSection
      title={`${t('site.guide.article.title.comments')}${count ? ` (${count})` : ''}`}
      icon={faComments}
    >
      {list === null ? (
        <SkeletonBlock height={60} radius={RADII.md} />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>{t('comments.none')}</Text>
      ) : (
        list.map((c) => (
          <View key={c.comment.id} style={styles.thread}>
            <CommentRow
              row={c.comment}
              user={c.user}
              t={t}
              locale={locale}
              onOpenClimber={openClimber}
              onReply={user ? () => setReplyTo({ id: c.comment.id, name: displayName(c.comment, c.user) }) : null}
            />
            {(c.answers || []).map((a) => (
              <CommentRow key={a.answer.id} nested row={a.answer} user={a.user} t={t} locale={locale} onOpenClimber={openClimber} />
            ))}
          </View>
        ))
      )}

      <View style={styles.formWrap}>
        {user ? (
          <>
            {!!replyTo && (
              <View style={styles.replying}>
                <Text style={styles.replyingText} numberOfLines={1}>{t('comments.replying_to', { name: replyTo.name })}</Text>
                <TouchableOpacity onPress={() => setReplyTo(null)} hitSlop={8}>
                  <FontAwesomeIcon icon={faXmark} size={13} color={COLORS.stone} />
                </TouchableOpacity>
              </View>
            )}
            <Field
              value={text}
              onChangeText={setText}
              placeholder={t('comments.placeholder')}
              multiline
              maxLength={2000}
            />
            {!!error && <Text style={styles.error}>{error}</Text>}
            <Button icon={faPaperPlane} title={t('comments.send')} onPress={send} loading={sending} />
          </>
        ) : (
          <LoginPrompt message={t('comments.login_required')} onLogin={() => navigation.navigate('login')} />
        )}
      </View>
    </ArticleSection>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { fontFamily: FONTS.body, fontSize: 13, color: COLORS.stone, marginBottom: 6 },
  thread: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.chalk2 },
  row: { flexDirection: 'row', gap: 10 },
  nested: { marginTop: 10, marginLeft: 22, paddingLeft: 12, borderLeftWidth: 2, borderLeftColor: COLORS.hold },
  rowHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { flexShrink: 1, fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.ink },
  time: { fontFamily: FONTS.body, fontSize: 11, color: COLORS.muted },
  text: { fontFamily: FONTS.body, fontSize: 14, lineHeight: 21, color: COLORS.ink2, marginTop: 2 },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, alignSelf: 'flex-start' },
  replyText: { fontFamily: FONTS.bodyHeavy, fontSize: 12, color: COLORS.primary },
  formWrap: { marginTop: 14 },
  replying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADII.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
  },
  replyingText: { flex: 1, fontFamily: FONTS.bodySemi, fontSize: 12, color: COLORS.primaryDark },
  error: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.danger, marginBottom: 10 },
});
