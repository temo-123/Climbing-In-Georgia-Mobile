// Firebase Analytics is a native module — not available in Expo Go.
// Use require() with try-catch so the app doesn't crash in dev/Expo Go builds.
let _analytics = null;
try {
  _analytics = require('@react-native-firebase/analytics').default;
} catch (_) {}

export const logEvent = async (name, params = {}) => {
  if (!_analytics) return;
  try {
    await _analytics().logEvent(name, params);
  } catch (_) {}
};

export const logScreenView = async (screenName) => {
  if (!_analytics) return;
  try {
    await _analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (_) {}
};
