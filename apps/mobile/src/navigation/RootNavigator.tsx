import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Text } from 'react-native';
import FeedScreen from '../screens/feed/FeedScreen';
import CompareScreen from '../screens/compare/CompareScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import MatchesScreen from '../screens/matches/MatchesScreen';
import VerifyIdentityScreen from '../screens/verification/VerifyIdentityScreen';
import {
  selectIsAuthenticated,
  selectVerificationStatus,
  useAuthStore,
} from '../state/authStore';

export type MainTabParamList = {
  Feed: undefined;
  Compare: { left?: string; right?: string } | undefined;
  Profile: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type RootStackParamList = {
  VerifyIdentity: undefined;
  MainTabs: { screen?: keyof MainTabParamList; params?: Record<string, unknown> } | undefined;
  Matches: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
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

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0b1220', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#f472b6',
        tabBarInactiveTintColor: '#94a3b8',
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Feed</Text>,
        }}
      />
      <Tab.Screen
        name="Compare"
        component={CompareScreen}
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Compare</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Profile</Text>,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 12 }}>Settings</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#0b1220' },
};

export default function RootNavigator() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const verificationStatus = useAuthStore(selectVerificationStatus);
  const navKey = `${isAuthenticated ? 'auth' : 'guest'}-${verificationStatus}`;

  return (
    <NavigationContainer theme={theme}>
      {isAuthenticated ? (
        <RootStack.Navigator
          key={navKey}
          screenOptions={{
            headerStyle: { backgroundColor: '#0b1220' },
            headerTintColor: '#f8fafc',
            presentation: 'card',
          }}
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
            name="Matches"
            component={MatchesScreen}
            options={{
              title: 'Matches',
            }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthStackNavigator />
      )}
    </NavigationContainer>
  );
}
