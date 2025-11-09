import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import HomeScreen from './screens/HomeScreen';
import LocationDetailScreen from './screens/LocationDetailScreen';
import MapViewScreen from './screens/MapViewScreen';

const Stack = createNativeStackNavigator();

function Navigation() {
  const { colors, isDark } = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.headerText,
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
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <WebSocketProvider>
          <Navigation />
        </WebSocketProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}

