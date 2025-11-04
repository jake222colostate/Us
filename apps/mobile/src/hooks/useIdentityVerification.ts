import * as React from 'react';
import * as WebBrowser from 'expo-web-browser';
import { getSupabaseClient, apiBaseUrl } from '../api/supabase';
import {
  useAuthStore,
  selectSession,
  selectVerificationStatus,
  type VerificationStatus,
} from '../state/authStore';

const MODE = process.env.EXPO_PUBLIC_VERIFICATION_MODE || 'mock';

async function refreshVerificationFromServer(userId: string): Promise<VerificationStatus> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('profiles')
    .select('verification_status')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return (data?.verification_status as VerificationStatus) ?? 'unverified';
}

type Result = {
  status: VerificationStatus;
  beginVerification: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  isLoading: boolean;
  error?: string;
};

async function startProviderSession() {
  if (!apiBaseUrl) {
    throw new Error('Set EXPO_PUBLIC_API_BASE_URL to point at your backend before enabling provider verification.');
  }
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, '')}/verification/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Failed to start verification session. Configure your backend endpoint.');
  }
  return response.json() as Promise<{ url: string; sessionId: string }>;
}

async function pollProviderStatus(sessionId: string) {
  if (!apiBaseUrl) {
    throw new Error('Set EXPO_PUBLIC_API_BASE_URL to point at your backend before enabling provider verification.');
  }
  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, '')}/verification/status?sessionId=${encodeURIComponent(sessionId)}`,
  );
  if (!response.ok) {
    throw new Error('Unable to fetch verification status from provider.');
  }
  return response.json() as Promise<{ status: string }>;
}

export function useIdentityVerification(): Result {
  const status = useAuthStore(selectVerificationStatus);
  const session = useAuthStore(selectSession);
  const setVerificationStatus = useAuthStore((state) => state.setVerificationStatus);
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const refreshStatus = React.useCallback(async () => {
    if (!session) return;
    try {
      const next = await refreshVerificationFromServer(session.user.id);
      setVerificationStatus(next);
    } catch (err) {
      console.error(err);
      setError('Unable to refresh verification status.');
    }
  }, [session, setVerificationStatus]);

  const beginVerification = React.useCallback(async () => {
    if (!session) {
      setError('Sign in to verify your identity.');
      return;
    }

    setError(undefined);

    if (MODE === 'mock') {
      try {
        setLoading(true);
        const client = getSupabaseClient();
        setVerificationStatus('pending');
        const { data, error: insertError } = await client
          .from('verification_sessions')
          .insert({ user_id: session.user.id, provider: 'mock', status: 'pending', metadata: { mode: 'mock' } })
          .select('*')
          .single();
        if (insertError) throw insertError;
        await new Promise((resolve) => setTimeout(resolve, 600));
        try {
          await WebBrowser.openBrowserAsync('https://example.com/mock-verification');
        } catch {
          // ignore
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
        await client
          .from('verification_sessions')
          .update({ status: 'verified' })
          .eq('id', data.id)
          .eq('user_id', session.user.id);
        setVerificationStatus('verified');
      } catch (err) {
        console.error(err);
        setError('Mock verification failed.');
        setVerificationStatus('rejected');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      setLoading(true);
      setVerificationStatus('pending');
      const client = getSupabaseClient();
      const { url, sessionId } = await startProviderSession();
      await client
        .from('verification_sessions')
        .insert({ user_id: session.user.id, provider: 'provider', status: 'pending', session_id: sessionId })
        .select('*')
        .single();
      await WebBrowser.openBrowserAsync(url);
      const { status: providerStatus } = await pollProviderStatus(sessionId);
      const normalized =
        (providerStatus === 'verified' || providerStatus === 'rejected'
          ? providerStatus
          : 'pending') as VerificationStatus;
      setVerificationStatus(normalized);
      await client
        .from('verification_sessions')
        .update({ status: normalized })
        .eq('session_id', sessionId)
        .eq('user_id', session.user.id);
      if (normalized !== 'pending') {
        await refreshStatus();
      }
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Verification provider not configured.');
    } finally {
      setLoading(false);
    }
  }, [session, setVerificationStatus, refreshStatus]);

  return {
    status,
    beginVerification,
    refreshStatus,
    isLoading,
    error,
  };
}
