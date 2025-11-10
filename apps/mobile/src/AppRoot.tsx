import React from 'react';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FatalPayload = { error: Error | null; isFatal: boolean };

const fatalState: FatalPayload = { error: null, isFatal: false };
const fatalSubscribers = new Set<(payload: FatalPayload) => void>();

function notifyFatalSubscribers(payload: FatalPayload) {
  fatalState.error = payload.error;
  fatalState.isFatal = payload.isFatal;
  fatalSubscribers.forEach((listener) => {
    try {
      listener(payload);
    } catch (listenerError) {
      console.error('Fatal listener error', listenerError);
    }
  });
}

function subscribeToFatalErrors(listener: (payload: FatalPayload) => void) {
  fatalSubscribers.add(listener);
  return () => {
    fatalSubscribers.delete(listener);
  };
}

function getFatalState() {
  return fatalState;
}

// set up global error handler to dump full stacks
if (typeof global !== 'undefined' && (global as any).ErrorUtils && typeof (global as any).ErrorUtils.setGlobalHandler === 'function') {
  const prev = (global as any).ErrorUtils.getGlobalHandler
    ? (global as any).ErrorUtils.getGlobalHandler()
    : (global as any).ErrorUtils._globalHandler;
  (global as any).ErrorUtils.setGlobalHandler((err: any, isFatal?: boolean) => {
    console.log('🟥 Global error handler hit:', { message: err?.message, name: err?.name, stack: err?.stack, isFatal });
    if (isFatal) {
      const wrappedError = err instanceof Error ? err : new Error(String(err));
      console.log('[FATAL]', wrappedError.message, wrappedError.stack);
      notifyFatalSubscribers({ error: wrappedError, isFatal: true });
    }
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
  const [fatal, setFatal] = React.useState<FatalPayload>(() => ({ ...getFatalState() }));

  React.useEffect(() => subscribeToFatalErrors((payload) => setFatal({ ...payload })), []);

  return (
    <>
      {fatal.isFatal && fatal.error ? (
        <SafeAreaView
          pointerEvents="none"
          edges={['top']}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#991b1b',
            paddingHorizontal: 16,
            paddingVertical: 10,
            zIndex: 1000,
          }}
        >
          <Text style={{ color: '#fee2e2', fontWeight: '700' }}>App crashed</Text>
          <Text style={{ color: '#fecaca' }} numberOfLines={2}>
            {fatal.error.message}
          </Text>
        </SafeAreaView>
      ) : null}
      <Comp />
    </>
  );
}
