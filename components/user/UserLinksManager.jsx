import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import api, { API_BASE_URL } from '../../utils/api';
import { COLORS } from '../../assets/styles/styles';

const API = API_BASE_URL;

// Free-form "extra links" list (unlimited, unlike the 4 fixed social_links
// keys) — backed by the /api/user_site CRUD resource.
export default function UserLinksManager() {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    api.get(`${API}/user_site`)
      .then(res => setLinks(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  async function handleAdd() {
    const url = newUrl.trim();
    if (!url) return;
    setAdding(true);
    try {
      // Backend reads $request->data['url'] — must be nested under "data".
      await api.post(`${API}/user_site`, { data: { url } });
      setNewUrl('');
      load();
    } catch {
      Alert.alert(t('auth.generic_error'));
    } finally {
      setAdding(false);
    }
  }

  function handleDelete(id) {
    Alert.alert(t('user.remove_link_title'), undefined, [
      { text: t('user.cancel'), style: 'cancel' },
      {
        text: t('user.remove'),
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await api.delete(`${API}/user_site/${id}`);
            setLinks(prev => prev.filter(l => l.id !== id));
          } catch {
            Alert.alert(t('auth.generic_error'));
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }

  return (
    <View>
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={styles.loader} />
      ) : links.length === 0 ? (
        <Text style={styles.emptyText}>{t('user.no_extra_links')}</Text>
      ) : (
        links.map(link => (
          <View key={link.id} style={styles.linkRow}>
            <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
            <TouchableOpacity onPress={() => handleDelete(link.id)} disabled={deletingId === link.id} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {deletingId === link.id ? (
                <ActivityIndicator size="small" color="#e74c3c" />
              ) : (
                <Text style={styles.removeIcon}>🗑️</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}

      <View style={styles.addRow}>
        <TextInput
          style={styles.addInput}
          placeholder={t('user.add_link_placeholder')}
          placeholderTextColor="#aaa"
          value={newUrl}
          onChangeText={setNewUrl}
          autoCapitalize="none"
          keyboardType="url"
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={adding || !newUrl.trim()} activeOpacity={0.8}>
          {adding ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.addBtnText}>{t('user.add')}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginVertical: 12 },
  emptyText: { color: '#888', fontSize: 13, marginBottom: 12 },
  linkRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  linkUrl: { flex: 1, fontSize: 14, color: COLORS.primary, marginRight: 12 },
  removeIcon: { fontSize: 16 },
  addRow: { flexDirection: 'row', marginTop: 14, gap: 10 },
  addInput: {
    flex: 1, borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#222',
  },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
