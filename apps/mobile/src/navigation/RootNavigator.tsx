import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import FeedScreen from '../screens/FeedScreen';
import MatchesScreen from '../screens/MatchesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CompareScreen from '../screens/CompareScreen';

export type RootStackParamList = {
  Tabs: undefined;
  Compare: { leftUri: string; rightUri: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator();

function TabsNavigator() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="Feed" component={FeedScreen} />
      <Tabs.Screen name="Matches" component={MatchesScreen} />
      <Tabs.Screen name="Profile" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <NavigationContainer theme={{
      ...DefaultTheme,
      colors: { ...DefaultTheme.colors, background: '#0b0f19' }
    }}>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabsNavigator} options={{ headerShown: false }} />
        <Stack.Screen
          name="Compare"
          component={CompareScreen}
          options={{ presentation: 'modal', title: 'Compare Photos' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
