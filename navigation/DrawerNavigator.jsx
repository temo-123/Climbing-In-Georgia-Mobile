import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';

import index from '../screens/index';
import about_us from '../screens/about_us';
import offline_download from '../screens/offline_download_screen';

import indoors_list from '../screens/lists/indoor_gyms_list';
// import indoor_page from '../screens/article_pages/indoor_gym_page';

import outdoors_list from '../screens/lists/outdoor_spots_list';
// import outdoor_page from '../screens/article_pages/outdoor_spot_page';

import events_list from '../screens/lists/events_list';
// import event_page from '../screens/article_pages/event_page';

import ices_list from '../screens/lists/ice_spots_list';
// import ice_page from '../screens/article_pages/ice_spot_page';

import mountain_routes_list from '../screens/lists/mountain_routes_list';
// import mountain_route_page from '../screens/article_pages/mountain_route_page';

import other_activities_list from '../screens/lists/other_activities_list';
// import other_activity_page from '../screens/article_pages/other_activity_page';

// import workouts_list from '../screens/lists/workouts_list';
// import training from '../screens/training';

// const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function DrawerNavigation () {
    return (
        // <NavigationContainer>
            <Drawer.Navigator>
                <Drawer.Screen name="home" component={index}
                    options={{
                        title: 'Climbing In Georgia',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="outdoors_list" component={outdoors_list} 
                    options={{ 
                        title: 'Outdoor Spots' ,
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="indoors_list" component={indoors_list} 
                    options={{ 
                        title: 'Indoors gyms',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="ices_list" component={ices_list} 
                    options={{ 
                        title: 'Ice & Mix Climbing',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="mountain_routes_list" component={mountain_routes_list} 
                    options={{ 
                        title: 'Mountainering Routes',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        }, 
                    }}
                />

                <Drawer.Screen name="other_activities_list" component={other_activities_list} 
                    options={{ 
                        title: 'Other Activity',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="events_list" component={events_list}
                    options={{
                        title: 'Events & Competition',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="about_us" component={about_us}
                    options={{ title: 'About Us',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Drawer.Screen name="offline_mode" component={offline_download}
                    options={{
                        title: 'Offline Mode',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
            </Drawer.Navigator>
        // </NavigationContainer>
    );
}

export default DrawerNavigation