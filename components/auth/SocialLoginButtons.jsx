import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../utils/AuthContext';
import { getSocialLoginStatus, startSocialLogin } from '../../utils/socialAuth';
import { GoogleIcon, FacebookIcon } from './ProviderIcons';
import { COLORS } from '../../assets/styles/styles';

// Renders Google/Facebook buttons only for providers the backend reports as
// configured (GET /login/status) — so an unset client_id/secret on the
// backend hides the button instead of showing one that always fails.
//
// Dev-only exception: EXPO_PUBLIC_GOOGLE_CLIENT_ID / EXPO_PUBLIC_FACEBOOK_CLIENT_ID
// (see .env.example) force a provider's button to render in __DEV__ builds
// even if the backend isn't configured yet, so the UI can be previewed
// without real credentials. __DEV__ is false in release builds, so this
// never affects production — but the backend still won't complete a login
// for a provider it hasn't configured, so tapping the button will surface
// whatever error the backend actually returns.
const devForcedStatus = __DEV__ && {
  google: !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  facebook: !!process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_ID,
};

function mergeDevOverride(backendStatus) {
  if (!devForcedStatus) return backendStatus;
  return {
    google: backendStatus.google || devForcedStatus.google,
    facebook: backendStatus.facebook || devForcedStatus.facebook,
  };
}

export default function SocialLoginButtons({ onLoggedIn, onNeedsPassword, style }) {
  const { t } = useTranslation();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState(null);
  const [busyProvider, setBusyProvider] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSocialLoginStatus()
      .then((data) => { if (!cancelled) setStatus(mergeDevOverride(data)); })
      .catch(() => { if (!cancelled) setStatus(mergeDevOverride({ google: false, facebook: false })); });
    return () => { cancelled = true; };
  }, []);

  async function handlePress(provider) {
    setError('');
    setBusyProvider(provider);
    try {
      const result = await startSocialLogin(provider);

      if (result.status === 'login' && result.token) {
        await loginWithToken(result.token);
        onLoggedIn?.();
      } else if (result.status === 'registratione' && result.new_user_email) {
        onNeedsPassword?.(result.new_user_email);
      } else if (result.message) {
        setError(result.message);
      } else {
        setError(t('auth.generic_error'));
      }
    } catch (err) {
      if (err?.message !== 'social_login_cancelled') {
        setError(t('auth.generic_error'));
      }
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
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#999',
    fontSize: 13,
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
    borderColor: '#ddd',
  },
  facebookButton: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  facebookButtonText: {
    color: '#fff',
  },
  error: {
    color: '#e74c3c',
    marginBottom: 12,
    textAlign: 'center',
    fontSize: 14,
  },
});
