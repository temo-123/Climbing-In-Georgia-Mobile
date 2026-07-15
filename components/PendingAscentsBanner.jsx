import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { subscribeToQueue, syncQueue, discardQueuedAscent } from '../utils/ascentQueue';

function queuedAtFromId(_id) {
  const ms = Number(String(_id).split('_')[0]);
  return Number.isFinite(ms) ? new Date(ms) : null;
}

// Human-readable label for why an item is still queued, before it's ever had
// a sync attempt (once it has, item.lastError already gives a more specific
// reason from the actual failed request).
function reasonLabel(reason, t) {
  switch (reason) {
    case 'recaptcha_score': return t('summit.reason_recaptcha_score');
    case 'recaptcha_unavailable': return t('summit.reason_recaptcha_unavailable');
    case 'network': return t('summit.reason_network');
    default: return null;
  }
}

function QueuedAscentRow({ item, t }) {
  const queuedAt = queuedAtFromId(item._id);
  const routeLabel = item.route_name ?? item.other_route ?? null;

  function handleRemove() {
    Alert.alert(
      t('summit.discard_confirm_title'),
      t('summit.discard_confirm_message'),
      [
        { text: t('summit.cancel_scan'), style: 'cancel' },
        { text: t('summit.remove_from_queue'), style: 'destructive', onPress: () => discardQueuedAscent(item._id) },
      ],
    );
  }

  // summit_title is only present on items queued after this field was added —
  // older already-queued items fall back to the raw url_title slug so they
  // still show *something* identifying the summit rather than nothing.
  const summitLabel = item.summit_title ?? item.url_title;

  return (
    <View style={styles.row}>
      <View style={styles.rowMain}>
        <Text style={styles.rowName}>{item.name} {item.surname}</Text>
        {!!summitLabel && <Text style={styles.rowSummit}>🏔️ {summitLabel}</Text>}
        {!!routeLabel && <Text style={styles.rowMeta}>{routeLabel}</Text>}
        {!!queuedAt && (
          <Text style={styles.rowMeta}>{t('summit.queued_on', { date: queuedAt.toLocaleString() })}</Text>
        )}
        {item.lastError
          ? <Text style={styles.rowError}>{item.lastError}</Text>
          : !!reasonLabel(item.queue_reason, t) && (
            <Text style={styles.rowMeta}>{reasonLabel(item.queue_reason, t)}</Text>
          )}
      </View>
      <TouchableOpacity onPress={handleRemove} activeOpacity={0.7} style={styles.removeBtn}>
        <Text style={styles.removeBtnText}>{t('summit.remove_from_queue')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// Surfaces the offline ascent queue that utils/ascentQueue.js otherwise syncs
// silently in the background — without this, a stuck/failed upload (bad
// photo, validation error, expired recaptcha) is invisible to the user
// forever, which is what made offline ascents look like they "don't work".
export default function PendingAscentsBanner() {
  const { t } = useTranslation();
  const [queue, setQueue] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => subscribeToQueue(setQueue), []);

  if (queue.length === 0) return null;

  const lastError = [...queue].reverse().find(item => item.lastError)?.lastError;

  async function handleSyncNow() {
    setSyncing(true);
    try {
      await syncQueue();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <View style={styles.banner}>
      <View style={styles.row2}>
        <Text style={styles.text}>📥 {t('summit.pending_ascents', { count: queue.length })}</Text>
        <TouchableOpacity style={styles.syncBtn} onPress={handleSyncNow} disabled={syncing} activeOpacity={0.8}>
          {syncing
            ? <ActivityIndicator size="small" color="#1a6f85" />
            : <Text style={styles.syncBtnText}>{t('summit.sync_now')}</Text>}
        </TouchableOpacity>
      </View>
      {!!lastError && (
        <Text style={styles.errorText} numberOfLines={2}>
          {t('summit.last_sync_error', { error: lastError })}
        </Text>
      )}
      <TouchableOpacity onPress={() => setExpanded(e => !e)} activeOpacity={0.7}>
        <Text style={styles.toggleText}>{expanded ? t('summit.hide_details') : t('summit.show_details')}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.list}>
          {queue.map(item => <QueuedAscentRow key={item._id} item={item} t={t} />)}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fdf3e3',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
  },
  row2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  text: { fontSize: 12, color: '#7a5200', flexShrink: 1, fontWeight: '600' },
  syncBtn: {
    borderWidth: 1.5,
    borderColor: '#279fbb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 72,
    alignItems: 'center',
  },
  syncBtnText: { fontSize: 12, color: '#279fbb', fontWeight: '700' },
  errorText: { fontSize: 11, color: '#b9770e' },
  toggleText: { fontSize: 12, color: '#1a6f85', fontWeight: '700', textDecorationLine: 'underline' },
  list: { gap: 8, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  rowMain: { flex: 1, gap: 2 },
  rowName: { fontSize: 13, fontWeight: '700', color: '#333' },
  rowSummit: { fontSize: 12, color: '#279fbb', fontWeight: '600', marginTop: 1 },
  rowMeta: { fontSize: 11, color: '#888' },
  rowError: { fontSize: 11, color: '#b9770e', marginTop: 2 },
  removeBtn: {
    borderWidth: 1.5,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeBtnText: { fontSize: 11, color: '#e74c3c', fontWeight: '700' },
});
