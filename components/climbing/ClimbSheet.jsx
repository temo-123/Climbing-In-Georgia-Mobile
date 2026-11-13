import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { Image } from 'expo-image';
import {
  faCheck, faUsers, faStar, faPen, faCircleCheck,
} from '@fortawesome/free-solid-svg-icons';
import api from '../../utils/api';
import { useLocale } from '../../utils/LocaleContext';
import { useMyAscents, reloadMyAscents } from '../../utils/myAscents';
import { boulderToFont, withAlt } from '../../utils/grades';
import Sheet from '../ui/Sheet';
import GradeTape from '../ui/GradeTape';
import Chip from '../ui/Chip';
import Button from '../ui/Button';
import { StarsShow } from '../ui/Stars';
import { useToast } from '../ui/Toast';
import { SCENES } from '../ui/scenes';
import HtmlContent from '../HtmlContent';
import ImageViewerModal from '../ImageViewerModal';
import LoginPrompt from '../auth/LoginPrompt';
import AgeLockedNote from '../account/AgeLockedNote';
import { useAccount } from '../../utils/AuthContext';
import AscentForm from './AscentForm';
import AscentList from './AscentList';
import ReviewList from './ReviewList';
import ReviewForm from './ReviewForm';
import { KINDS, isBoulder } from './kinds';
import { COLORS, FONTS, RADII } from '../../assets/styles/styles';

const BOLT_ICONS = {
  hangerr: 'https://climbing.ge/images/svg/hangerr%20bolt.svg',
  glued: 'https://climbing.ge/images/svg/glued%20bolt.png',
};

function Field({ label, value, children }) {
  if (!children && (value === null || value === undefined || value === '')) return null;
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {children ?? <Text style={s.fieldValue}>{String(value)}</Text>}
    </View>
  );
}

// Normalises a sector-table row into { id, name, … }. Multi-pitch rows from
// get_sector_and_routes use mtp_id / mtp_name / mtp_num.
function normalise(kind, raw) {
  if (!raw) return null;
  if (kind === 'mtp') {
    const pitches = raw.mtp_pitchs || [];
    return {
      ...raw,
      id: raw.mtp_id ?? raw.id,
      name: raw.mtp_name && String(raw.mtp_name) !== String(raw.mtp_num) ? raw.mtp_name : null,
      pitches,
    };
  }
  return raw;
}

