import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/feed/FeedScreen';
import MatchesScreen from '../screens/matches/MatchesScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import CompareScreen from '../screens/compare/CompareScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0b1220', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#f472b6',
        tabBarInactiveTintColor: '#94a3b8',
      }}>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#0b1220' },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Compare" component={CompareScreen} options={{ presentation: 'modal', title: 'Compare Photos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
