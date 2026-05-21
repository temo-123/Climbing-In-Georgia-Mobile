import analytics from '@react-native-firebase/analytics';

export const logEvent = async (name, params = {}) => {
  try {
    await analytics().logEvent(name, params);
  } catch (_) {}
};

export const logScreenView = async (screenName) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (_) {}
};
