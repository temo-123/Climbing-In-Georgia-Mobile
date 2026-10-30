import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { logScreenView } from '../utils/analytics';

import indoor_page from '../screens/article_pages/indoor_gym_page';
import outdoor_page from '../screens/article_pages/outdoor_spot_page';
import event_page from '../screens/article_pages/event_page';
import ice_page from '../screens/article_pages/ice_spot_page';
import mountain_route_page from '../screens/article_pages/mountain_route_page';
import other_activity_page from '../screens/article_pages/other_activity_page';

import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import SocialCreatePasswordScreen from '../screens/auth/SocialCreatePasswordScreen';

import UserProfileScreen from '../screens/user/UserProfileScreen';
import UserOptionsScreen from '../screens/user/UserOptionsScreen';
import UserCommentsScreen from '../screens/user/UserCommentsScreen';
import UserRouteReviewsScreen from '../screens/user/UserRouteReviewsScreen';
import UserAscentsScreen from '../screens/user/UserAscentsScreen';
import UserDonationsScreen from '../screens/user/UserDonationsScreen';
import UserFavoritesScreen from '../screens/user/UserFavoritesScreen';
import ClimbersListScreen from '../screens/user/ClimbersListScreen';
import ClimberProfileScreen from '../screens/user/ClimberProfileScreen';
import MyLogbookScreen from '../screens/user/MyLogbookScreen';
import MyMtpAscentsScreen from '../screens/user/MyMtpAscentsScreen';

import SummitDetailScreen from '../screens/summit/SummitDetailScreen';
import SubmitAscentScreen from '../screens/summit/SubmitAscentScreen';
import QRScannerScreen from '../screens/summit/QRScannerScreen';

import DrawerNavigator from './DrawerNavigator';
import withOfflineGuard from '../components/user/withOfflineGuard';
import { headerOptions, navTheme } from './theme';

const Stack = createNativeStackNavigator();

// The whole user panel is server-backed and has no offline fallback, so while
// the device is offline these render a "not available offline" notice instead
// of mounting screens whose every request is guaranteed to fail. Wrapped once
// at module level so the screen identity stays stable across re-renders.
const OfflineGuardedUserProfileScreen = withOfflineGuard(UserProfileScreen);
const OfflineGuardedUserOptionsScreen = withOfflineGuard(UserOptionsScreen);
const OfflineGuardedUserCommentsScreen = withOfflineGuard(UserCommentsScreen);
const OfflineGuardedUserRouteReviewsScreen = withOfflineGuard(UserRouteReviewsScreen);
const OfflineGuardedUserAscentsScreen = withOfflineGuard(UserAscentsScreen);
const OfflineGuardedUserDonationsScreen = withOfflineGuard(UserDonationsScreen);
const OfflineGuardedUserFavoritesScreen = withOfflineGuard(UserFavoritesScreen);
const OfflineGuardedClimbersListScreen = withOfflineGuard(ClimbersListScreen);
const OfflineGuardedClimberProfileScreen = withOfflineGuard(ClimberProfileScreen);
const OfflineGuardedMyLogbookScreen = withOfflineGuard(MyLogbookScreen);
const OfflineGuardedMyMtpAscentsScreen = withOfflineGuard(MyMtpAscentsScreen);


export const Navigation = () => {
  const { t } = useTranslation();
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef();

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={navTheme}
      onReady={() => {
        routeNameRef.current = navigationRef.getCurrentRoute()?.name;
      }}
      onStateChange={() => {
        const current = navigationRef.getCurrentRoute()?.name;
        if (current && current !== routeNameRef.current) {
          logScreenView(current);
          routeNameRef.current = current;
        }
      }}
    >
      <Stack.Navigator>
        <Stack.Screen
          name="HomeDrawer"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="indoor_page" component={indoor_page}
          options={{ title: t('page.indoor_gym'), ...headerOptions }}
        />
        <Stack.Screen name="outdoor_page" component={outdoor_page}
          options={{ title: t('page.outdoor_spot'), ...headerOptions }}
        />
        <Stack.Screen name="event_page" component={event_page}
          options={{ title: t('page.event'), ...headerOptions }}
        />
        <Stack.Screen name="ice_page" component={ice_page}
          options={{ title: t('page.ice_spot'), ...headerOptions }}
        />
        <Stack.Screen name="mountain_route_page" component={mountain_route_page}
          options={{ title: t('page.mountain_route'), ...headerOptions }}
        />
        <Stack.Screen name="other_activity_page" component={other_activity_page}
          options={{ title: t('page.other_activity'), ...headerOptions }}
        />
        <Stack.Screen name="login"
          component={LoginScreen}
          options={{ title: t('auth.login'), ...headerOptions }}
        />
        <Stack.Screen name="register"
          component={RegisterScreen}
          options={{ title: t('auth.register'), ...headerOptions }}
        />
        <Stack.Screen name="forgot_password"
          component={ForgotPasswordScreen}
          options={{ title: t('auth.forgot_password_title'), ...headerOptions }}
        />
        <Stack.Screen name="social_create_password"
          component={SocialCreatePasswordScreen}
          options={{ title: t('auth.create_password_title'), ...headerOptions }}
        />
        <Stack.Screen name="user_profile"
          component={OfflineGuardedUserProfileScreen}
          options={{ title: t('user.profile'), ...headerOptions }}
        />
        <Stack.Screen name="user_options"
          component={OfflineGuardedUserOptionsScreen}
          options={{ title: t('user.options'), ...headerOptions }}
        />
        <Stack.Screen name="user_comments"
          component={OfflineGuardedUserCommentsScreen}
          options={{ title: t('user.my_comments'), ...headerOptions }}
        />
        <Stack.Screen name="user_route_reviews"
          component={OfflineGuardedUserRouteReviewsScreen}
          options={{ title: t('user.my_route_reviews'), ...headerOptions }}
        />
        <Stack.Screen name="user_ascents"
          component={OfflineGuardedUserAscentsScreen}
          options={{ title: t('user.my_ascents'), ...headerOptions }}
        />
        <Stack.Screen name="user_donations"
          component={OfflineGuardedUserDonationsScreen}
          options={{ title: t('user.my_donations'), ...headerOptions }}
        />
        <Stack.Screen name="user_favorites"
          component={OfflineGuardedUserFavoritesScreen}
          options={{ title: t('user.favorites'), ...headerOptions }}
        />
        <Stack.Screen name="climbers_list"
          component={OfflineGuardedClimbersListScreen}
          options={{ title: t('user.climbers'), ...headerOptions }}
        />
        <Stack.Screen name="climber_profile"
          component={OfflineGuardedClimberProfileScreen}
          options={{ title: t('user.climber_profile'), ...headerOptions }}
        />
        <Stack.Screen name="my_logbook"
          component={OfflineGuardedMyLogbookScreen}
          options={{ title: t('climb.my_logbook'), ...headerOptions }}
        />
        <Stack.Screen name="my_mtp_ascents"
          component={OfflineGuardedMyMtpAscentsScreen}
          options={{ title: t('climb.my_mtp_ascents'), ...headerOptions }}
        />
        <Stack.Screen name="summit_detail"
          component={SummitDetailScreen}
          options={({ route }) => ({ title: route.params?.title ?? t('summit.summit'), ...headerOptions })}
        />
        <Stack.Screen name="submit_ascent"
          component={SubmitAscentScreen}
          options={{ title: t('summit.record_ascent'), ...headerOptions }}
        />
        <Stack.Screen name="qr_scanner"
          component={QRScannerScreen}
          options={{ title: t('summit.scan_qr'), ...headerOptions }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

