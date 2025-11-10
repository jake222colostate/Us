import React, { useMemo, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        tabBar: {
          backgroundColor: tabBackground,
          borderTopColor: borderColor,
          height: 72,
          paddingBottom: 12,
          paddingTop: 8,
        },
        postButtonContainer: {
          top: -22,
          alignItems: 'center',
          justifyContent: 'center',
        },
        postButtonPressed: {
          opacity: 0.85,
        },
        postButton: {
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f472b6',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDarkMode ? 0.45 : 0.2,
          shadowRadius: 8,
          elevation: 6,
        },
        postButtonFocused: {
          shadowOpacity: isDarkMode ? 0.6 : 0.3,
        },
      }),
    [borderColor, isDarkMode, tabBackground],
  );

  const PostTabBarButton = useMemo(
    () =>
      React.forwardRef<View, BottomTabBarButtonProps>(
        ({ children, style, ...props }, ref) => (
          <Pressable
            {...props}
            ref={ref}
            style={({ pressed }) =>
              StyleSheet.flatten([
                styles.postButtonContainer,
                style,
                pressed && styles.postButtonPressed,
              ])
            }
            accessibilityRole="button"
          >
            {children}
          </Pressable>
        ),
      ),
    [styles],
  );
  PostTabBarButton.displayName = 'PostTabBarButton';

  const renderPostButton = useCallback(
    (props: BottomTabBarButtonProps) => (
      // @ts-expect-error React Navigation mixes legacy refs that don't match Pressable's ref type
      <PostTabBarButton {...props} />
    ),
    [PostTabBarButton],
  );

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
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
              return (
                <View style={[styles.postButton, focused && styles.postButtonFocused]}>
                  <Ionicons name="add" size={32} color="#fff" />
                </View>
              );
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
      <Tab.Screen
        name="Post"
        component={PostScreen}
        options={{
          tabBarLabel: () => null,
          tabBarButton: renderPostButton,
        }}
      />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
