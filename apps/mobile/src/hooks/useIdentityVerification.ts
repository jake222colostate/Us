import * as React from 'react';
import { getSupabaseClient } from '../api/supabase';
import {
  useAuthStore,
  selectVerificationStatus,
  selectSession,
  type VerificationStatus,
} from '../state/authStore';

const MODE = process.env.EXPO_PUBLIC_VERIFICATION_MODE || 'mock';

type Result = {
  status: VerificationStatus;
  beginVerification: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  isLoading: boolean;
  error?: string;
};

export function useIdentityVerification(): Result {
  const status = useAuthStore(selectVerificationStatus);
  const session = useAuthStore(selectSession);
  const setVerificationStatus = useAuthStore((state) => state.setVerificationStatus);
  const [isLoading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  const refreshStatus = React.useCallback(async () => {
    if (!session) {
      return;
    }

    if (MODE === 'mock') {
      setVerificationStatus('verified');
      return;
    }

    try {
      setLoading(true);
      const client = getSupabaseClient();
      const { data, error: refreshError } = await client
        .from('profiles')
        .select('verification_status')
        .eq('id', session.user.id)
        .maybeSingle();
      if (refreshError) {
        throw refreshError;
      }
      const nextStatus = (data?.verification_status as VerificationStatus | undefined) ?? 'unverified';
      setVerificationStatus(nextStatus);
    } catch (err) {
      console.error('Verification refresh failed', err);
      setError('Unable to refresh verification status.');
    } finally {
      setLoading(false);
    }
  }, [session, setVerificationStatus]);

  const beginVerification = React.useCallback(async () => {
    if (!session) {
      setError('Sign in to verify your identity.');
      return;
    }

    if (MODE === 'mock') {
      console.log('🪪 Mock verification granted for user', session.user.id);
      setVerificationStatus('verified');
      setError(undefined);
      return;
    }

    setError('Verification provider integration coming soon.');
  }, [session, setVerificationStatus]);

  return {
    status,
    beginVerification,
    refreshStatus,
    isLoading: MODE === 'mock' ? false : isLoading,
    error,
  };
}
