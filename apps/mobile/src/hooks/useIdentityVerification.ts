import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '../state/authStore';

type Result = {
  beginVerification: () => Promise<void>;
  isLoading: boolean;
  error?: string;
};

const MODE = process.env.EXPO_PUBLIC_VERIFICATION_MODE || 'mock';

export function useIdentityVerification(): Result {
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  return {
    beginVerification: async () => {
      setError(undefined);

      if (MODE === 'mock') {
        // Simulate a third-party verification:
        // 1) flip to 'pending'
        // 2) after a short delay, mark 'verified'
        // This lets you test the UX end-to-end without a provider account.
        try {
          setLoading(true);
          useAuthStore.setState({ verificationStatus: 'pending' as any });
          // simulate user going to a provider web flow
          await new Promise((r) => setTimeout(r, 500));
          // (optional) fake opening a hosted flow, then instantly "return"
          try { await WebBrowser.openBrowserAsync('about:blank'); } catch { /* ignore */ }
          // complete: mark verified
          await new Promise((r) => setTimeout(r, 1000));
          useAuthStore.setState({ verificationStatus: 'verified' as any });
        } catch (e: any) {
          setError(e?.message || String(e));
        } finally {
          setLoading(false);
        }
        return;
      }

      // === REAL PROVIDER STUB (wire later) ==========================
      // Outline:
      // 1) POST /api/verification/start -> { url, sessionId }
      // 2) open url with WebBrowser, wait for redirect/deeplink
      // 3) GET /api/verification/status?sessionId -> 'pending' | 'verified' | 'rejected'
      // 4) store status in authStore
      try {
        setLoading(true);
        // TODO: implement real start call:
        // const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/verification/start`, { method: 'POST' });
        // const { url, sessionId } = await res.json();
        // await WebBrowser.openBrowserAsync(url);
        // const poll = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/verification/status?sessionId=${sessionId}`);
        // const { status } = await poll.json();
        // useAuthStore.setState({ verificationStatus: status });
        throw new Error('Real provider not yet configured');
      } catch (e: any) {
        setError(e?.message || String(e));
      } finally {
        setLoading(false);
      }
    },
    isLoading,
    error,
  };
}
