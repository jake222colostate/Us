import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import OfflineNotice from './components/OfflineNotice';
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';

export default function RealApp() {
  console.log('🚢 RealApp mounting');
  return (
    <AuthProvider>
      <ToastProvider>
        <SafeAreaProvider>
          <View style={{ flex: 1 }}>
            <OfflineNotice />
            <RootNavigator />
          </View>
        </SafeAreaProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
