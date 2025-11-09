import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import HomeScreen from './screens/HomeScreen';
import LocationDetailScreen from './screens/LocationDetailScreen';
import MapViewScreen from './screens/MapViewScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <FavoritesProvider>
      <WebSocketProvider>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1a1a2e',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'CrowdSense UB' }}
            />
            <Stack.Screen 
              name="LocationDetail" 
              component={LocationDetailScreen}
              options={{ 
                title: 'Location Details',
                headerBackTitle: ''
              }}
            />
            <Stack.Screen 
              name="MapView" 
              component={MapViewScreen}
              options={{ title: 'Campus Map' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </WebSocketProvider>
    </FavoritesProvider>
  );
}