// Route / multi-pitch details sheet (the website's RouteModalComponent /
// MTPModalComponent) with its actions: log ascent, ascents list, reviews,
// write a review. One sheet switching views instead of stacked modals.
export default function ClimbSheet({ kind = 'route', item: rawItem, title, onClose }) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { width } = useWindowDimensions();
  const navigation = useNavigation();
  const toast = useToast();
  const mine = useMyAscents();
  // Under-age accounts: the guidebook is read-only (no log / review).
  const { isUnderage } = useAccount();
  const canWrite = mine.loggedIn && !isUnderage;
  const base = normalise(kind, rawItem);
  const [view, setView] = useState('details');
  const [detail, setDetail] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [loggedStyle, setLoggedStyle] = useState(null);

  // Fresh counts / description from the modal endpoint (sector data can be
  // a cached offline copy).
  useEffect(() => {
    if (!base) return;
    setView('details');
    setDetail(null);
    let alive = true;
    api.get(KINDS[kind].detail(base.id))
      .then(({ data }) => alive && setDetail(kind === 'route' ? data : { ...(data?.mtp || {}), pitches: data?.mtp_pitchs }))
      .catch(() => {});
    return () => { alive = false; };
  }, [kind, base?.id]);

  if (!base) return null;

  const item = { ...base, ...(detail || {}), id: base.id };
  const reviewsCount = item.reviews_count ?? (Array.isArray(item.review) ? item.review.length : 0);
  const ascentsCount = item.ascents_count ?? 0;
  const stars = item.reviews_stars ?? (Array.isArray(item.review) && item.review.length
    ? item.review.reduce((n, r) => n + Number(r.stars || 0), 0) / item.review.length : 0);
  const tick = kind === 'route' ? mine.ticked[item.id] : mine.mtpTicked[item.id];
  const ascentI18n = kind === 'route' ? 'site.guide.route_ascent' : 'site.guide.mtp_ascent';
  const description = locale === 'ka' ? item.text_ka : item.text_us;

  function goLogin() {
    onClose();
    navigation.navigate('login');
  }
  function openClimber(userId) {
    onClose();
    navigation.navigate('climber_profile', { userId });
  }

  const sheetTitle = kind === 'route'
    ? (item.name || '–')
    : (title || item.name || t('multi_pitch.prefix'));

  const VIEWS = {
    details: t('routes_tab.modal_route_details'),
    log: t(`${ascentI18n}.create_title`),
    logged: t(`${ascentI18n}.create_title`),
    ascents: t(`${ascentI18n}.list_title`),
    reviews: t('site.guide.route.all_feedbacks_title'),
    review: t('climb.write_review'),
  };

  function renderDetails() {
    const boulder = kind === 'route' && isBoulder(item);
    const grade = kind === 'route'
      ? (boulder ? `${withAlt(item.grade, item.or_grade, boulderToFont)} · ${withAlt(item.grade, item.or_grade)}` : withAlt(item.grade, item.or_grade))
      : null;
    const pitches = item.pitches || [];
    const height = kind === 'route' ? item.height : (item.height || pitches.reduce((n, p) => n + (Number(p.height) || 0), 0) || null);

    return (
      <View>
        <View style={s.topRow}>
          {!!grade && <GradeTape grade={grade} />}
          {!!height && <Text style={s.meta}>{height} m</Text>}
          {kind === 'route' && !!item.bolts && <Text style={s.meta}>· {item.bolts} {t('site.guide.route.bolts').toLowerCase()}</Text>}
          {kind === 'mtp' && pitches.length > 0 && <Text style={s.meta}>· {t('climb.pitches', { count: pitches.length })}</Text>}
        </View>

        {(stars > 0 || ascentsCount > 0) && (
          <View style={s.starsRow}><StarsShow stars={stars} count={ascentsCount} size={15} showEmpty /></View>
        )}

        {!!tick && (
          <Chip
            tone="success"
            icon={faCircleCheck}
            label={kind === 'route'
              ? t('climb.you_climbed', { style: t(`site.guide.route_ascent.style.${tick}`) })
              : t('site.guide.route_tools.climbed')}
            style={s.tick}
          />
        )}

        {!!description && (
          <View style={s.card}>
            <HtmlContent html={description} contentWidth={width - 68} />
          </View>
        )}

        <View style={s.card}>
          {kind === 'mtp' && pitches.length > 0 && (
            <Field label={t('site.guide.route.grade')} value={pitches.map((p) => p.grade).filter(Boolean).join(' · ')} />
          )}
          <Field label={t('routes_tab.modal_field_category')} value={item.category} />
          <Field label={t('routes_tab.modal_field_author')} value={item.author} />
          <Field label={t('climb.first_ascent')} value={[item.first_ascent, item.first_ascent_date].filter(Boolean).join(' · ')} />
          <Field label={t('routes_tab.modal_field_created')} value={item.creation_data} />
          <Field label={t('routes_tab.modal_field_anchor')} value={item.anchor_type} />
          {!!item.bolts_type && (BOLT_ICONS[item.bolts_type] ? (
            <Field label={t('routes_tab.modal_field_bolts_type')}>
              <Image source={{ uri: BOLT_ICONS[item.bolts_type] }} style={s.boltIcon} contentFit="contain" />
            </Field>
          ) : <Field label={t('routes_tab.modal_field_bolts_type')} value={item.bolts_type} />)}
        </View>
      </View>
    );
  }

  function renderFooter() {
    if (view !== 'details') return null;
    return (
      <>
        {canWrite ? (
          <Button variant="hold" icon={faCheck} title={t(`${ascentI18n}.record_btn`)} onPress={() => setView('log')} />
        ) : null}
        <View style={s.footerRow}>
          <Button small variant="outline" icon={faUsers} style={s.flex} title={t(`${ascentI18n}.show_ascents_btn`, { count: ascentsCount })} onPress={() => setView('ascents')} />
          <Button small variant="outline" icon={faStar} style={s.flex} title={t('climb.reviews_btn', { count: reviewsCount })} onPress={() => setView('reviews')} />
        </View>
      </>
    );
  }

  function renderBody() {
    switch (view) {
      case 'log':
        if (isUnderage) return <AgeLockedNote />;
        return mine.loggedIn ? (
          <AscentForm
            kind={kind}
            item={item}
            onDone={(style) => {
              setLoggedStyle(style);
              setView('logged');
              setDetail((d) => (d ? { ...d, ascents_count: (d.ascents_count ?? ascentsCount) + 1 } : d));
              reloadMyAscents();
              toast.show({ message: t(`${ascentI18n}.success`) });
            }}
          />
        ) : <LoginPrompt message={t('climb.login_required')} onLogin={goLogin} />;
      case 'logged':
        return (
          <View style={s.logged}>
            <View style={s.scene}><SvgXml xml={SCENES.summit} width="100%" height="100%" /></View>
            <Text style={s.loggedTitle}>{t(`${ascentI18n}.success`)}</Text>
            {!!loggedStyle && <Chip tone="success" label={t(`${ascentI18n}.style.${loggedStyle}`)} />}
            <Text style={s.loggedHint}>{t('climb.add_review_after')}</Text>
            <Button variant="outline" icon={faPen} title={t('climb.write_review')} onPress={() => setView('review')} />
          </View>
        );
      case 'ascents':
        return <AscentList kind={kind} item={item} onOpenClimber={openClimber} onOpenPhoto={setPhoto} />;
      case 'reviews':
        return (
          <View>
            {canWrite ? (
              <Button small variant="ghost" icon={faPen} title={t('climb.write_review')} onPress={() => setView('review')} style={s.writeBtn} />
            ) : null}
            <ReviewList kind={kind} item={item} onOpenClimber={openClimber} />
          </View>
        );
      case 'review':
        if (isUnderage) return <AgeLockedNote />;
        return mine.loggedIn ? (
          <ReviewForm
            kind={kind}
            item={item}
            onDone={() => {
              toast.show({ message: t('climb.review_thanks') });
              setDetail((d) => (d ? { ...d, reviews_count: (d.reviews_count ?? reviewsCount) + 1 } : d));
              setView('reviews');
            }}
          />
        ) : <LoginPrompt message={t('climb.login_required')} onLogin={goLogin} />;
      default:
        return (
          <View>
            {renderDetails()}
            {!mine.loggedIn && <LoginPrompt message={t('climb.login_required')} onLogin={goLogin} />}
            {isUnderage && <AgeLockedNote />}
          </View>
        );
    }
  }

  return (
    <>
      <Sheet
        visible
        onClose={onClose}
        onBack={view !== 'details' ? () => setView('details') : undefined}
        eyebrow={VIEWS[view]}
        title={sheetTitle}
        footer={renderFooter()}
      >
        {renderBody()}
      </Sheet>
      <ImageViewerModal uris={photo ? [photo] : []} initialIndex={0} visible={!!photo} onClose={() => setPhoto(null)} />
    </>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  topRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  meta: { fontFamily: FONTS.bodyBold, fontSize: 14, color: COLORS.stone },
  starsRow: { marginBottom: 10 },
  tick: { marginBottom: 12 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.line,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.chalk2,
  },
  fieldLabel: { fontFamily: FONTS.bodyBold, fontSize: 13, color: COLORS.muted, flex: 1 },
  fieldValue: { fontFamily: FONTS.bodySemi, fontSize: 14, color: COLORS.ink, flex: 1.4, textAlign: 'right' },
  boltIcon: { width: 32, height: 32 },
  footerRow: { flexDirection: 'row', gap: 10 },
  writeBtn: { marginBottom: 12 },
  logged: { alignItems: 'center', gap: 12, paddingBottom: 8 },
  scene: { width: '100%', maxWidth: 320, aspectRatio: 360 / 240, borderRadius: RADII.lg, overflow: 'hidden' },
  loggedTitle: { fontFamily: FONTS.displayBold, fontSize: 26, color: COLORS.ink, textAlign: 'center' },
  loggedHint: { fontFamily: FONTS.body, fontSize: 14, color: COLORS.stone },
});
