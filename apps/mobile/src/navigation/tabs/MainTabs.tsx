import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  ActionSheetIOS,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import FeedScreen from '../../screens/feed/FeedScreen';
import LikesScreen from '../../screens/likes/LikesScreen';
import MatchesScreen from '../../screens/matches/MatchesScreen';
import ProfileScreen from '../../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

const PlusButton: React.FC<{ onPress: () => void; focused: boolean }> = ({
  onPress,
  focused,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={{
        top: -16,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#fb4fa7',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Ionicons name="add" size={32} color="#ffffff" />
      </View>
    </TouchableOpacity>
  );
};

export const MainTabs: React.FC = () => {
  const navigation = useNavigation<any>();

  const goToPost = (mode: 'live' | 'take' | 'upload') => {
    // Navigate to PostScreen with the correct mode; the ActionSheet closes automatically.
    navigation.navigate('Post', { mode });
  };

  const handlePlusPress = () => {
    const handleChoice = (index: number) => {
      if (index === 0) {
        goToPost('live');
      } else if (index === 1) {
        goToPost('take');
      } else if (index === 2) {
        goToPost('upload');
      }
      // index 3 = Cancel → do nothing
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'Share a photo',
          message: 'Choose how you want to add a photo.',
          options: [
            'Post Live (1 Hour)',
            'Take Photo (For Feed/Profile)',
            'Upload Photo (For Feed/Profile)',
            'Cancel',
          ],
          cancelButtonIndex: 3,
        },
        handleChoice,
      );
    } else {
      Alert.alert('Share a photo', 'Choose how you want to add a photo.', [
        {
          text: 'Post Live (1 Hour)',
          onPress: () => goToPost('live'),
        },
        {
          text: 'Take Photo (For Feed/Profile)',
          onPress: () => goToPost('take'),
        },
        {
          text: 'Upload Photo (For Feed/Profile)',
          onPress: () => goToPost('upload'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]);
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: '#111827',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'PostTab') {
            // Icon handled by custom button
            return null;
          }

          let iconName: keyof typeof Ionicons.glyphMap = 'grid-outline';

          if (route.name === 'Feed') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Likes') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Matches') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} options={{ title: 'Feed' }} />
      <Tab.Screen name="Likes" component={LikesScreen} options={{ title: 'Likes' }} />
      <Tab.Screen
        name="PostTab"
        component={FeedScreen}
        options={{
          title: '',
          tabBarLabel: '',
          tabBarButton: (props) => (
            <PlusButton
              onPress={handlePlusPress}
              focused={Boolean(props.accessibilityState?.selected)}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Matches"
        component={MatchesScreen}
        options={{ title: 'Matches' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
