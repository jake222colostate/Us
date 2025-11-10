import React, { useCallback, useMemo } from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ChatScreen from '../screens/chat/ChatScreen';
import VerifyIdentityScreen from '../screens/verification/VerifyIdentityScreen';
import CompareScreen from '../screens/compare/CompareScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import PublicProfileScreen from '../screens/profile/PublicProfileScreen';
import QuizScreen from '../screens/quiz/QuizScreen';
import QuizResultsScreen from '../screens/quiz/QuizResultsScreen';
import MyQuizBuilderScreen from '../screens/quiz/MyQuizBuilderScreen';
import {
  selectIsAuthenticated,
  selectVerificationStatus,
  selectIsInitialized,
  useAuthStore,
} from '../state/authStore';
import { useThemeStore } from '../state/themeStore';
import { MainTabs, type MainTabParamList } from './tabs/MainTabs';

export type { MainTabParamList } from './tabs/MainTabs';

console.log('🔎 RootNavigator imports:', {
  SignInScreen: typeof SignInScreen,
  SignUpScreen: typeof SignUpScreen,
  ForgotPasswordScreen: typeof ForgotPasswordScreen,
  VerifyIdentityScreen: typeof VerifyIdentityScreen,
  CompareScreen: typeof CompareScreen,
  SettingsScreen: typeof SettingsScreen,
});

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
        leftUri?: string | null;
        rightUri?: string | null;
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
  MyQuizBuilder: undefined;
  Chat: {
    matchId: string;
    userId: string;
    name: string | null;
    avatar: string | null;
    createdAt: string;
  };
  Quiz:
    | {
        quizId?: string;
        ownerId?: string;
        ownerName?: string;
      }
    | undefined;
  QuizResults:
    | {
        quizId: string;
        mode: 'owner' | 'taker';
        summary?: { score: number | null; maxScore: number | null; title: string };
      }
    | undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();

function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
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
      <NavigationContainer theme={navigationTheme}>
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
          <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
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
            name="MyQuizBuilder"
            component={MyQuizBuilderScreen}
            options={{
              title: 'Create a quiz',
            }}
          />
          <RootStack.Screen
            name="ProfileDetail"
            component={PublicProfileScreen}
            options={{
              title: 'Profile',
            }}
          />
          <RootStack.Screen
            name="Quiz"
            component={QuizScreen}
            options={{
              title: 'Take My Quiz',
            }}
          />
          <RootStack.Screen
            name="QuizResults"
            component={QuizResultsScreen}
            options={{
              title: 'Quiz results',
            }}
          />
          <RootStack.Screen
            name="Chat"
            component={ChatScreen}
            options={{
              title: 'Chat',
            }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthStackNavigator />
      )}
      </NavigationContainer>
    </>
  );
}
