import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import myCarsScreen from '../screens/my_cars';
import addNewCarScreen from '../screens/add_new_car';
import HomeScreen from '../screens/HomeScreen';
import ControlScreen from '../screens/ControlScreen';
import userProfileControl from '../screens/user_profile';
import Signin from '../screens/SignIn';
import Signup from '../screens/SignUp';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Garage' 
        screenOptions={{
            headerShown: false,
        }}
      >
        <Stack.Screen name="addNewCar" component={addNewCarScreen} options={{lazy:true}}/>
        <Stack.Screen name="Garage" component={myCarsScreen} options={{lazy:true}}/>
        <Stack.Screen name="Home" component={HomeScreen} options={{lazy:true}} />
        <Stack.Screen name="Control" component={ControlScreen} options={{lazy:true}} />
        <Stack.Screen name="userProfile" component={userProfileControl} options={{lazy:true}} />
        <Stack.Screen name="SignIn" component={Signin} options={{lazy:true}} />
        <Stack.Screen name="SignUp" component={Signup} options={{lazy:true}} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
