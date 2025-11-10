import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppState, type AppStateStatus, View } from 'react-native';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import RootNavigator from './navigation/RootNavigator';
import OfflineNotice from './components/OfflineNotice';
import { AuthProvider } from './providers/AuthProvider';
import { ToastProvider } from './providers/ToastProvider';

export default function RealApp() {
  console.log('🚢 RealApp mounting');
  const queryClientRef = React.useRef<QueryClient | null>(null);

  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient();
  }

  React.useEffect(() => {
    const handleChange = (status: AppStateStatus) => {
      focusManager.setFocused(status === 'active');
    };
    const subscription = AppState.addEventListener('change', handleChange);
    return () => subscription.remove();
  }, []);

  const queryClient = queryClientRef.current!;
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <SafeAreaProvider>
            <View style={{ flex: 1 }}>
              <OfflineNotice />
              <RootNavigator />
            </View>
          </SafeAreaProvider>
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
