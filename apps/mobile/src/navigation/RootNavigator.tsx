import React, { useCallback, useMemo } from 'react';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator, type BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import FeedScreen from '../screens/feed/FeedScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import MatchesScreen from '../screens/matches/MatchesScreen';
import VerifyIdentityScreen from '../screens/verification/VerifyIdentityScreen';
import CompareScreen from '../screens/compare/CompareScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import LikesScreen from '../screens/likes/LikesScreen';
import {
  selectIsAuthenticated,
  selectVerificationStatus,
  selectIsInitialized,
  useAuthStore,
} from '../state/authStore';
import { useThemeStore } from '../state/themeStore';
import { navigationRef, logNavigationReady } from './navigationService';
import { useToast } from '../providers/ToastProvider';
import { usePhotoModeration } from '../hooks/usePhotoModeration';

console.log('🔎 RootNavigator imports:', {
  FeedScreen: typeof FeedScreen,
  ProfileScreen: typeof ProfileScreen,
  SignInScreen: typeof SignInScreen,
  SignUpScreen: typeof SignUpScreen,
  ForgotPasswordScreen: typeof ForgotPasswordScreen,
  MatchesScreen: typeof MatchesScreen,
  VerifyIdentityScreen: typeof VerifyIdentityScreen,
  CompareScreen: typeof CompareScreen,
  SettingsScreen: typeof SettingsScreen,
});

export type MainTabParamList = {
  Feed: undefined;
  Likes: undefined;
  Upload: undefined;
  Matches: undefined;
  Profile: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  VerifyIdentity: undefined;
  MainTabs: { screen?: keyof MainTabParamList; params?: Record<string, unknown> } | undefined;
  Compare:
    | {
        leftPhoto?: string | null;
        rightPhoto?: string | null;
        profile?: {
          id?: string;
          name?: string;
          age?: number;
          bio?: string;
          verification?: { status?: string | null } | null;
          photos?: { url?: string | null; status?: string }[] | null;
        } | null;
      }
    | undefined;
  Settings: undefined;
  ProfileDetail: { userId: string };
  EditProfile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const UploadPlaceholder: React.FC = () => null;

const uploadButtonStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  wrapperPressed: {
    transform: [{ scale: 0.96 }],
  },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 3,
  },
});

