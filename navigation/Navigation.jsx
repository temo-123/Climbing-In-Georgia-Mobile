import { StyleSheet } from "react-native";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { useRef } from 'react';
import { logScreenView } from '../utils/analytics';

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
    const navigationRef = useNavigationContainerRef();
    const routeNameRef = useRef();

    return (
        <NavigationContainer
            styles={styles.navbar}
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
                <Stack.Screen name="HomeDrawer" component={DrawerNavigator} options={{ title: 'Climbing In Georgia', headerShown: false,}} />
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