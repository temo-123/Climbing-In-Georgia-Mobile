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
