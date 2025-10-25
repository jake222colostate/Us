import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { FeedScreen } from '../../screens/main/FeedScreen';
import { LikesScreen } from '../../screens/main/LikesScreen';
import { ComposeScreen } from '../../screens/main/ComposeScreen';
import { ProfileStackNavigator } from '../stacks/ProfileStack';
import { useTheme } from '@us/ui';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MainTabParamList = {
  Feed: undefined;
  Likes: undefined;
  Compose: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Feed'
              ? 'cards-outline'
              : route.name === 'Likes'
              ? 'heart-outline'
              : route.name === 'Compose'
              ? 'image-plus'
              : 'account-circle';
          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Compose" component={ComposeScreen} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};
