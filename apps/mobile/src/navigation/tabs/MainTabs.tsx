import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FeedScreen from '../../screens/feed/FeedScreen';
import LikesScreen from '../../screens/likes/LikesScreen';
import MatchesScreen from '../../screens/matches/MatchesScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';
import PostScreen from '../../screens/post/PostScreen';
import { useThemeStore } from '../../state/themeStore';

export type MainTabParamList = {
  Feed: undefined;
  Likes: undefined;
  Post: undefined;
  Matches: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabs = () => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const tabBackground = isDarkMode ? '#0b1220' : '#f4e6ff';
  const borderColor = isDarkMode ? '#1f2937' : '#e5def6';
  const activeTint = '#f472b6';
  const inactiveTint = isDarkMode ? '#94a3b8' : '#7c699b';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: tabBackground, borderTopColor: borderColor },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          switch (route.name) {
            case 'Feed':
              return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />;
            case 'Likes':
              return <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />;
            case 'Post':
              return <Ionicons name={focused ? 'camera' : 'camera-outline'} size={size} color={color} />;
            case 'Matches':
              return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />;
            case 'Profile':
              return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
            default:
              return null;
          }
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen name="Post" component={PostScreen} />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
