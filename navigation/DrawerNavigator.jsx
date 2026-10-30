import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTranslation } from 'react-i18next';

import index from '../screens/index';
import about_us from '../screens/about_us';
import summits_list from '../screens/summit/SummitsListScreen';
import partners from '../screens/PartnersScreen';
import offline_download from '../screens/offline_download_screen';
import indoors_list from '../screens/lists/indoor_gyms_list';
import outdoors_list from '../screens/lists/outdoor_spots_list';
import events_list from '../screens/lists/events_list';
import ices_list from '../screens/lists/ice_spots_list';
import mountain_routes_list from '../screens/lists/mountain_routes_list';
import other_activities_list from '../screens/lists/other_activities_list';
import CustomDrawerContent from './CustomDrawerContent';
import { drawerHeaderOptions } from './theme';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faHouse, faMountainSun, faHandBackFist, faIcicles, faMountain, faPersonHiking,
  faTrophy, faFlag, faCircleInfo, faDownload, faPeopleArrows,
} from '@fortawesome/free-solid-svg-icons';
import { COLORS, FONTS } from '../assets/styles/styles';

const drawerIcon = (icon) => ({ color }) => <FontAwesomeIcon icon={icon} size={16} color={color} />;

const Drawer = createDrawerNavigator();


function DrawerNavigation() {
  const { t } = useTranslation();

  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        sceneStyle: { backgroundColor: COLORS.chalk },
        drawerStyle: { backgroundColor: COLORS.chalk },
        drawerActiveTintColor: COLORS.primaryDark,
        drawerActiveBackgroundColor: COLORS.primarySoft,
        drawerInactiveTintColor: COLORS.ink2,
        drawerLabelStyle: { fontFamily: FONTS.bodyBold, fontSize: 14 },
        drawerItemStyle: { borderRadius: 12 },
      }}
    >
      <Drawer.Screen name="home" component={index}
        options={{ drawerIcon: drawerIcon(faHouse), title: t('nav.home'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="outdoors_list" component={outdoors_list}
        options={{ drawerIcon: drawerIcon(faMountainSun), title: t('nav.outdoor'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="indoors_list" component={indoors_list}
        options={{ drawerIcon: drawerIcon(faHandBackFist), title: t('nav.indoor'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="ices_list" component={ices_list}
        options={{ drawerIcon: drawerIcon(faIcicles), title: t('nav.ice'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="mountain_routes_list" component={mountain_routes_list}
        options={{ drawerIcon: drawerIcon(faMountain), title: t('nav.mountain'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="other_activities_list" component={other_activities_list}
        options={{ drawerIcon: drawerIcon(faPersonHiking), title: t('nav.other'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="events_list" component={events_list}
        options={{ drawerIcon: drawerIcon(faTrophy), title: t('nav.events'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="partners" component={partners}
        options={{ drawerIcon: drawerIcon(faPeopleArrows), title: t('nav.partners'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="summits_list" component={summits_list}
        options={{ drawerIcon: drawerIcon(faFlag), title: t('nav.summits'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="about_us" component={about_us}
        options={{ drawerIcon: drawerIcon(faCircleInfo), title: t('nav.about'), ...drawerHeaderOptions }}
      />
      <Drawer.Screen name="offline_mode" component={offline_download}
        options={{ drawerIcon: drawerIcon(faDownload), title: t('nav.offline'), ...drawerHeaderOptions }}
      />
    </Drawer.Navigator>
  );
}

export default DrawerNavigation;
