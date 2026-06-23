import { StyleSheet } from "react-native";
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

import UserProfileScreen from '../screens/user/UserProfileScreen';
import UserOptionsScreen from '../screens/user/UserOptionsScreen';
import UserCommentsScreen from '../screens/user/UserCommentsScreen';
import UserRouteReviewsScreen from '../screens/user/UserRouteReviewsScreen';
import UserAscentsScreen from '../screens/user/UserAscentsScreen';
import UserDonationsScreen from '../screens/user/UserDonationsScreen';
import UserFavoritesScreen from '../screens/user/UserFavoritesScreen';

import SummitDetailScreen from '../screens/summit/SummitDetailScreen';
import SubmitAscentScreen from '../screens/summit/SubmitAscentScreen';
import QRScannerScreen from '../screens/summit/QRScannerScreen';

import DrawerNavigator from './DrawerNavigator';

const Stack = createNativeStackNavigator();

const headerStyle = { backgroundColor: '#279fbb' };
const headerTintColor = '#fff';
const headerTitleStyle = { fontWeight: 'bold' };

export const Navigation = () => {
  const { t } = useTranslation();
  const navigationRef = useNavigationContainerRef();
  const routeNameRef = useRef();

  return (
    <NavigationContainer
      ref={navigationRef}
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
          options={{ title: t('page.indoor_gym'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="outdoor_page" component={outdoor_page}
          options={{ title: t('page.outdoor_spot'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="event_page" component={event_page}
          options={{ title: t('page.event'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="ice_page" component={ice_page}
          options={{ title: t('page.ice_spot'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="mountain_route_page" component={mountain_route_page}
          options={{ title: t('page.mountain_route'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="other_activity_page" component={other_activity_page}
          options={{ title: t('page.other_activity'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="login"
          component={LoginScreen}
          options={{ title: t('auth.login'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="register"
          component={RegisterScreen}
          options={{ title: t('auth.register'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="forgot_password"
          component={ForgotPasswordScreen}
          options={{ title: t('auth.forgot_password_title'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_profile"
          component={UserProfileScreen}
          options={{ title: t('user.profile'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_options"
          component={UserOptionsScreen}
          options={{ title: t('user.options'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_comments"
          component={UserCommentsScreen}
          options={{ title: t('user.my_comments'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_route_reviews"
          component={UserRouteReviewsScreen}
          options={{ title: t('user.my_route_reviews'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_ascents"
          component={UserAscentsScreen}
          options={{ title: t('user.my_ascents'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_donations"
          component={UserDonationsScreen}
          options={{ title: t('user.my_donations'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="user_favorites"
          component={UserFavoritesScreen}
          options={{ title: t('user.favorites'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="summit_detail"
          component={SummitDetailScreen}
          options={({ route }) => ({ title: route.params?.title ?? t('summit.summit'), headerStyle, headerTintColor, headerTitleStyle })}
        />
        <Stack.Screen name="submit_ascent"
          component={SubmitAscentScreen}
          options={{ title: t('summit.record_ascent'), headerStyle, headerTintColor, headerTitleStyle }}
        />
        <Stack.Screen name="qr_scanner"
          component={QRScannerScreen}
          options={{ title: t('summit.scan_qr'), headerStyle, headerTintColor, headerTitleStyle }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  navbar: {
    headerStyle: { backgroundColor: '#279fbb' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
  },
});