const UploadTabButton: React.FC<BottomTabBarButtonProps> = ({
  accessibilityLabel,
  style,
  onPress: _onPress,
  ...rest
}) => {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { uploadPhoto, isUploading } = usePhotoModeration();
  const { show } = useToast();

  const handleUpload = useCallback(async () => {
    if (isUploading) return;
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Create an account to share a new photo.');
      return;
    }

    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.granted) {
        const capture = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
        });

        if (!capture.canceled && capture.assets?.length) {
          const outcome = await uploadPhoto(capture.assets[0].uri);
          if (!outcome.success) {
            Alert.alert('Upload failed', 'We could not add your photo. Please try again.');
          } else {
            show('Photo uploaded! It will appear on your feed after moderation.');
          }
          return;
        }
      } else {
        Alert.alert('Camera access needed', 'Enable camera access to snap a new photo.');
      }

      const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!libraryPermission.granted) {
        return;
      }

      const library = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        selectionLimit: 1,
        quality: 0.85,
      });

      if (!library.canceled && library.assets?.length) {
        const outcome = await uploadPhoto(library.assets[0].uri);
        if (!outcome.success) {
          Alert.alert('Upload failed', 'We could not add your photo. Please try again.');
        } else {
          show('Photo uploaded! It will appear on your feed after moderation.');
        }
      }
    } catch (err) {
      console.error('Photo upload failed', err);
      Alert.alert('Upload failed', 'We could not add your photo. Please try again.');
    }
  }, [isAuthenticated, isUploading, uploadPhoto, show]);

  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? 'Add a new photo'}
      onPress={handleUpload}
      disabled={isUploading}
      style={({ pressed }) => [style, uploadButtonStyles.wrapper, pressed && uploadButtonStyles.wrapperPressed]}
    >
      <View
        style={[
          uploadButtonStyles.circle,
          {
            backgroundColor: '#f472b6',
            borderColor: isDarkMode ? '#0b1220' : '#f4e6ff',
          },
        ]}
      >
        {isUploading ? <ActivityIndicator color="#fff" /> : <Ionicons name="add" size={30} color="#fff" />}
      </View>
    </Pressable>
  );
};

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function Tabs() {
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
          if (route.name === 'Feed') {
            return <Ionicons name={focused ? 'grid' : 'grid-outline'} size={size} color={color} />;
          }
          if (route.name === 'Likes') {
            return <Ionicons name={focused ? 'heart' : 'heart-outline'} size={size} color={color} />;
          }
          if (route.name === 'Matches') {
            return <Ionicons name={focused ? 'chatbubble' : 'chatbubble-outline'} size={size} color={color} />;
          }
          if (route.name === 'Profile') {
            return <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />;
          }
          return null;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Likes" component={LikesScreen} />
      <Tab.Screen
        name="Upload"
        component={UploadPlaceholder}
        options={{
          tabBarLabel: () => null,
          tabBarButton: (props) => <UploadTabButton {...props} />,
        }}
      />
      <Tab.Screen name="Matches" component={MatchesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const isInitialized = useAuthStore(selectIsInitialized);
  const navKey = `${isAuthenticated ? 'auth' : 'guest'}-${verificationStatus}`;
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  const navigationTheme = useMemo(() => {
    if (isDarkMode) {
      return {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: '#0b1220',
          card: '#111b2e',
          border: '#1f2937',
          text: '#f8fafc',
        },
      };
    }
    return {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: '#fdf8ff',
        card: '#ffffff',
        border: '#e5def6',
        text: '#2f0c4d',
      },
    };
  }, [isDarkMode]);

  const headerTint = isDarkMode ? '#f8fafc' : '#2f0c4d';
  const headerBackground = isDarkMode ? '#0b1220' : '#fdf8ff';

  console.log('🔐 auth state:', { isAuthenticated, verificationStatus, navKey });

  if (!isInitialized) {
    return (
      <>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: navigationTheme.colors.background }}>
          <ActivityIndicator color={navigationTheme.colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      <ThemeProvider value={navigationTheme}>
      {isAuthenticated ? (
        <RootStack.Navigator
          key={navKey}
          screenOptions={({ navigation }) => ({
            headerStyle: { backgroundColor: headerBackground },
            headerTintColor: headerTint,
            headerTitleStyle: { color: headerTint },
            headerBackTitleVisible: false,
            presentation: 'card',
            headerLeft: ({ canGoBack, tintColor }) =>
              canGoBack ? (
                <Pressable
                  onPress={() => navigation.goBack()}
                  style={({ pressed }) => [
                    {
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 4,
                    },
                    pressed && { opacity: 0.6 },
                  ]}
                  hitSlop={12}
                >
                  <Ionicons name="chevron-back" size={24} color={tintColor ?? headerTint} />
                  <Text style={{ color: tintColor ?? headerTint, fontWeight: '600' }}>Back</Text>
                </Pressable>
              ) : null,
          })}
        >
          {verificationStatus !== 'verified' && (
            <RootStack.Screen
              name="VerifyIdentity"
              component={VerifyIdentityScreen}
              options={{
                title: 'Verify your identity',
                headerShown: Platform.OS === 'ios',
                presentation: 'modal',
              }}
            />
          )}
          <RootStack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
          <RootStack.Screen
            name="Compare"
            component={CompareScreen}
            options={({ route }) => ({
              title: route.params?.profile?.name ? `Compare ${route.params.profile.name}` : 'Compare photos',
            })}
          />
          <RootStack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Settings',
            }}
          />
          <RootStack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{
              title: 'Edit profile',
            }}
          />
          <RootStack.Screen
            name="ProfileDetail"
            component={PublicProfileScreen}
            options={{
              title: 'Profile',
            }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthStackNavigator />
      )}
      </ThemeProvider>
    </>
  );
}
