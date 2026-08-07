import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';

import index from '../screens/index';
import about_us from '../screens/about_us';
import summits_list from '../screens/summit/SummitsListScreen';
import offline_download from '../screens/offline_download_screen';
import indoors_list from '../screens/lists/indoor_gyms_list';
import outdoors_list from '../screens/lists/outdoor_spots_list';
import events_list from '../screens/lists/events_list';
import ices_list from '../screens/lists/ice_spots_list';
import mountain_routes_list from '../screens/lists/mountain_routes_list';
import other_activities_list from '../screens/lists/other_activities_list';
import CustomDrawerContent from './CustomDrawerContent';
import { COLORS } from '../assets/styles/styles';

const Drawer = createDrawerNavigator();

const headerStyle = {
  backgroundColor: COLORS.primary,
};
const headerTintColor = '#fff';
const headerTitleStyle = { fontWeight: 'bold' };

function DrawerNavigation() {
  const { t } = useTranslation();

  return (
    <Drawer.Navigator drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen name="home" component={index}
        options={{ title: t('nav.home'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="outdoors_list" component={outdoors_list}
        options={{ title: t('nav.outdoor'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="indoors_list" component={indoors_list}
        options={{ title: t('nav.indoor'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="ices_list" component={ices_list}
        options={{ title: t('nav.ice'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="mountain_routes_list" component={mountain_routes_list}
        options={{ title: t('nav.mountain'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="other_activities_list" component={other_activities_list}
        options={{ title: t('nav.other'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="events_list" component={events_list}
        options={{ title: t('nav.events'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="summits_list" component={summits_list}
        options={{ title: t('nav.summits'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="about_us" component={about_us}
        options={{ title: t('nav.about'), headerStyle, headerTintColor, headerTitleStyle }}
      />
      <Drawer.Screen name="offline_mode" component={offline_download}
        options={{ title: t('nav.offline'), headerStyle, headerTintColor, headerTitleStyle }}
      />
    </Drawer.Navigator>
  );
}

export default DrawerNavigation;
