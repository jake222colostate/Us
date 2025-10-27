import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Tabs } from './Tabs';
import { ComparePhotosScreen } from '../screens/ComparePhotosScreen';

export type RootStackParamList = {
  Tabs: undefined;
  ComparePhotos: {
    viewerName: string;
    viewerImageUri: string;
    profileName: string;
    profileImageUri: string;
  };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={Tabs} />
    <Stack.Screen
      name="ComparePhotos"
      component={ComparePhotosScreen}
      options={{ presentation: 'modal', animation: 'fade' }}
    />
  </Stack.Navigator>
);
