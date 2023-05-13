import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

// import { DrawerNavigation } from '@react-navigation/drawer'


import index from '../screens/index';
import about_us from '../screens/about_us';

import indoors_list from '../screens/lists/indoor_gyms_list';
import indoor_page from '../screens/article_pages/indoor_gym_page';

import outdoors_list from '../screens/lists/outdoor_spots_list';
import outdoor_page from '../screens/article_pages/outdoor_spot_page';

import events_list from '../screens/lists/events_list';
import event_page from '../screens/article_pages/event_page';

import ices_list from '../screens/lists/ice_spots_list';
import ice_page from '../screens/article_pages/ice_spot_page';

import mountain_routes_list from '../screens/lists/mountain_routes_list';
import mountain_route_page from '../screens/article_pages/mountain_route_page';

import other_activities_list from '../screens/lists/other_activities_list';
import other_activity_page from '../screens/article_pages/other_activity_page';

import workouts_list from '../screens/lists/workouts_list';
import training from '../screens/training';

const Stack = createNativeStackNavigator();
// const Drawer = DrawerNavigation();

export const Navigation = () => {
    return (
        // <Drawer.Navigator>
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="index" component={index} options={{ title: 'Climbing In Geourgia' }}/>
                <Stack.Screen name="about_us" component={about_us} options={{ title: 'About Us' }}/>

                <Stack.Screen name="indoors_list" component={indoors_list} options={{ title: 'indoors_list' }}/>
                <Stack.Screen name="indoor_page" component={indoor_page} options={{ title: 'indoor_page' }}/>

                <Stack.Screen name="outdoors_list" component={outdoors_list} options={{ title: 'outdoors_list' }}/>
                <Stack.Screen name="outdoor_page" component={outdoor_page} options={{ title: 'outdoor_page' }}/>

                <Stack.Screen name="events_list" component={events_list} options={{ title: 'events_list' }}/>
                <Stack.Screen name="event_page" component={event_page} options={{ title: 'event_page' }}/>

                <Stack.Screen name="ices_list" component={ices_list} options={{ title: 'ices_list' }}/>
                <Stack.Screen name="ice_page" component={ice_page} options={{ title: 'ice_page' }}/>

                <Stack.Screen name="mountain_routes_list" component={mountain_routes_list} options={{ title: 'mountain_routes_list' }}/>
                <Stack.Screen name="mountain_route_page" component={mountain_route_page} options={{ title: 'mountain_route_page' }}/>

                <Stack.Screen name="other_activities_list" component={other_activities_list} options={{ title: 'other_activities_list' }}/>
                <Stack.Screen name="other_activity_page" component={other_activity_page} options={{ title: 'other_activity_page' }}/>

                <Stack.Screen name="workouts_list" component={workouts_list} options={{ title: 'Workouts list' }}/>
                <Stack.Screen name="training" component={training} options={{ title: 'Training', category: 'easy' }}/>
            </Stack.Navigator>
        </NavigationContainer>
        // </Drawer.Navigator>
    );
}

