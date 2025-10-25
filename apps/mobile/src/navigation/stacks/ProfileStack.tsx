import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../../screens/main/ProfileScreen';
import { ProfileDetailScreen } from '../../screens/main/ProfileDetailScreen';
import { EditProfileScreen } from '../../screens/main/EditProfileScreen';
import { SettingsScreen } from '../../screens/main/SettingsScreen';
import { LegalScreen } from '../../screens/main/LegalScreen';
import { AccountDeletionScreen } from '../../screens/main/AccountDeletionScreen';

export type ProfileStackParamList = {
  ProfileHome: undefined;
  ProfileDetail: { userId: string };
  EditProfile: undefined;
  Settings: undefined;
  Legal: undefined;
  AccountDeletion: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator = () => (
  <Stack.Navigator>
    <Stack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ProfileDetail" component={ProfileDetailScreen} options={{ title: 'Profile' }} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
    <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    <Stack.Screen name="Legal" component={LegalScreen} options={{ title: 'Legal' }} />
    <Stack.Screen name="AccountDeletion" component={AccountDeletionScreen} options={{ title: 'Delete account' }} />
  </Stack.Navigator>
);
