import React from 'react';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// set up global error handler to dump full stacks
if (typeof global !== 'undefined' && (global as any).ErrorUtils && typeof (global as any).ErrorUtils.setGlobalHandler === 'function') {
  const prev = (global as any).ErrorUtils.getGlobalHandler
    ? (global as any).ErrorUtils.getGlobalHandler()
    : (global as any).ErrorUtils._globalHandler;
  (global as any).ErrorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
    console.log('🟥 Global error handler hit:', { message: err?.message, name: err?.name, stack: err?.stack, isFatal });
    if (prev) prev(err, isFatal);
  });
}

// Global crash logger (web)
if (
  typeof window !== 'undefined' &&
  typeof window.addEventListener === 'function' &&
  typeof window.removeEventListener === 'function'
) {
  const handleError = (e: { error?: unknown; message?: unknown }) => {
    console.log('🟥 window.error:', e.error || e.message || e);
  };
  const handleRejection = (e: { reason?: unknown }) => {
    console.log('🟧 unhandledrejection:', e.reason || e);
  };
  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleRejection);
}

const Fallback = () => (
  <SafeAreaView
    style={{ flex: 1, backgroundColor: '#0b0f19', alignItems: 'center', justifyContent: 'center' }}
    edges={['top']}
  >
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
  console.log('🔍 RealApp module loaded:', mod);
  const comp = (mod && (mod.default || mod)) || null;
  console.log('🔍 RealApp component resolved:', typeof comp);
  RealApp = comp;
} catch (e: any) {
  console.log('🟨 RealApp not found, using Fallback:', e?.message, e?.stack);
}

export default function AppRoot() {
  console.log('🟦 AppRoot render on', Platform.OS);
  const Comp = RealApp ?? Fallback;
  return <Comp />;
}
