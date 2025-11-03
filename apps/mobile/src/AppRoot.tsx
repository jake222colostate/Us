import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';

// Global crash logger (web)
if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function' &&
  typeof window.removeEventListener === 'function'
) {
  const handleError = (e: { error?: unknown; message?: unknown }) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('🟥 window.error:', e.error || e.message || e);
    }
  };
  const handleRejection = (e: { reason?: unknown }) => {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.error('🟧 unhandledrejection:', e.reason || e);
    }
  };
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
}

const Fallback = () => (
  <SafeAreaView style={{ flex: 1, backgroundColor: '#0b0f19', alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ padding: 16, borderRadius: 12, backgroundColor: '#111827' }}>
      <Text style={{ color: '#72f1b8', fontSize: 18, marginBottom: 8 }}>✅ Fallback UI mounted</Text>
      <Text style={{ color: '#9ab' }}>Looking for <Text style={{color:'#fff'}}>src/RealApp.tsx</Text>…</Text>
    </View>
  </SafeAreaView>
);

// Try to load the real app without introducing any import cycles
let RealApp: React.ComponentType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('./RealApp');
  RealApp = (mod && (mod.default || mod)) || null;
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.debug('🟩 RealApp resolved:', !!RealApp);
  }
} catch (e) {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.debug('🟨 RealApp not found, using Fallback:', e);
  }
}

export default function AppRoot() {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.debug('🟦 AppRoot render');
  }
  const Comp = RealApp ?? Fallback;
  return <Comp />;
}
