import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { getSocialLoginStatus, startSocialLogin, SocialLoginError } from '../../utils/socialAuth';
import { isGateHandled } from '../../utils/accountGate';
import { GoogleIcon, FacebookIcon } from './ProviderIcons';
import { COLORS, FONTS } from '../../assets/styles/styles';

// Google / Facebook buttons (browser flow, utils/socialAuth.js). A provider is
// shown only when GET /login/status reports it configured AND `mobile: true`
// — the backend's app-redirect flow. Without that flag the plain web flow
// would end on the website's login form, so no button is better than a
// broken one.
function visibleProviders(data) {
  const mobile = !!data?.mobile;
  return { google: mobile && !!data?.google, facebook: mobile && !!data?.facebook };
}

// `birthday` (YYYY-MM-DD, optional): sent along so a NEW social account gets
// it right away (the sign-up form passes the date already picked).
export default function SocialLoginButtons({ onLoggedIn, onNeedsPassword, birthday, style }) {
  const { t } = useTranslation();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState(null);
  const [busyProvider, setBusyProvider] = useState(null);
  const [error, setError] = useState('');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSocialLoginStatus()
      .then((data) => { if (!cancelled) setStatus(visibleProviders(data)); })
      .catch(() => { if (!cancelled) setStatus({ google: false, facebook: false }); });
    return () => { cancelled = true; };
  }, []);

  async function handlePress(provider) {
    setError('');
    setDetail('');
    setBusyProvider(provider);
    try {
      const result = await startSocialLogin(provider, { birthday });

      if (result.status === 'login' && result.token) {
        await loginWithToken(result.token);
        onLoggedIn?.();
      } else if (result.status === 'registratione' && result.new_user_email) {
        // setup_key: one-time (1 h) proof that this sign-up may set the password.
        onNeedsPassword?.(result.new_user_email, result.setup_key);
      } else if (result.message) {
        setError(result.message);
      } else {
        setError(t('auth.generic_error'));
      }
    } catch (err) {
      if (err?.message === 'social_login_cancelled' || isGateHandled(err)) return; // banned (exchange) → gate sheet
      const status = err?.response?.status;
      let text;
      if (err instanceof SocialLoginError) {
        // Error code from the deep link (backend mobile_callback).
        text = err.message === 'no_email' ? t('account.social_no_email') : t('account.social_token_rejected');
      } else if (status === 422) {
        text = err?.response?.data?.message && err.step === 'start' ? err.response.data.message : t('account.social_no_email');
      } else if (status === 401 || status === 403 || status === 410) {
        text = t('account.social_token_rejected');
      } else if (typeof err?.response?.data?.message === 'string' && err.response.data.message) {
        text = err.response.data.message;
      } else if (err?.isAxiosError && !err.response) {
        text = t('account.social_network');
      } else {
        text = t('auth.generic_error');
      }
      setError(text);
      // Where it broke, for support / bug reports: "google · exchange · 500".
      const code = err instanceof SocialLoginError ? err.message : (status || err?.code || err?.message || '');
      setDetail([provider, err?.step, code].filter(Boolean).join(' · ').slice(0, 120));
      if (__DEV__) console.warn('[social login]', provider, err?.step, status, err?.message, err?.response?.data);
    } finally {
      setBusyProvider(null);
    }
  }

  if (!status || (!status.google && !status.facebook)) {
    return null;
  }

  return (
    <View style={style}>
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>{t('auth.or')}</Text>
        <View style={styles.dividerLine} />
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}
      {!!error && !!detail && <Text style={styles.detail}>{detail}</Text>}

      {status.google && (
        <TouchableOpacity
          style={[styles.socialButton, styles.googleButton]}
          onPress={() => handlePress('google')}
          disabled={!!busyProvider}
          activeOpacity={0.8}
        >
          {busyProvider === 'google'
            ? <ActivityIndicator color={COLORS.primary} />
            : (
              <View style={styles.socialButtonContent}>
                <GoogleIcon size={18} />
                <Text style={styles.socialButtonText}>{t('auth.continue_with_google')}</Text>
              </View>
            )}
        </TouchableOpacity>
      )}

      {status.facebook && (
        <TouchableOpacity
          style={[styles.socialButton, styles.facebookButton]}
          onPress={() => handlePress('facebook')}
          disabled={!!busyProvider}
          activeOpacity={0.8}
        >
          {busyProvider === 'facebook'
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={styles.socialButtonContent}>
                <FacebookIcon size={18} />
                <Text style={[styles.socialButtonText, styles.facebookButtonText]}>{t('auth.continue_with_facebook')}</Text>
              </View>
            )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.line,
  },
  dividerText: {
    marginHorizontal: 10,
    color: COLORS.muted,
    fontSize: 13, fontFamily: FONTS.body,
  },
  socialButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderColor: COLORS.line,
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 15,
    fontFamily: FONTS.bodySemi,
    color: COLORS.ink,
  },
  facebookButtonText: {
    color: '#fff',
  },
  detail: {
    color: COLORS.muted,
    marginTop: -8,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 11, fontFamily: FONTS.body,
  },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14, fontFamily: FONTS.body,
  },
});
