import React, { createContext, useContext, useEffect, useMemo } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../api/supabase';
import { useAuthStore, selectSession, selectIsInitialized } from '../state/authStore';

const verificationMode = process.env.EXPO_PUBLIC_VERIFICATION_MODE || 'mock';

type SignInParams = { email: string; password: string };
type SignUpParams = { email: string; password: string; birthdate?: string };

type AuthContextValue = {
  session: Session | null;
  sessionLoaded: boolean;
  signIn: (params: SignInParams) => Promise<void>;
  signUp: (params: SignUpParams) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const session = useAuthStore(selectSession);
  const sessionLoaded = useAuthStore(selectIsInitialized);
  const setSession = useAuthStore((state) => state.setSession);
  const setVerificationStatus = useAuthStore((state) => state.setVerificationStatus);

  useEffect(() => {
    const client = getSupabaseClient();
    let mounted = true;

    console.log(`🚀 AuthProvider mounted (mode=${verificationMode})`);
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error('Failed to fetch initial session', error);
          return setSession(null).catch((err) => console.error('setSession failed', err));
        }
        return setSession(data.session ?? null).catch((err) => console.error('setSession failed', err));
      })
      .catch((err) => console.error('Unexpected auth bootstrap error', err));

    const { data: listener } = client.auth.onAuthStateChange((event, newSession) => {
      console.log('🔄 Auth state change', { event, user: newSession?.user?.id ?? null });
      setSession(newSession ?? null).catch((err) => console.error('setSession failed', err));
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [setSession, setVerificationStatus]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      sessionLoaded,
      async signIn({ email, password }) {
        const client = getSupabaseClient();
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp({ email, password, birthdate }) {
        const client = getSupabaseClient();
        const { error } = await client.auth.signUp({
          email,
          password,
          options: birthdate ? { data: { birthdate } } : undefined,
        });
        if (error) throw error;
      },
      async signOut() {
        const client = getSupabaseClient();
        await client.auth.signOut();
      },
    }),
    [session, sessionLoaded],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
