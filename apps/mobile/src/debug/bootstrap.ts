/* eslint-disable */
import React from 'react';
import { Platform } from 'react-native';

// --- Print versions (helps spot mismatches) ---
function safeGet(pkg: string, key: string) {
  try { return require(pkg)[key]; } catch { return undefined; }
}
function safePkgVersion(pkg: string) {
  try { return require(`${pkg}/package.json`).version; } catch { return 'n/a'; }
}

const react = require('react');
const RN = require('react-native');
const reanimated = (() => { try { return require('react-native-reanimated'); } catch { return null; } })();

console.log('🧭 Runtime diag → Platform:', Platform.OS);
console.log('🧭 React version:', react?.version);
console.log('🧭 React Native version:', RN?.Platform?.constants?.reactNativeVersion || RN?.version || 'n/a');
console.log('🧭 Reanimated present keys:', reanimated ? Object.keys(reanimated).slice(0, 15) : 'NOT FOUND');
console.log('🧭 Reanimated package version:', safePkgVersion('react-native-reanimated'));

// --- Detect duplicate Reacts loaded into bundle (heuristic) ---
try {
  // Metro gives module ids; we can at least test identity of React singleton
  const react2 = require('react');
  console.log('🧭 React identity equal:', react === react2);
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.warn('🧭 React identity check failed:', message);
}

// --- Global error + unhandled promise rejection handlers with big stacks ---
const installGlobalHandlers = () => {
  // RN global
  const EU: any = (globalThis as any).ErrorUtils;
  if (EU && typeof EU.setGlobalHandler === 'function') {
    const prev = EU._globalHandler;
    EU.setGlobalHandler((e: any, isFatal?: boolean) => {
      console.error('🧨 [GlobalHandler] Fatal:', isFatal, '\n', e?.stack || e);
      prev && prev(e, isFatal);
    });
  }
  // Promise rejections
  (globalThis as any).onunhandledrejection = (event: any) => {
    console.error('🧨 [Unhandled Promise Rejection]', event?.reason?.stack || event?.reason || event);
  };
};
installGlobalHandlers();

// --- Reanimated smoke test: will crash early if worklets/plugin aren’t applied ---
try {
  if (reanimated) {
    const { runOnUI, useSharedValue } = reanimated as any;
    // log that we can access useSharedValue (function) and runOnUI
    console.log('🧭 Reanimated sanity: useSharedValue:', typeof useSharedValue, ' runOnUI:', typeof runOnUI);

    // UI-thread ping: if this throws synchronously, plugin likely not applied or JS engine unhappy
    if (typeof runOnUI === 'function') {
      runOnUI(() => {
        'worklet';
        // @ts-ignore
        // poke the global to confirm worklet context
        // eslint-disable-next-line no-undef
        // @ts-ignore
        globalThis.__REANIMATED_WORKLET_OK__ = true;
      })();

      setTimeout(() => {
        // After a tick, see if UI worklet executed
        // @ts-ignore
        const ok = (globalThis as any).__REANIMATED_WORKLET_OK__;
        console.log('🧭 Reanimated UI worklet executed:', !!ok);
      }, 50);
    }
  }
} catch (e) {
  const detail = e instanceof Error ? e.stack ?? e.message : String(e);
  console.error('🧨 Reanimated probe threw:', detail);
}

// --- Wrap the app root with ErrorBoundary to capture render stacks ---
try {
  // For expo-router we can monkey-patch the global component registration to inject our boundary.
  // expo-router/entry sets globalThis.__expo_router_root__
  const installBoundary = () => {
    // @ts-ignore
    const g: any = globalThis;
    const { ErrorBoundary } = require('./ErrorBoundary');
    // If expo-router provides a root setter, wrap once it appears.
    const tryWrap = () => {
      const key = '__expo_router_root__';
      if (g[key] && g[key].$$wrapped !== true) {
        const Orig = g[key];
        const Wrapped = (props: any) => {
          return ErrorBoundary ? ( // fallback in case import fails
            // @ts-ignore
            React.createElement(ErrorBoundary, null, React.createElement(Orig, props))
          ) : React.createElement(Orig, props);
        };
        // Mark to avoid double-wrapping
        // @ts-ignore
        Wrapped.$$wrapped = true;
        g[key] = Wrapped;
        console.log('🧭 ErrorBoundary wrapped around expo-router root');
      }
    };
    setInterval(tryWrap, 50); // quick poll until expo-router sets root
  };
  installBoundary();
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.warn('🧭 Failed to install ErrorBoundary wrapper:', message);
}
