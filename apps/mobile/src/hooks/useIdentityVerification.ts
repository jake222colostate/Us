import { useCallback, useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { api, type VerificationStatus } from '@us/api-client';
import {
  selectVerificationStatus,
  useAuthStore,
} from '../state/authStore';

export function useIdentityVerification() {
  const status = useAuthStore(selectVerificationStatus);
  const setVerificationStatus = useAuthStore((state) => state.setVerificationStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await api.verification.getStatus();
      setVerificationStatus(response.status as VerificationStatus);
      return response.status as VerificationStatus;
    } catch (err) {
      console.error(err);
      setError('Unable to refresh verification status.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setVerificationStatus]);

  const beginVerification = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const session = await api.verification.createSession();
      if (session.status) {
        setVerificationStatus(session.status as VerificationStatus);
      }
      if (session.url) {
        await WebBrowser.openBrowserAsync(session.url);
      }
      await refreshStatus();
    } catch (err) {
      console.error(err);
      setError('Unable to start verification right now. Please try again soon.');
    } finally {
      setIsLoading(false);
    }
  }, [refreshStatus, setVerificationStatus]);

  const clearError = useCallback(() => setError(null), []);

  return {
    status,
    beginVerification,
    refreshStatus,
    isLoading,
    error,
    clearError,
  };
}
