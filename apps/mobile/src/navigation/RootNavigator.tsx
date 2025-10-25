import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { AuthStack } from './stacks/AuthStack';
import { MainTabs } from './tabs/MainTabs';
import { useLocationSync } from '../hooks/useLocationSync';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const scheme = useColorScheme();
  const { sessionLoaded, session } = useAuth();
  useLocationSync();

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      {sessionLoaded && (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {session ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Auth" component={AuthStack} />
          )}
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
