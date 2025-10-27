import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { FeedScreen } from '../screens/FeedScreen';
import { MatchesScreen } from '../screens/MatchesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

export type TabParamList = {
  Feed: undefined;
  Matches: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export const Tabs: React.FC = () => (
  <Tab.Navigator
    sceneContainerStyle={{ backgroundColor: colors.background }}
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.textMuted,
      tabBarStyle: {
        backgroundColor: colors.cardBackground,
        borderTopColor: colors.border,
        paddingBottom: 6,
        height: 64,
      },
      tabBarIcon: ({ color, size, focused }) => {
        let iconName: React.ComponentProps<typeof Ionicons>['name'] = 'ellipse';

        if (route.name === 'Feed') {
          iconName = focused ? 'heart' : 'heart-outline';
        } else if (route.name === 'Matches') {
          iconName = focused ? 'chatbubble' : 'chatbubble-outline';
        } else if (route.name === 'Profile') {
          iconName = focused ? 'person' : 'person-outline';
        }

        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    })}
  >
    <Tab.Screen name="Feed" component={FeedScreen} />
    <Tab.Screen name="Matches" component={MatchesScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);
