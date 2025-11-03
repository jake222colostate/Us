import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View } from 'react-native';
import RootNavigator from './navigation/RootNavigator';
import OfflineNotice from './components/OfflineNotice';
export default function RealApp() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <OfflineNotice />
        <RootNavigator />
      </View>
    </SafeAreaProvider>
  );
}
