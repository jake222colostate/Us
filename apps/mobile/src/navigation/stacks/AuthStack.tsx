import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { WelcomeScreen } from '../../screens/auth/WelcomeScreen';
import { SignInScreen } from '../../screens/auth/SignInScreen';
import { SignUpScreen } from '../../screens/auth/SignUpScreen';
import { AgeGateScreen } from '../../screens/auth/AgeGateScreen';

export type AuthStackParamList = {
  Welcome: undefined;
  AgeGate: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="AgeGate" component={AgeGateScreen} />
    <Stack.Screen name="SignIn" component={SignInScreen} />
    <Stack.Screen name="SignUp" component={SignUpScreen} />
  </Stack.Navigator>
);
