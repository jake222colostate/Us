import { SafeAreaView } from 'react-native';
import React from 'react';
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
          
            <View style={{ flex: 1 }}>
              <OfflineNotice />
              <RootNavigator />
            </View>
          
        </ToastProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}