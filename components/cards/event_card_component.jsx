import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendarDays, faTrophy, faPeopleGroup } from '@fortawesome/free-solid-svg-icons';
import ArticleCardShell from './ArticleCardShell';
import InterestedButton from '../events/InterestedButton';
import { imgUri, IMG_BASES } from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { toDate, eventStatus, statusLabel, rangeLabel, monthShort, hasTime, timeLabel } from '../../utils/eventDates';
import { COLORS, FONTS, SHADOWS } from '../../assets/styles/styles';

const STATUS_TONES = { live: 'success', today: 'hold', upcoming: 'accent', finished: 'default' };

// The website's EventCardComponent: photo with a tear-off date tag, category
// chip, status pill (starts in N days / today / happening now / finished),
// date range + time and the short text.
export default function EventCard({ cardData }) {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { locale } = useLocale();
  const ev = cardData.global_event;
  const start = toDate(ev.start_data);
  const status = eventStatus(ev);
  const isCompetition = ev.category === 'competition';

  let range = rangeLabel(ev, locale);
  if (start && hasTime(ev)) range += ` · ${timeLabel(start)}`;

  const chips = [
    {
      icon: isCompetition ? faTrophy : faPeopleGroup,
      label: isCompetition ? t('site.guide.events.competition_flag') : t('site.guide.events.event_festival_flag'),
    },
    { label: statusLabel(status, t), tone: STATUS_TONES[status.key] },
  ];

  return (
    <ArticleCardShell
      imageUri={imgUri(IMG_BASES.event, ev.image, ev.updated_at)}
      title={cardData.locale_event.title}
      text={cardData.locale_event.short_description}
      chips={chips}
      topRight={<InterestedButton event={ev} />}
      onPress={() => navigation.navigate('event_page', ev.url_title)}
      mediaOverlay={start && (
        <View style={styles.dateTag}>
          <View style={[styles.dateTagHead, status.key === 'finished' && styles.dateTagHeadDone]}>
            <Text style={styles.dateTagMonth}>{monthShort(start, locale)}</Text>
          </View>
          <Text style={styles.dateTagDay}>{start.getDate()}</Text>
          <View style={styles.perforation} />
        </View>
      )}
    >
      {!!range && (
        <View style={styles.rangeRow}>
          <FontAwesomeIcon icon={faCalendarDays} size={12} color={COLORS.primary} />
          <Text style={styles.range}>{range}</Text>
        </View>
      )}
    </ArticleCardShell>
  );
}

const styles = StyleSheet.create({
  dateTag: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 54,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.md,
  },
  dateTagHead: { alignSelf: 'stretch', backgroundColor: COLORS.rope, paddingVertical: 3, alignItems: 'center' },
  dateTagHeadDone: { backgroundColor: COLORS.muted },
  dateTagMonth: { color: '#fff', fontFamily: FONTS.bodyHeavy, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  dateTagDay: { fontFamily: FONTS.displayBold, fontSize: 26, lineHeight: 30, color: COLORS.ink, paddingBottom: 4 },
  perforation: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.line,
  },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  range: { fontFamily: FONTS.bodySemi, fontSize: 13, color: COLORS.ink2 },
});
