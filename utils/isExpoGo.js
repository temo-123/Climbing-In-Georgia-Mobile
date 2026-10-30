import Constants, { ExecutionEnvironment } from 'expo-constants';

// Running inside Expo Go (not a dev / release build)? `Constants.appOwnership`
// is deprecated and no longer reports 'expo' on SDK 58, which let
// expo-notifications load in Expo Go and crash on the missing
// ExpoApplication native module — `executionEnvironment` is the supported check.
export const IS_EXPO_GO =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient || Constants.appOwnership === 'expo';
