import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';

import index from '../screens/index';
import about_us from '../screens/about_us';

import indoors_list from '../screens/lists/indoor_gyms_list';
import outdoors_list from '../screens/lists/outdoor_spots_list';
import events_list from '../screens/lists/events_list';
import ices_list from '../screens/lists/ice_spots_list';
import mountain_routes_list from '../screens/lists/mountain_routes_list';
import other_activities_list from '../screens/lists/other_activities_list';

import workouts_list from '../screens/lists/workouts_list';

const Stack = createNativeStackNavigator();

export const Navigation = () => {
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="index" component={index} options={{ title: 'Climbing In Geourgia' }}/>
                <Stack.Screen name="about_us" component={about_us} options={{ title: 'About Us' }}/>

                <Stack.Screen name="indoors_list" component={indoors_list} options={{ title: 'indoors_list' }}/>
                <Stack.Screen name="outdoors_list" component={outdoors_list} options={{ title: 'outdoors_list' }}/>
                <Stack.Screen name="events_list" component={events_list} options={{ title: 'events_list' }}/>
                <Stack.Screen name="ices_list" component={ices_list} options={{ title: 'ices_list' }}/>
                <Stack.Screen name="mountain_routes_list" component={mountain_routes_list} options={{ title: 'mountain_routes_list' }}/>
                <Stack.Screen name="other_activities_list" component={other_activities_list} options={{ title: 'other_activities_list' }}/>

                <Stack.Screen name="workouts_list" component={workouts_list} options={{ title: 'workouts_list' }}/>
                {/* <Stack.Screen name="workout" component={workout} options={{ title: 'workout' }}/> */}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

