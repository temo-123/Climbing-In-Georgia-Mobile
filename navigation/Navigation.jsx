import { StyleSheet } from "react-native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer } from '@react-navigation/native';

// import index from '../screens/index';
// import about_us from '../screens/about_us';

// import indoors_list from '../screens/lists/indoor_gyms_list';
import indoor_page from '../screens/article_pages/indoor_gym_page';

// import outdoors_list from '../screens/lists/outdoor_spots_list';
import outdoor_page from '../screens/article_pages/outdoor_spot_page';

// import events_list from '../screens/lists/events_list';
import event_page from '../screens/article_pages/event_page';

// import ices_list from '../screens/lists/ice_spots_list';
import ice_page from '../screens/article_pages/ice_spot_page';

// import mountain_routes_list from '../screens/lists/mountain_routes_list';
import mountain_route_page from '../screens/article_pages/mountain_route_page';

// import other_activities_list from '../screens/lists/other_activities_list';
import other_activity_page from '../screens/article_pages/other_activity_page';

import workouts_list from '../screens/lists/workouts_list';
import training from '../screens/training';

import DrawerNavigator from './DrawerNavigator'

const Stack = createNativeStackNavigator();
// const Drawer = createDrawerNavigator();

const st = {
    headerStyle: {
        backgroundColor: '#279fbb',
    },
    headerTintColor: '#fff',
    headerTitleStyle: {
        fontWeight: 'bold',
    },
}

export const Navigation = () => {
// export default function Navigation() {
    return (
        <NavigationContainer styles={styles.navbar}>
            <Stack.Navigator>
                <Stack.Screen name="index" component={DrawerNavigator} options={{ title: 'Indoors gyms In Georgia', headerShown: false,}} />
                <Stack.Screen name="indoors_list" component={DrawerNavigator} options={{ title: 'Indoors gyms In Georgia', headerShown: false }} />
                {/* <Stack.Screen name="indoors_list" component={indoors_list} options={{ title: 'Indoors gyms In Georgia' }}/> */}
                <Stack.Screen name="indoor_page" component={indoor_page} 
                    options={{ title: 'Indoors gym',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Stack.Screen name="outdoors_list" component={DrawerNavigator} options={{title: 'Outdoor Spots In Geprgia'}} />
                {/* <Stack.Screen name="outdoors_list" component={outdoors_list} options={{ title: 'Outdoor Spots In Geprgia' }}/> */}
                <Stack.Screen name="outdoor_page" component={outdoor_page} 
                    options={{ title: 'Outdoor Spot',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Stack.Screen name="events_list" component={DrawerNavigator} options={{ title: 'Events & Competition' }} />
                {/* <Stack.Screen name="events_list" component={events_list} options={{ title: 'Events & Competition' }}/> */}
                <Stack.Screen name="event_page" component={event_page} 
                    options={{ 
                        title: 'Event',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Stack.Screen name="ices_list" component={DrawerNavigator} options={{ title: 'Ice & Mix Climbing In Georgia' }} />
                {/* <Stack.Screen name="ices_list" component={ices_list} options={{ title: 'Ice & Mix Climbing In Georgia' }}/> */}
                <Stack.Screen name="ice_page" component={ice_page} 
                    options={{ title: 'Ice Climbing Spot',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Stack.Screen name="mountain_routes_list" component={DrawerNavigator} options={{ itle: 'Mountainering Routes In Georgia' }} />
                {/* <Stack.Screen name="mountain_routes_list" component={mountain_routes_list} options={{ title: 'Mountainering Routes In Georgia' }}/> */}
                <Stack.Screen name="mountain_route_page" component={mountain_route_page} 
                    options={{ 
                        title: 'Mountaineering Route',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Stack.Screen name="other_activities_list" component={DrawerNavigator} options={{ title: 'Other Activity In Georgia' }} />
                {/* <Stack.Screen name="other_activities_list" component={other_activities_list} options={{ title: 'Other Activity In Georgia' }}/> */}
                <Stack.Screen name="other_activity_page" component={other_activity_page} 
                    options={{ title: 'Sport Activity',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />

                <Stack.Screen name="workouts_list" component={workouts_list} 
                    options={{ 
                        title: 'Workouts',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
                <Stack.Screen name="training" component={training} 
                    options={{ title: 'Training',
                        headerStyle: {
                            backgroundColor: '#279fbb',
                        },
                        headerTintColor: '#fff',
                        headerTitleStyle: {
                            fontWeight: 'bold',
                        },
                    }}
                />
            </Stack.Navigator>

        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    navbar:{
        headerStyle: {
            backgroundColor: '#279fbb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
            fontWeight: 'bold',
        },
    }
})